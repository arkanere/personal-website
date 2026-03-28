import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="container site-header">
      <Link href="/" className="site-title">
        Aniruddha Kanere
      </Link>
      <ThemeToggle />
    </header>
  )
}
