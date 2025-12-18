import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, FileText, Bell, ArrowRight, ClipboardCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

const patientActions = [
  {
    icon: Camera,
    title: 'New Diagnosis',
    description: 'Upload a skin image for AI analysis',
    path: '/app/diagnosis',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FileText,
    title: 'View Prescriptions',
    description: 'Check your treatment plans',
    path: '/app/prescriptions',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Bell,
    title: 'Reminders',
    description: 'Manage medication reminders',
    path: '/app/reminders',
    color: 'from-orange-500 to-red-500',
  },
]

const doctorActions = [
  {
    icon: ClipboardCheck,
    title: 'Doctor Dashboard',
    description: 'Review and approve pending prescriptions',
    path: '/app/doctor',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: FileText,
    title: 'All Prescriptions',
    description: 'View all prescriptions',
    path: '/app/prescriptions',
    color: 'from-purple-500 to-pink-500',
  },
]

export default function Home() {
  const user = useAuthStore((state) => state.user)
  const isDoctor = user?.role === 'doctor'
  const actions = isDoctor ? doctorActions : patientActions
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {isDoctor ? 'Doctor Dashboard' : 'Welcome to AcneAI 👋'}
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          {isDoctor
            ? 'Review and approve patient prescriptions. Review diagnosis images and AI-generated treatment plans.'
            : 'Get AI-powered acne diagnosis, personalized prescriptions, and smart reminders to manage your skin health.'}
        </p>
      </div>
      
      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={action.path}>
              <Card variant="glass" className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                <CardContent className="flex flex-col items-center text-center p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4`}>
                    <action.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{action.description}</p>
                  <div className="flex items-center text-primary-600 text-sm font-medium">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
      
      {/* Start CTA */}
      {!isDoctor && (
        <Card variant="elevated" className="bg-gradient-to-r from-primary-500 to-accent-500 text-white">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready for your diagnosis?</h2>
              <p className="text-primary-100">Upload a skin image and get instant AI analysis.</p>
            </div>
            <Link to="/app/diagnosis">
              <Button variant="secondary" size="lg" className="gap-2 whitespace-nowrap">
                <Camera className="w-5 h-5" />
                Start Diagnosis
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
      
      {isDoctor && (
        <Card variant="elevated" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Review Pending Prescriptions</h2>
              <p className="text-green-100">Check and approve patient prescriptions with diagnosis details.</p>
            </div>
            <Link to="/app/doctor">
              <Button variant="secondary" size="lg" className="gap-2 whitespace-nowrap">
                <ClipboardCheck className="w-5 h-5" />
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

