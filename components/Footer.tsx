'use client'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-12 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          © {currentYear} Your Name. All rights reserved.
        </p>

        <button
          onClick={scrollToTop}
          className="text-sm hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-2"
          aria-label="Back to top"
        >
          Back to top
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      </div>
    </footer>
  )
}
