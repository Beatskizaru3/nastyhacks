// components/Header.tsx
'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-2xl font-bold">FileShare</Link>
        <div className="space-x-4">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/upload" className="hover:underline">Upload</Link>
          <Link href="/login" className="hover:underline">Login</Link>
        </div>
      </nav>
      <div className="bg-white border-t">
        <div className="container mx-auto px-4 py-2">
          <input
            type="text"
            placeholder="Search"
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
    </header>
  )
}
