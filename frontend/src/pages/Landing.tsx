import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'
import { 
  Camera, 
  Brain, 
  Bell, 
  Globe,
  ArrowRight,
  Stethoscope,
  Sparkles
} from 'lucide-react'
import { Button } from '../components/ui/Button'

const features = [
  {
    icon: Camera,
    title: 'AI Image Analysis',
    description: 'Upload a photo and get instant AI-powered acne severity assessment.',
  },
  {
    icon: Brain,
    title: 'Smart Prescriptions',
    description: 'Evidence-based prescription generation aligned with medical guidelines.',
  },
  {
    icon: Globe,
    title: 'Bilingual Support',
    description: 'Get prescriptions in English and Telugu for better understanding.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Set up medication reminders to improve treatment adherence.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/app')
    } else {
      navigate('/login')
    }
  }
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                AcneAI
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link to="/app">
                  <Button>Go to App</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                AI-Powered Dermatology
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Smart Acne Care,{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  Personalized for You
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Get accurate acne severity assessment using AI and receive evidence-based 
                treatment recommendations.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {isAuthenticated ? (
                  <>
                    <Link to="/app/diagnosis">
                      <Button size="lg" className="gap-2">
                        Start Diagnosis
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </Link>
                    <Link to="/app">
                      <Button variant="outline" size="lg">
                        Go to Dashboard
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Button size="lg" className="gap-2" onClick={handleGetStarted}>
                      Get Started
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                    <Link to="/login">
                      <Button variant="outline" size="lg">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-24 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From diagnosis to treatment, our AI-powered platform guides you every step.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="glass-card rounded-2xl p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="glass-card rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Upload a skin image and get your AI-powered diagnosis in seconds.
            </p>
            
            {isAuthenticated ? (
              <Link to="/app/diagnosis">
                <Button size="lg" className="gap-2">
                  Start Free Diagnosis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="gap-2" onClick={handleGetStarted}>
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2024 AcneAI. For educational purposes only.</p>
        </div>
      </footer>
    </div>
  )
}
