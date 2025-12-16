import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    clear: 'bg-green-100 text-green-800 border-green-200',
    mild: 'bg-lime-100 text-lime-800 border-lime-200',
    moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    severe: 'bg-orange-100 text-orange-800 border-orange-200',
    very_severe: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[severity] || colors.mild
}

export function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    clear: 'Clear',
    mild: 'Mild',
    moderate: 'Moderate',
    severe: 'Severe',
    very_severe: 'Very Severe',
  }
  return labels[severity] || severity
}

export function getAcneTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    blackhead: 'Blackhead',
    Pustula: 'Pustula',
    whitehead: 'Whitehead',
    cysts: 'Cysts',
    papules: 'Papules',
    nodules: 'Nodules',
  }
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

export function getAcneTypeColor(type: string): string {
  const colors: Record<string, string> = {
    blackhead: 'bg-gray-100 text-gray-800 border-gray-200',
    Pustula: 'bg-red-100 text-red-800 border-red-200',
    whitehead: 'bg-blue-100 text-blue-800 border-blue-200',
    cysts: 'bg-purple-100 text-purple-800 border-purple-200',
    papules: 'bg-orange-100 text-orange-800 border-orange-200',
    nodules: 'bg-pink-100 text-pink-800 border-pink-200',
  }
  return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'
}

