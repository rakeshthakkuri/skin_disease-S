import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Plus, Trash2, Check, Loader2, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { remindersApi } from '@/lib/api'
import { toast } from '@/components/ui/Toaster'

interface Reminder {
  id: string
  title: string
  message: string
  frequency: string
  times: string[]
  status: string
  total_acknowledged: number
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newReminder, setNewReminder] = useState({
    title: '',
    message: '',
    frequency: 'once_daily',
    times: ['09:00'],
  })
  
  useEffect(() => {
    loadReminders()
  }, [])
  
  const loadReminders = async () => {
    try {
      const response = await remindersApi.list()
      setReminders(response.data)
    } catch (error) {
      console.error('Error loading reminders:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await remindersApi.create(newReminder)
      toast.success('Reminder created!')
      setShowForm(false)
      setNewReminder({ title: '', message: '', frequency: 'once_daily', times: ['09:00'] })
      loadReminders()
    } catch (error) {
      toast.error('Failed to create reminder')
    }
  }
  
  const handleAcknowledge = async (id: string) => {
    try {
      await remindersApi.acknowledge(id)
      toast.success('Medication taken! Great job! 💪')
      loadReminders()
    } catch (error) {
      toast.error('Failed to acknowledge')
    }
  }
  
  const handleDelete = async (id: string) => {
    try {
      await remindersApi.delete(id)
      toast.success('Reminder deleted')
      loadReminders()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Medication Reminders</h1>
          <p className="text-gray-600 mt-1">Stay on track with your treatment</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Reminder
        </Button>
      </div>
      
      {/* Create Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="glass">
            <CardHeader>
              <CardTitle>New Reminder</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateReminder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    placeholder="e.g., Benzoyl Peroxide"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <input
                    type="text"
                    value={newReminder.message}
                    onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                    placeholder="e.g., Apply thin layer after cleansing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <select
                      value={newReminder.frequency}
                      onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="once_daily">Once Daily</option>
                      <option value="twice_daily">Twice Daily</option>
                      <option value="three_times_daily">Three Times Daily</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={newReminder.times[0]}
                      onChange={(e) => setNewReminder({ ...newReminder, times: [e.target.value] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit">Create Reminder</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
      
      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Reminders Yet</h2>
          <p className="text-gray-500">Create reminders to stay on track with your medication.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((reminder, index) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="glass">
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        reminder.status === 'active' ? 'bg-primary-100' : 'bg-gray-100'
                      )}>
                        <Bell className={cn('w-6 h-6', reminder.status === 'active' ? 'text-primary-600' : 'text-gray-400')} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{reminder.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{reminder.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {reminder.times.join(', ')}
                          </span>
                          <span className="capitalize">{reminder.frequency.replace('_', ' ')}</span>
                          <span className="text-green-600">✓ {reminder.total_acknowledged} taken</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcknowledge(reminder.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark as taken"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(reminder.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

