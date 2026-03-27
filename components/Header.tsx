import Link from 'next/link'

export function Header() {
  return (
    <header>
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-6">
        <Link href="/" className="text-2xl font-semibold">
          Aniruddha Kanere
        </Link>
      </div>
    </header>
  )
}
