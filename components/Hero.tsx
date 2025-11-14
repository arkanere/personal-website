export function Hero() {
  return (
    <section id="hero" className="min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-4xl w-full">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Hi, I'm <span className="text-gray-600 dark:text-gray-400">Your Name</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
          A brief, compelling tagline about what you do. Keep it concise and memorable.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="#contact"
            className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors font-medium"
          >
            Get in touch
          </a>
          <a
            href="#projects"
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-medium"
          >
            View projects
          </a>
        </div>
      </div>
    </section>
  )
}
