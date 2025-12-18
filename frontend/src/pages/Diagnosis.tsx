import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Loader2, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn, getSeverityColor, getSeverityLabel } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { diagnosisApi, prescriptionApi } from '@/lib/api'

type Step = 'upload' | 'analyzing' | 'results'

interface DiagnosisResult {
  id: string
  has_acne: boolean
  binary_confidence: number
  severity: string
  confidence: number
  severity_scores: Record<string, number>
  lesion_counts: Record<string, number>
  clinical_notes: string
  recommended_urgency: string
}

export default function Diagnosis() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('upload')
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false)
  const [prescriptionStatus, setPrescriptionStatus] = useState<'idle' | 'pending' | 'generated'>('idle')
  
  const handleAnalyze = useCallback(async (file: File) => {
    setStep('analyzing')
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      // Send empty metadata object
      formData.append('clinical_metadata', JSON.stringify({}))
      
      const response = await diagnosisApi.analyze(formData)
      setResult(response.data)
      setStep('results')
      toast.success('Diagnosis completed!')
    } catch (error: any) {
      console.error('Diagnosis error:', error)
      
      // Check for specific error types
      const errorData = error.response?.data
      const errorCode = errorData?.error
      const errorDetail = errorData?.detail || 'Failed to analyze image'
      
      if (errorCode === 'models_not_loaded') {
        toast.error('ML models are not available. Please contact administrator.')
        console.error('Models not loaded. Hint:', errorData?.hint)
      } else if (error.response?.status === 500) {
        toast.error('Server error: ' + errorDetail)
      } else {
        toast.error(errorDetail || 'Failed to analyze image. Please try again.')
      }
      
      setStep('upload')
    }
  }, [])
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      // Automatically start analysis
      handleAnalyze(file)
    }
  }, [handleAnalyze])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })
  
  
  const handleGeneratePrescription = async () => {
    if (!result) return
    
    setIsGeneratingPrescription(true)
    try {
      const response = await prescriptionApi.generate({ diagnosis_id: result.id })
      const data = response.data
      
      if (data.status === 'pending') {
        setPrescriptionStatus('pending')
        toast.success('Prescription generated and sent for doctor approval!')
      } else {
        setPrescriptionStatus('generated')
        toast.success('Prescription generated!')
      }
    } catch (error) {
      console.error('Prescription error:', error)
      toast.error('Failed to generate prescription.')
    } finally {
      setIsGeneratingPrescription(false)
    }
  }
  
  const reset = () => {
    setStep('upload')
    setResult(null)
    setPrescriptionStatus('idle')
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Skin Diagnosis</h1>
        <p className="text-gray-600 mt-1">Upload a photo for AI-powered acne analysis</p>
      </div>
      
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(['upload', 'analyzing', 'results'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
              step === s ? 'bg-primary-500 text-white' :
              ['upload', 'analyzing', 'results'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            )}>
              {['upload', 'analyzing', 'results'].indexOf(step) > i ? <CheckCircle className="w-5 h-5" /> : i + 1}
            </div>
            {i < 2 && <div className={cn('w-12 h-1 mx-1', ['upload', 'analyzing', 'results'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200')} />}
          </div>
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card variant="glass">
              <CardContent>
                <div
                  {...getRootProps()}
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors',
                    isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-primary-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? 'Drop your image here' : 'Upload Skin Image'}
                  </p>
                  <p className="text-sm text-gray-500">Drag and drop or click to select (max 10MB)</p>
                  <p className="text-xs text-gray-400 mt-2">Image will be analyzed automatically</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {step === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card variant="glass">
              <CardContent className="py-16 text-center">
                <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Image</h3>
                <p className="text-gray-500">Our AI is processing your skin image...</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {step === 'results' && result && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Diagnosis Results</CardTitle>
                    <CardDescription>AI-powered acne analysis</CardDescription>
                  </div>
                  {result.has_acne ? (
                  <span className={cn('px-4 py-2 rounded-full text-sm font-medium', getSeverityColor(result.severity))}>
                    {getSeverityLabel(result.severity)}
                  </span>
                  ) : (
                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                      No Acne Detected
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!result.has_acne ? (
                  /* No Acne Detected */
                  <div className="p-6 border border-green-200 rounded-xl bg-green-50">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-green-900 mb-2">No Acne Detected</h4>
                        <p className="text-sm text-green-700 mb-4">
                          Great news! Our AI analysis indicates that no acne was detected in the uploaded image.
                        </p>
                        <div className="flex items-center justify-between text-xs text-green-600">
                          <span>Detection Confidence</span>
                          <span className="font-bold">{(result.binary_confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-green-200 rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${result.binary_confidence * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Acne Detected - Show Severity */
                  <>
                    {/* Severity Card */}
                    <div className="p-4 border border-gray-200 rounded-xl bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Acne Severity</h4>
                        <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getSeverityColor(result.severity))}>
                          {getSeverityLabel(result.severity)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Confidence</span>
                        <span className="text-xs font-bold text-primary-600">{(result.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${result.confidence * 100}%` }} />
                  </div>
                      {result.severity_scores && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-600 mb-2">All Severities:</p>
                          <div className="space-y-1">
                            {Object.entries(result.severity_scores)
                              .sort(([, a], [, b]) => b - a)
                              .map(([severity, score]) => (
                                <div key={severity} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">{getSeverityLabel(severity)}</span>
                                  <span className="font-medium text-gray-900">{(score * 100).toFixed(1)}%</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Lesion Analysis</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(result.lesion_counts).map(([type, count]) => (
                      <div key={type} className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                        <p className="text-xs text-gray-500 capitalize">{type}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 mb-1">Clinical Notes</h4>
                      <p className="text-sm text-blue-700">{result.clinical_notes}</p>
                    </div>
                  </div>
                </div>
                
                {/* Prescription Status Message */}
                {prescriptionStatus === 'pending' && (
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-yellow-900 mb-1">Prescription Sent for Approval</h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          Your prescription has been generated and forwarded to a doctor for review. 
                          Please wait while the doctor approves your prescription. You will be notified once it's approved.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/app/prescriptions')}
                            className="text-xs"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            View Prescriptions
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generate Prescription Button - Only show if not already generated */}
                {prescriptionStatus === 'idle' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleGeneratePrescription} isLoading={isGeneratingPrescription} className="flex-1">
                      Generate Prescription
                    </Button>
                    <Button variant="outline" onClick={reset}>New Diagnosis</Button>
                  </div>
                )}

                {/* If prescription is generated (approved), show button to view */}
                {prescriptionStatus === 'generated' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => navigate('/app/prescriptions')} className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      View Prescription
                    </Button>
                    <Button variant="outline" onClick={reset}>New Diagnosis</Button>
                  </div>
                )}

                {/* If pending, show new diagnosis button */}
                {prescriptionStatus === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" onClick={reset} className="flex-1">New Diagnosis</Button>
                  </div>
                )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

