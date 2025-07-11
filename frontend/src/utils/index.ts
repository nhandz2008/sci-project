import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns'

/**
 * Merge tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, formatStr = 'PPP') {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export function formatRelativeDate(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isAfter(dateObj, new Date())
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isBefore(dateObj, new Date())
}

/**
 * Get days until a specific date
 */
export function getDaysUntil(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const timeDiff = dateObj.getTime() - now.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...'
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string) {
  return text.replace(/\b\w/g, char => char.toUpperCase())
}

/**
 * Convert enum value to display text
 */
export function enumToDisplayText(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Generate initials from name
 */
export function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Generate random ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Check if string is valid URL
 */
export function isValidUrl(string: string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T = any>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * Sleep function for async operations
 */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
} 