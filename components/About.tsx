export function About() {
  const skills = [
    'JavaScript', 'TypeScript', 'React', 'Next.js',
    'Node.js', 'Python', 'TailwindCSS', 'Git'
  ]

  return (
    <section id="about" className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-4xl w-full">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">About Me</h2>

        <div className="space-y-6 text-lg text-gray-600 dark:text-gray-400">
          <p>
            I'm a passionate developer focused on building clean, efficient, and user-friendly
            applications. With a strong foundation in modern web technologies, I enjoy turning
            complex problems into simple, beautiful solutions.
          </p>

          <p>
            When I'm not coding, you can find me exploring new technologies, contributing to
            open-source projects, or sharing what I've learned through writing and mentoring.
          </p>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-semibold mb-6">Skills & Technologies</h3>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
