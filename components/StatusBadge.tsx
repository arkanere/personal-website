/**
 * Status Badge Component
 */

import { BlogStatus } from '@/lib/types/blog'

interface StatusBadgeProps {
  status: BlogStatus
}

const badgeClass: Record<BlogStatus, string> = {
  draft: 'badge badge-draft',
  published: 'badge badge-published',
  archived: 'badge badge-archived',
}

const labels: Record<BlogStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={badgeClass[status]}>
      {labels[status]}
    </span>
  )
}
