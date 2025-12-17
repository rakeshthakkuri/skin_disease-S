import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Globe, Pill, AlertTriangle, ChevronDown, ChevronUp, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn, getSeverityColor, getSeverityLabel } from '@/lib/utils'
import { prescriptionApi } from '@/lib/api'
import { toast } from '@/components/ui/Toaster'

interface Prescription {
  id: string
  severity: string
  status: string
  medications: any[]
  lifestyle_recommendations: string[]
  follow_up_instructions: string
  reasoning: string
  doctor_notes?: string
  approved_at?: string
  created_at: string
}

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [language, setLanguage] = useState<'en' | 'te'>('en')
  const [translatedContent, setTranslatedContent] = useState<Record<string, any>>({})
  
  useEffect(() => {
    loadPrescriptions()
  }, [])
  
  const loadPrescriptions = async () => {
    try {
      const response = await prescriptionApi.list()
      setPrescriptions(response.data)
    } catch (error) {
      console.error('Error loading prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleTranslate = async (prescriptionId: string, targetLang: 'en' | 'te') => {
    try {
      const response = await prescriptionApi.translate({
        prescription_id: prescriptionId,
        target_language: targetLang
      })
      setTranslatedContent({
        ...translatedContent,
        [`${prescriptionId}_${targetLang}`]: response.data.translated_content
      })
      toast.success(`Translated to ${targetLang === 'te' ? 'Telugu' : 'English'}`)
    } catch (error) {
      toast.error('Translation failed')
    }
  }
  
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }
  
  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-20">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Prescriptions Yet</h2>
        <p className="text-gray-500">Complete a diagnosis to generate your first prescription.</p>
      </div>
    )
  }

  // Show all prescriptions (approved, pending, rejected) for patients
  const visiblePrescriptions = prescriptions.filter(p => 
    p.status === 'approved' || p.status === 'pending' || p.status === 'rejected'
  )
  
  // Sort prescriptions: pending first, then rejected, then approved (newest first within each group)
  const sortedPrescriptions = [...visiblePrescriptions].sort((a, b) => {
    const statusOrder = { pending: 0, rejected: 1, approved: 2 }
    const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] || 3) - (statusOrder[b.status as keyof typeof statusOrder] || 3)
    if (statusDiff !== 0) return statusDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  
  // Count prescriptions by status
  const statusCounts = {
    pending: sortedPrescriptions.filter(p => p.status === 'pending').length,
    rejected: sortedPrescriptions.filter(p => p.status === 'rejected').length,
    approved: sortedPrescriptions.filter(p => p.status === 'approved').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Prescriptions</h1>
          <p className="text-gray-600 mt-1">View and manage your treatment plans</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setLanguage('en')} className={cn('px-4 py-2 rounded-md text-sm font-medium transition-colors', language === 'en' ? 'bg-white shadow text-gray-900' : 'text-gray-600')}>
            <Globe className="w-4 h-4 inline mr-1" />English
          </button>
          <button onClick={() => setLanguage('te')} className={cn('px-4 py-2 rounded-md text-sm font-medium transition-colors', language === 'te' ? 'bg-white shadow text-gray-900' : 'text-gray-600')}>
            <Globe className="w-4 h-4 inline mr-1" />తెలుగు
          </button>
        </div>
      </div>

      {/* Status Summary */}
      {sortedPrescriptions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statusCounts.pending > 0 && (
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Pending Approval</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{statusCounts.pending}</p>
            </div>
          )}
          {statusCounts.rejected > 0 && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Rejected</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{statusCounts.rejected}</p>
            </div>
          )}
          {statusCounts.approved > 0 && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Approved</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{statusCounts.approved}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-4">
        {sortedPrescriptions.map((prescription) => {
          // Show status badge
          const getStatusBadge = () => {
            if (prescription.status === 'pending') {
              return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending Approval
                </span>
              )
            }
            if (prescription.status === 'rejected') {
              return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Rejected
                </span>
              )
            }
            if (prescription.status === 'approved') {
              return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Approved
                </span>
              )
            }
            return null
          }

          // Don't show full prescription details if not approved
          const canViewDetails = prescription.status === 'approved'
          const translated = canViewDetails ? translatedContent[`${prescription.id}_${language}`] : null
          const displayMeds = canViewDetails ? (translated?.medications || prescription.medications) : []
          const displayRecs = canViewDetails ? (translated?.lifestyle_recommendations || prescription.lifestyle_recommendations) : []
          const displayInstructions = canViewDetails ? (translated?.follow_up_instructions || prescription.follow_up_instructions) : ''
          
          return (
            <motion.div key={prescription.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card variant="glass">
                <div onClick={() => toggleExpand(prescription.id)} className="p-6 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-gray-900">Prescription #{prescription.id}</h3>
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getSeverityColor(prescription.severity))}>
                            {getSeverityLabel(prescription.severity)}
                          </span>
                          {getStatusBadge()}
                        </div>
                        {canViewDetails ? (
                          <p className="text-sm text-gray-500 mt-1">{prescription.medications.length} medication(s)</p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">
                            {prescription.status === 'pending' 
                              ? 'Awaiting doctor approval'
                              : prescription.status === 'rejected'
                              ? 'Prescription was rejected by doctor'
                              : 'Status: ' + prescription.status}
                          </p>
                        )}
                      </div>
                    </div>
                    {expandedId === prescription.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
                
                {expandedId === prescription.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t">
                    <CardContent className="space-y-6">
                      {!canViewDetails && (
                        <div className={cn(
                          'p-4 rounded-xl',
                          prescription.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
                        )}>
                          <div className="flex items-start gap-3">
                            {prescription.status === 'pending' ? (
                              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <h4 className={cn('text-sm font-medium mb-1', prescription.status === 'pending' ? 'text-yellow-900' : 'text-red-900')}>
                                {prescription.status === 'pending' ? 'Prescription Sent for Doctor Approval' : 'Prescription Rejected'}
                              </h4>
                              <p className={cn('text-sm mb-2', prescription.status === 'pending' ? 'text-yellow-700' : 'text-red-700')}>
                                {prescription.status === 'pending'
                                  ? 'Your prescription has been generated and forwarded to a doctor for review. Please wait while the doctor approves your prescription. You will be able to view the full prescription details once it is approved.'
                                  : prescription.doctor_notes || 'This prescription was rejected by the doctor.'}
                              </p>
                              {prescription.status === 'pending' && (
                                <div className="mt-3 p-2 bg-yellow-100 rounded-lg">
                                  <p className="text-xs text-yellow-800">
                                    <strong>Status:</strong> Awaiting doctor review
                                  </p>
                                </div>
                              )}
                              {prescription.status === 'rejected' && prescription.doctor_notes && (
                                <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-200">
                                  <p className="text-xs font-medium text-red-900 mb-1">Doctor's Notes:</p>
                                  <p className="text-xs text-red-800">{prescription.doctor_notes}</p>
                                </div>
                              )}
                              {prescription.status === 'rejected' && prescription.approved_at && (
                                <div className="mt-2 text-xs text-red-600">
                                  Rejected on: {new Date(prescription.approved_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {canViewDetails && (
                        <>
                          {language === 'te' && !translated && (
                            <Button variant="outline" size="sm" onClick={() => handleTranslate(prescription.id, 'te')}>
                              <Globe className="w-4 h-4 mr-2" />Translate to Telugu
                            </Button>
                          )}
                      
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
                          <Pill className="w-4 h-4" />Medications
                        </h4>
                        <div className="space-y-4">
                          {displayMeds.map((med: any, i: number) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-xl">
                              <h5 className="font-medium text-gray-900 mb-2">{med.name}</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                                <div><span className="text-gray-500">Dosage:</span><p className="font-medium">{med.dosage}</p></div>
                                <div><span className="text-gray-500">Frequency:</span><p className="font-medium">{med.frequency}</p></div>
                                <div><span className="text-gray-500">Duration:</span><p className="font-medium">{med.duration}</p></div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{med.instructions}</p>
                              {med.warnings?.length > 0 && (
                                <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                  <span className="text-xs text-yellow-800">{med.warnings.join(' • ')}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Lifestyle Recommendations</h4>
                        <ul className="space-y-2">
                          {displayRecs.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-green-500">✓</span>{rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Follow-up Instructions</h4>
                        <p className="text-sm text-blue-800">{displayInstructions}</p>
                      </div>
                      
                      {prescription.doctor_notes && (
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                          <h4 className="text-sm font-medium text-green-900 mb-2">Doctor Notes</h4>
                          <p className="text-sm text-green-800">{prescription.doctor_notes}</p>
                        </div>
                      )}
                      </>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

