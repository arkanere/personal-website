/**
 * Status Badge Component
 */

import { BlogStatus } from '@/lib/types/blog'

interface StatusBadgeProps {
  status: BlogStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
  }

  const labels = {
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
