export interface Project {
  id: string
  title: string
  description: string
  tech: string[]
  github?: string
  demo?: string
}

export const projects: Project[] = [
  {
    id: 'project-1',
    title: 'E-commerce Platform',
    description: 'A full-stack e-commerce solution with payment integration and admin dashboard',
    tech: ['Next.js', 'TypeScript', 'Stripe', 'PostgreSQL'],
    github: 'https://github.com/yourusername/project-1',
    demo: 'https://demo.example.com'
  },
  {
    id: 'project-2',
    title: 'Task Management App',
    description: 'A collaborative task management tool with real-time updates',
    tech: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
    github: 'https://github.com/yourusername/project-2',
  },
  {
    id: 'project-3',
    title: 'Weather Dashboard',
    description: 'A beautiful weather dashboard with forecasts and historical data',
    tech: ['Vue.js', 'TailwindCSS', 'Weather API'],
    github: 'https://github.com/yourusername/project-3',
    demo: 'https://weather.example.com'
  }
]

export function getProjectById(id: string): Project | undefined {
  return projects.find(project => project.id === id)
}
