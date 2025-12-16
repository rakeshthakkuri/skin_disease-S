import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn, getSeverityColor, getSeverityLabel, getAcneTypeLabel, getAcneTypeColor } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { diagnosisApi, prescriptionApi } from '@/lib/api'

type Step = 'upload' | 'metadata' | 'analyzing' | 'results'

interface DiagnosisResult {
  id: string
  severity: string
  confidence: number
  severity_scores: Record<string, number>
  acne_type?: string
  acne_type_confidence?: number
  acne_type_scores?: Record<string, number>
  lesion_counts: Record<string, number>
  clinical_notes: string
  recommended_urgency: string
}

export default function Diagnosis() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('upload')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false)
  
  const [metadata, setMetadata] = useState({
    age: '',
    sex: 'other',
    fitzpatrick_skin_type: 'III',
    skin_type: 'normal',
    acne_duration_months: '',
    previous_treatments: '',
    comorbidities: '',
    allergies: '',
    lifestyle_stress: 'moderate',
    lifestyle_diet: '',
  })
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
      setStep('metadata')
    }
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image) return
    
    setStep('analyzing')
    
    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('clinical_metadata', JSON.stringify({
        age: parseInt(metadata.age) || 25,
        sex: metadata.sex,
        fitzpatrick_skin_type: metadata.fitzpatrick_skin_type,
        skin_type: metadata.skin_type,
        acne_duration_months: parseInt(metadata.acne_duration_months) || 6,
        previous_treatments: metadata.previous_treatments ? metadata.previous_treatments.split(',').map(s => s.trim()) : [],
        comorbidities: metadata.comorbidities ? metadata.comorbidities.split(',').map(s => s.trim()) : [],
        allergies: metadata.allergies ? metadata.allergies.split(',').map(s => s.trim()) : [],
        lifestyle_factors: {
          stress_level: metadata.lifestyle_stress,
          diet: metadata.lifestyle_diet,
        },
      }))
      
      const response = await diagnosisApi.analyze(formData)
      setResult(response.data)
      setStep('results')
      toast.success('Diagnosis completed!')
    } catch (error) {
      console.error('Diagnosis error:', error)
      toast.error('Failed to analyze image. Please try again.')
      setStep('metadata')
    }
  }
  
  const handleGeneratePrescription = async () => {
    if (!result) return
    
    setIsGeneratingPrescription(true)
    try {
      await prescriptionApi.generate({ diagnosis_id: result.id })
      toast.success('Prescription generated!')
      navigate('/app/prescriptions')
    } catch (error) {
      console.error('Prescription error:', error)
      toast.error('Failed to generate prescription.')
    } finally {
      setIsGeneratingPrescription(false)
    }
  }
  
  const reset = () => {
    setStep('upload')
    setImage(null)
    setImagePreview(null)
    setResult(null)
    setMetadata({ 
      age: '', 
      sex: 'other',
      fitzpatrick_skin_type: 'III',
      skin_type: 'normal', 
      acne_duration_months: '', 
      previous_treatments: '', 
      comorbidities: '',
      allergies: '',
      lifestyle_stress: 'moderate',
      lifestyle_diet: '',
    })
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Skin Diagnosis</h1>
        <p className="text-gray-600 mt-1">Upload a photo for AI-powered acne analysis</p>
      </div>
      
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(['upload', 'metadata', 'analyzing', 'results'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
              step === s ? 'bg-primary-500 text-white' :
              ['upload', 'metadata', 'analyzing', 'results'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            )}>
              {['upload', 'metadata', 'analyzing', 'results'].indexOf(step) > i ? <CheckCircle className="w-5 h-5" /> : i + 1}
            </div>
            {i < 3 && <div className={cn('w-12 h-1 mx-1', ['upload', 'metadata', 'analyzing', 'results'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200')} />}
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
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {step === 'metadata' && (
          <motion.div key="metadata" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Clinical Information</CardTitle>
                <CardDescription>Provide details for more accurate analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    <div className="relative rounded-xl overflow-hidden">
                      {imagePreview && <img src={imagePreview} alt="Uploaded" className="w-full aspect-square object-cover" />}
                      <button onClick={reset} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                    {/* Demographics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                        <input type="number" min="10" max="100" value={metadata.age} onChange={(e) => setMetadata({ ...metadata, age: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                        <select value={metadata.sex} onChange={(e) => setMetadata({ ...metadata, sex: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" required>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Skin Characteristics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fitzpatrick Skin Type *</label>
                        <select value={metadata.fitzpatrick_skin_type} onChange={(e) => setMetadata({ ...metadata, fitzpatrick_skin_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" required>
                          <option value="I">Type I - Very fair, always burns</option>
                          <option value="II">Type II - Fair, usually burns</option>
                          <option value="III">Type III - Medium, sometimes burns</option>
                          <option value="IV">Type IV - Olive, rarely burns</option>
                          <option value="V">Type V - Brown, very rarely burns</option>
                          <option value="VI">Type VI - Dark brown/black, never burns</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skin Type</label>
                        <select value={metadata.skin_type} onChange={(e) => setMetadata({ ...metadata, skin_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                          <option value="oily">Oily</option>
                          <option value="dry">Dry</option>
                          <option value="combination">Combination</option>
                          <option value="normal">Normal</option>
                          <option value="sensitive">Sensitive</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Acne History */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acne Duration (months) *</label>
                      <input type="number" min="0" max="120" value={metadata.acne_duration_months} onChange={(e) => setMetadata({ ...metadata, acne_duration_months: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" required />
                    </div>
                    
                    {/* Medical History */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Previous Treatments (comma-separated)</label>
                      <input type="text" value={metadata.previous_treatments} onChange={(e) => setMetadata({ ...metadata, previous_treatments: e.target.value })} placeholder="e.g., isotretinoin 6 months ago, benzoyl peroxide" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                      <p className="text-xs text-gray-500 mt-1">Include treatment name and timeframe if known</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Comorbidities (comma-separated)</label>
                      <input type="text" value={metadata.comorbidities} onChange={(e) => setMetadata({ ...metadata, comorbidities: e.target.value })} placeholder="e.g., pregnancy, PCOS, diabetes" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                      <p className="text-xs text-gray-500 mt-1">Important: Include pregnancy status if applicable</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (comma-separated)</label>
                      <input type="text" value={metadata.allergies} onChange={(e) => setMetadata({ ...metadata, allergies: e.target.value })} placeholder="e.g., penicillin, sulfa drugs" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                    </div>
                    
                    {/* Lifestyle Factors (Optional) */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Lifestyle Factors (Optional)</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stress Level</label>
                          <select value={metadata.lifestyle_stress} onChange={(e) => setMetadata({ ...metadata, lifestyle_stress: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                            <option value="low">Low</option>
                            <option value="moderate">Moderate</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Diet Notes</label>
                          <input type="text" value={metadata.lifestyle_diet} onChange={(e) => setMetadata({ ...metadata, lifestyle_diet: e.target.value })} placeholder="e.g., high dairy, high sugar" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                        </div>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full">Analyze Image</Button>
                  </form>
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
                    <CardDescription>AI-powered acne severity assessment</CardDescription>
                  </div>
                  <span className={cn('px-4 py-2 rounded-full text-sm font-medium', getSeverityColor(result.severity))}>
                    {getSeverityLabel(result.severity)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Type and Severity Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Acne Type Card */}
                  {result.acne_type && (
                    <div className="p-4 border border-gray-200 rounded-xl bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Acne Type</h4>
                        <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getAcneTypeColor(result.acne_type))}>
                          {getAcneTypeLabel(result.acne_type)}
                        </span>
                      </div>
                      {result.acne_type_confidence !== undefined && (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Confidence</span>
                            <span className="text-xs font-bold text-primary-600">{(result.acne_type_confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${result.acne_type_confidence * 100}%` }} />
                          </div>
                        </>
                      )}
                      {result.acne_type_scores && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-600 mb-2">All Types:</p>
                          <div className="space-y-1">
                            {Object.entries(result.acne_type_scores)
                              .sort(([, a], [, b]) => b - a)
                              .map(([type, score]) => (
                                <div key={type} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">{getAcneTypeLabel(type)}</span>
                                  <span className="font-medium text-gray-900">{(score * 100).toFixed(1)}%</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Severity Card */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Severity</h4>
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
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleGeneratePrescription} isLoading={isGeneratingPrescription} className="flex-1">
                    Generate Prescription
                  </Button>
                  <Button variant="outline" onClick={reset}>New Diagnosis</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

