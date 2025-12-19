import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Loader2, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn, getSeverityColor, getSeverityLabel } from '@/lib/utils'
import { prescriptionApi } from '@/lib/api'

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
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  
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
  
  const handlePrescriptionClick = (id: string) => {
    navigate(`/app/prescriptions/${id}`)
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
  const visiblePrescriptions = prescriptions.filter(
    (p) =>
      p.status === 'approved' ||
      p.status === 'pending' ||
      p.status === 'rejected'
  )
  
  // Sort prescriptions: newest first, grouped by status
  const sortedPrescriptions = [...visiblePrescriptions].sort((a, b) => {
    const statusOrder = { pending: 0, rejected: 1, approved: 2 }
    const statusDiff =
      (statusOrder[a.status as keyof typeof statusOrder] || 3) -
      (statusOrder[b.status as keyof typeof statusOrder] || 3)
    if (statusDiff !== 0) return statusDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // Apply status filter
  const filteredPrescriptions =
    statusFilter === 'all'
      ? sortedPrescriptions
      : sortedPrescriptions.filter((p) => p.status === statusFilter)
  
  // Count prescriptions by status
  const statusCounts = {
    pending: sortedPrescriptions.filter(p => p.status === 'pending').length,
    rejected: sortedPrescriptions.filter(p => p.status === 'rejected').length,
    approved: sortedPrescriptions.filter(p => p.status === 'approved').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 sticky top-0 z-10 bg-white/80 backdrop-blur-sm pb-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Prescriptions</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Quickly review all your treatment plans, filters, and languages in one place.
          </p>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
            {(['all', 'approved', 'pending', 'rejected'] as const).map((status) => {
              const labelMap: Record<typeof status, string> = {
                all: 'All',
                approved: 'Approved',
                pending: 'Pending',
                rejected: 'Rejected',
              }
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs md:text-sm font-medium transition-colors',
                    statusFilter === status
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {labelMap[status]}
                </button>
              )
            })}
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
        {filteredPrescriptions.map((prescription) => {
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
          
          return (
            <motion.div
              key={prescription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card variant="glass">
                <div
                  onClick={() => handlePrescriptionClick(prescription.id)}
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3 className="font-semibold text-gray-900">
                            Prescription #{prescription.id}
                          </h3>
                          <span
                            className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              getSeverityColor(prescription.severity)
                            )}
                          >
                            {getSeverityLabel(prescription.severity)}
                          </span>
                          {getStatusBadge()}
                        </div>
                        {canViewDetails ? (
                          <p className="text-sm text-gray-500">
                            {prescription.medications.length} medication(s) • Created{' '}
                            {new Date(prescription.created_at).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">
                            {prescription.status === 'pending'
                              ? 'Awaiting doctor approval'
                              : prescription.status === 'rejected'
                              ? 'Prescription was rejected by doctor'
                              : 'Status: ' + prescription.status}
                            {' • '}
                            Created{' '}
                            {new Date(prescription.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

