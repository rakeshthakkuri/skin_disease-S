import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Globe, Pill, AlertTriangle, Loader2, Clock, CheckCircle, XCircle, Volume2, Square } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn, getSeverityColor, getSeverityLabel } from '@/lib/utils'
import { prescriptionApi } from '@/lib/api'
import { translateText } from '@/lib/translate'
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

export default function PrescriptionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState<'en' | 'te' | 'hi'>('en')
  const [translatedContent, setTranslatedContent] = useState<any>(null)
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    if (id) {
      loadPrescription()
    }
  }, [id])

  const loadPrescription = async () => {
    if (!id) return
    try {
      const response = await prescriptionApi.get(id)
      setPrescription(response.data)
    } catch (error) {
      console.error('Error loading prescription:', error)
      toast.error('Failed to load prescription')
      navigate('/app/prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleTranslate = async (targetLang: 'en' | 'te' | 'hi') => {
    if (targetLang === 'en' || !prescription) {
      setTranslatedContent(null)
      setLanguage('en')
      return
    }

    try {
      setTranslating(true)

      const translatedMedications = await Promise.all(
        prescription.medications.map(async (med: any) => {
          const translatedWarnings = Array.isArray(med.warnings)
            ? await Promise.all(
                med.warnings.map((w: string) => translateText(w, targetLang))
              )
            : med.warnings

          return {
            ...med,
            name: await translateText(med.name, targetLang),
            dosage: await translateText(med.dosage, targetLang),
            frequency: await translateText(med.frequency, targetLang),
            duration: await translateText(med.duration, targetLang),
            instructions: await translateText(med.instructions, targetLang),
            warnings: translatedWarnings,
          }
        })
      )

      const translatedLifestyle = await Promise.all(
        prescription.lifestyle_recommendations.map((rec) =>
          translateText(rec, targetLang)
        )
      )

      const translatedFollowUp = await translateText(
        prescription.follow_up_instructions,
        targetLang
      )

      setTranslatedContent({
        medications: translatedMedications,
        lifestyle_recommendations: translatedLifestyle,
        follow_up_instructions: translatedFollowUp,
      })
      setLanguage(targetLang)

      const label =
        targetLang === 'te'
          ? 'Telugu'
          : targetLang === 'hi'
          ? 'Hindi'
          : 'English'
      toast.success(`Translated to ${label}`)
    } catch (error) {
      console.error('Prescription translation failed', error)
      toast.error('Translation failed')
    } finally {
      setTranslating(false)
    }
  }

  const speakPrescription = (
    meds: any[],
    lifestyle: string[],
    followUp: string,
    lang: 'en' | 'te' | 'hi'
  ) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Text-to-speech is not supported on this device.')
      return
    }

    const languageCode =
      lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'te-IN'

    const parts: string[] = []

    if (meds.length) {
      parts.push(
        lang === 'en'
          ? 'Medicines:'
          : lang === 'hi'
          ? 'दवाइयाँ:'
          : 'ఔషధాలు:'
      )
      meds.forEach((med) => {
        parts.push(
          `${med.name}. ${med.dosage ?? ''}. ${med.frequency ?? ''}. ${med.duration ?? ''}. ${med.instructions ?? ''}`
        )
      })
    }

    if (lifestyle.length) {
      parts.push(
        lang === 'en'
          ? 'Lifestyle recommendations:'
          : lang === 'hi'
          ? 'जीवनशैली संबंधी सलाह:'
          : 'జీవనశైలిపై సలహాలు:'
      )
      lifestyle.forEach((item) => parts.push(item))
    }

    if (followUp) {
      parts.push(
        lang === 'en'
          ? 'Follow-up instructions:'
          : lang === 'hi'
          ? 'फॉलो-अप निर्देश:'
          : 'ఫాలో-అప్ సూచనలు:'
      )
      parts.push(followUp)
    }

    const text = parts.join(' ')
    if (!text.trim()) {
      toast.error('Nothing to read for this prescription.')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = languageCode
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }
    window.speechSynthesis.cancel()
  }

  const getStatusBadge = () => {
    if (!prescription) return null
    if (prescription.status === 'pending') {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Pending Approval
        </span>
      )
    }
    if (prescription.status === 'rejected') {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200 flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          Rejected
        </span>
      )
    }
    if (prescription.status === 'approved') {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Approved
        </span>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Prescription Not Found</h2>
        <p className="text-gray-500 mb-4">The prescription you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/app/prescriptions')}>Back to Prescriptions</Button>
      </div>
    )
  }

  const canViewDetails = prescription.status === 'approved'
  const displayMeds = canViewDetails
    ? (translatedContent?.medications || prescription.medications)
    : []
  const displayRecs = canViewDetails
    ? (translatedContent?.lifestyle_recommendations ||
        prescription.lifestyle_recommendations)
    : []
  const displayInstructions = canViewDetails
    ? (translatedContent?.follow_up_instructions ||
        prescription.follow_up_instructions)
    : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/prescriptions')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Prescription #{prescription.id}
          </h1>
          <p className="text-gray-600 mt-1">
            Created on {new Date(prescription.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Status and Language Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              getSeverityColor(prescription.severity)
            )}
          >
            {getSeverityLabel(prescription.severity)}
          </span>
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => handleTranslate('en')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              language === 'en'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-600'
            )}
          >
            <Globe className="w-4 h-4 inline mr-1" />
            English
          </button>
          <button
            onClick={() => handleTranslate('te')}
            disabled={translating}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              language === 'te'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-600',
              translating && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Globe className="w-4 h-4 inline mr-1" />
            తెలుగు
          </button>
          <button
            onClick={() => handleTranslate('hi')}
            disabled={translating}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              language === 'hi'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-600',
              translating && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Globe className="w-4 h-4 inline mr-1" />
            हिन्दी
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass">
          <CardContent className="space-y-6 p-6">
            {!canViewDetails && (
              <div
                className={cn(
                  'p-4 rounded-xl',
                  prescription.status === 'pending'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                )}
              >
                <div className="flex items-start gap-3">
                  {prescription.status === 'pending' ? (
                    <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4
                      className={cn(
                        'text-sm font-medium mb-1',
                        prescription.status === 'pending'
                          ? 'text-yellow-900'
                          : 'text-red-900'
                      )}
                    >
                      {prescription.status === 'pending'
                        ? 'Prescription Sent for Doctor Approval'
                        : 'Prescription Rejected'}
                    </h4>
                    <p
                      className={cn(
                        'text-sm mb-2',
                        prescription.status === 'pending'
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      )}
                    >
                      {prescription.status === 'pending'
                        ? 'Your prescription has been generated and forwarded to a doctor for review. Please wait while the doctor approves your prescription. You will be able to view the full prescription details once it is approved.'
                        : prescription.doctor_notes ||
                          'This prescription was rejected by the doctor.'}
                    </p>
                    {prescription.status === 'pending' && (
                      <div className="mt-3 p-2 bg-yellow-100 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          <strong>Status:</strong> Awaiting doctor review
                        </p>
                      </div>
                    )}
                    {prescription.status === 'rejected' &&
                      prescription.doctor_notes && (
                        <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-200">
                          <p className="text-xs font-medium text-red-900 mb-1">
                            Doctor's Notes:
                          </p>
                          <p className="text-xs text-red-800">
                            {prescription.doctor_notes}
                          </p>
                        </div>
                      )}
                    {prescription.status === 'rejected' &&
                      prescription.approved_at && (
                        <div className="mt-2 text-xs text-red-600">
                          Rejected on:{' '}
                          {new Date(
                            prescription.approved_at
                          ).toLocaleDateString()}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {canViewDetails && (
              <>
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        speakPrescription(
                          displayMeds,
                          displayRecs,
                          displayInstructions,
                          language
                        )
                      }
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      {language === 'en'
                        ? 'Speak'
                        : language === 'hi'
                        ? 'Speak Hindi'
                        : 'Speak Telugu'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={stopSpeaking}>
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                    <Pill className="w-5 h-5" />
                    Medications
                  </h4>
                  <div className="space-y-4">
                    {displayMeds.map((med: any, i: number) => (
                      <div
                        key={i}
                        className="p-5 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <h5 className="font-semibold text-gray-900 mb-3 text-lg">
                          {med.name}
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500 block mb-1">
                              Dosage:
                            </span>
                            <p className="font-medium text-gray-900">
                              {med.dosage}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">
                              Frequency:
                            </span>
                            <p className="font-medium text-gray-900">
                              {med.frequency}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">
                              Duration:
                            </span>
                            <p className="font-medium text-gray-900">
                              {med.duration}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                          {med.instructions}
                        </p>
                        {med.warnings?.length > 0 && (
                          <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-yellow-900 mb-1">
                                Warnings:
                              </p>
                              <ul className="text-xs text-yellow-800 space-y-1">
                                {med.warnings.map((w: string, idx: number) => (
                                  <li key={idx}>• {w}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lifestyle Recommendations */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Lifestyle Recommendations
                  </h4>
                  <ul className="space-y-3">
                    {displayRecs.map((rec: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-100"
                      >
                        <span className="text-green-600 font-bold text-lg flex-shrink-0">
                          ✓
                        </span>
                        <span className="flex-1">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Follow-up Instructions */}
                <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3">
                    Follow-up Instructions
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {displayInstructions}
                  </p>
                </div>

                {/* Doctor Notes */}
                {prescription.doctor_notes && (
                  <div className="p-5 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="text-lg font-semibold text-green-900 mb-3">
                      Doctor Notes
                    </h4>
                    <p className="text-sm text-green-800 leading-relaxed">
                      {prescription.doctor_notes}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

