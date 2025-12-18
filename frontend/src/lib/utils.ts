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
    Pustula: 'Pustule',
    blackhead: 'Blackhead',
    cysts: 'Cyst',
    nodules: 'Nodule',
    papules: 'Papule',
    whitehead: 'Whitehead',
  }
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

export function getLesionLabel(type: string, count?: number): string {
  const labels: Record<string, { singular: string; plural: string }> = {
    comedones: { singular: 'Comedone', plural: 'Comedones' },
    papules: { singular: 'Papule', plural: 'Papules' },
    pustules: { singular: 'Pustule', plural: 'Pustules' },
    nodules: { singular: 'Nodule', plural: 'Nodules' },
    cysts: { singular: 'Cyst', plural: 'Cysts' },
  }
  
  const labelData = labels[type.toLowerCase()]
  if (!labelData) {
    // Fallback for unknown types
    const baseLabel = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
    return count === 1 ? baseLabel : baseLabel + 's'
  }
  
  // Return singular if count is exactly 1, plural otherwise (including 0)
  return count === 1 ? labelData.singular : labelData.plural
}


