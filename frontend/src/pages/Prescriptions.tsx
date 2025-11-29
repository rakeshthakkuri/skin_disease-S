import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Globe, Pill, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
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
      
      <div className="space-y-4">
        {prescriptions.map((prescription) => {
          const translated = translatedContent[`${prescription.id}_${language}`]
          const displayMeds = translated?.medications || prescription.medications
          const displayRecs = translated?.lifestyle_recommendations || prescription.lifestyle_recommendations
          const displayInstructions = translated?.follow_up_instructions || prescription.follow_up_instructions
          
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
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">Prescription #{prescription.id}</h3>
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getSeverityColor(prescription.severity))}>
                            {getSeverityLabel(prescription.severity)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{prescription.medications.length} medication(s)</p>
                      </div>
                    </div>
                    {expandedId === prescription.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
                
                {expandedId === prescription.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t">
                    <CardContent className="space-y-6">
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

