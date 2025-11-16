'use client'

/**
 * Slug Input Component with Auto-generation and Validation
 */

import { useState, useEffect } from 'react'
import { useDebounce } from '@/lib/hooks/useDebounce'

interface SlugInputProps {
  title: string
  value: string
  onChange: (slug: string) => void
  excludeId?: number
}

export default function SlugInput({ title, value, onChange, excludeId }: SlugInputProps) {
  const [manuallyEdited, setManuallyEdited] = useState(false)
  const [validationState, setValidationState] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [validationMessage, setValidationMessage] = useState('')
  const debouncedSlug = useDebounce(value, 500)

  // Auto-generate slug from title
  useEffect(() => {
    if (!manuallyEdited && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      onChange(generatedSlug)
    }
  }, [title, manuallyEdited, onChange])

  // Validate slug when it changes
  useEffect(() => {
    const validateSlug = async () => {
      if (!debouncedSlug) {
        setValidationState('idle')
        setValidationMessage('')
        return
      }

      // Check format first
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugRegex.test(debouncedSlug)) {
        setValidationState('taken')
        setValidationMessage('Slug must contain only lowercase letters, numbers, and hyphens')
        return
      }

      setValidationState('checking')

      try {
        const params = new URLSearchParams({ slug: debouncedSlug })
        if (excludeId) {
          params.append('excludeId', excludeId.toString())
        }

        const response = await fetch(`/api/blogs/validate-slug?${params}`)
        const data = await response.json()

        if (data.available) {
          setValidationState('available')
          setValidationMessage('Slug is available')
        } else {
          setValidationState('taken')
          setValidationMessage(data.message || 'This slug is already in use')
        }
      } catch (error) {
        console.error('Error validating slug:', error)
        setValidationState('idle')
        setValidationMessage('')
      }
    }

    validateSlug()
  }, [debouncedSlug, excludeId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManuallyEdited(true)
    onChange(e.target.value)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="my-blog-post-slug"
        />
        {validationState === 'checking' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        {validationState === 'available' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {validationState === 'taken' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>

      {value && (
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">URL Preview: </span>
          <span className="text-gray-700 dark:text-gray-300 font-mono">
            /blog/{value}
          </span>
        </div>
      )}

      {validationMessage && (
        <p className={`text-sm ${
          validationState === 'available' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {validationMessage}
        </p>
      )}
    </div>
  )
}
