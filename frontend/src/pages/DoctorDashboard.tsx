import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, CheckCircle, XCircle, Clock, User, Image as ImageIcon, Eye, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn, getSeverityColor, getSeverityLabel } from '@/lib/utils'
import { doctorApi } from '@/lib/api'
import { toast } from '@/components/ui/Toaster'

interface PendingPrescription {
  id: string
  patient: {
    id: string
    name: string
    email: string
  }
  diagnosis: {
    id: string
    severity: string
    confidence: number
    lesion_counts: Record<string, number>
    clinical_notes: string
    image_url: string
    created_at: string
  } | null
  prescription: {
    severity: string
    medications: any[]
    lifestyle_recommendations: string[]
    follow_up_instructions: string
    reasoning: string
  }
  created_at: string
}

interface ApprovedPrescription extends PendingPrescription {
  status: string
  doctor_notes?: string | null
  approved_at?: string | null
}

type TabType = 'pending' | 'approved'

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [pendingPrescriptions, setPendingPrescriptions] = useState<PendingPrescription[]>([])
  const [approvedPrescriptions, setApprovedPrescriptions] = useState<ApprovedPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    loadPrescriptions()
  }, [])

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingPrescriptions()
    } else {
      loadApprovedPrescriptions()
    }
  }, [activeTab])

  const loadPrescriptions = async () => {
    setLoading(true)
    try {
      await Promise.all([loadPendingPrescriptions(), loadApprovedPrescriptions()])
    } finally {
      setLoading(false)
    }
  }

  const loadPendingPrescriptions = async () => {
    try {
      const response = await doctorApi.getPendingPrescriptions()
      setPendingPrescriptions(response.data)
    } catch (error) {
      console.error('Error loading pending prescriptions:', error)
      toast.error('Failed to load pending prescriptions')
    }
  }

  const loadApprovedPrescriptions = async () => {
    try {
      const response = await doctorApi.getAllPrescriptions()
      const approved = response.data.filter((p: any) => p.status === 'approved')
      setApprovedPrescriptions(approved)
    } catch (error) {
      console.error('Error loading approved prescriptions:', error)
      toast.error('Failed to load approved prescriptions')
    }
  }

  const handleApprove = async (id: string) => {
    setActionType('approve')
    setShowNotesModal(true)
    setSelectedId(id)
  }

  const handleReject = async (id: string) => {
    setActionType('reject')
    setShowNotesModal(true)
    setSelectedId(id)
  }

  const confirmAction = async () => {
    if (!selectedId) return

    try {
      if (actionType === 'approve') {
        setApprovingId(selectedId)
        await doctorApi.approvePrescription(selectedId, doctorNotes || undefined)
        toast.success('Prescription approved successfully')
      } else if (actionType === 'reject') {
        if (!doctorNotes.trim()) {
          toast.error('Rejection reason is required')
          return
        }
        setRejectingId(selectedId)
        await doctorApi.rejectPrescription(selectedId, doctorNotes)
        toast.success('Prescription rejected')
      }

      setShowNotesModal(false)
      setDoctorNotes('')
      setSelectedId(null)
      setActionType(null)
      loadPrescriptions()
    } catch (error: any) {
      console.error('Error processing prescription:', error)
      toast.error(error.response?.data?.detail || 'Failed to process prescription')
    } finally {
      setApprovingId(null)
      setRejectingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const displayPrescriptions: (PendingPrescription | ApprovedPrescription)[] = activeTab === 'pending' 
    ? pendingPrescriptions 
    : approvedPrescriptions

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-1">Review and manage patient prescriptions</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2',
            activeTab === 'pending'
              ? 'bg-white shadow text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <Clock className="w-4 h-4" />
          New Approvals
          {pendingPrescriptions.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
              {pendingPrescriptions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={cn(
            'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2',
            activeTab === 'approved'
              ? 'bg-white shadow text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <CheckCircle className="w-4 h-4" />
          Already Approved
          {approvedPrescriptions.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
              {approvedPrescriptions.length}
            </span>
          )}
        </button>
      </div>

      {displayPrescriptions.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-16 text-center">
            {activeTab === 'pending' ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Pending Prescriptions</h2>
                <p className="text-gray-500">All prescriptions have been reviewed.</p>
              </>
            ) : (
              <>
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Approved Prescriptions</h2>
                <p className="text-gray-500">No prescriptions have been approved yet.</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayPrescriptions.map((prescription: any) => (
            <motion.div
              key={prescription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card variant="glass">
                <CardHeader>
                    <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary-600" />
                        Prescription #{prescription.id}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{prescription.patient.name}</span>
                          <span className="text-gray-400">•</span>
                          <span>{prescription.patient.email}</span>
                        </div>
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getSeverityColor(prescription.prescription.severity))}>
                          {getSeverityLabel(prescription.prescription.severity)}
                        </span>
                        {activeTab === 'approved' && (prescription as ApprovedPrescription).approved_at && (
                          <span className="text-xs text-gray-500">
                            Approved: {new Date((prescription as ApprovedPrescription).approved_at!).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeTab === 'pending' ? (
                        <>
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-500">Pending</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-500">Approved</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Diagnosis Info */}
                  {prescription.diagnosis && (
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-start gap-3 mb-3">
                        <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">Diagnosis Information</h4>
                          <div className="space-y-1 text-sm text-blue-800">
                            <p><span className="font-medium">Severity:</span> {getSeverityLabel(prescription.diagnosis.severity)}</p>
                            <p><span className="font-medium">Confidence:</span> {(prescription.diagnosis.confidence * 100).toFixed(1)}%</p>
                            <p><span className="font-medium">Clinical Notes:</span> {prescription.diagnosis.clinical_notes}</p>
                          </div>
                          {prescription.diagnosis.image_url && (
                            <div className="mt-3">
                              <img
                                src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${prescription.diagnosis.image_url}`}
                                alt="Diagnosis image"
                                className="w-full max-w-md rounded-lg border border-blue-200"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prescription Details */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Generated Prescription</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Medications ({prescription.prescription.medications.length})</p>
                        <div className="space-y-2">
                          {prescription.prescription.medications.map((med: any, i: number) => (
                            <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                              <p className="font-medium text-gray-900">{med.name}</p>
                              <p className="text-gray-600">{med.dosage} • {med.frequency} • {med.duration}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Lifestyle Recommendations</p>
                        <ul className="space-y-1">
                          {prescription.prescription.lifestyle_recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Follow-up Instructions</p>
                        <p className="text-sm text-gray-600">{prescription.prescription.follow_up_instructions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Reasoning</p>
                        <p className="text-sm text-gray-600">{prescription.prescription.reasoning}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Only show for pending prescriptions */}
                  {activeTab === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => handleApprove(prescription.id)}
                        disabled={approvingId === prescription.id || rejectingId === prescription.id}
                        className="flex-1"
                      >
                        {approvingId === prescription.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReject(prescription.id)}
                        disabled={approvingId === prescription.id || rejectingId === prescription.id}
                        className="flex-1"
                      >
                        {rejectingId === prescription.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Doctor Notes - Show for approved prescriptions */}
                  {activeTab === 'approved' && (prescription as ApprovedPrescription).doctor_notes && (
                    <div className="pt-4 border-t">
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <h4 className="text-sm font-medium text-green-900 mb-2">Doctor Notes</h4>
                        <p className="text-sm text-green-800">{(prescription as ApprovedPrescription).doctor_notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve Prescription' : 'Reject Prescription'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'approve' ? 'Notes (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={actionType === 'approve' ? 'Add any additional notes...' : 'Please provide a reason for rejection...'}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={confirmAction}
                  disabled={actionType === 'reject' && !doctorNotes.trim()}
                  className="flex-1"
                >
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNotesModal(false)
                    setDoctorNotes('')
                    setSelectedId(null)
                    setActionType(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

