'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tv, Film, Compass, User, Bell } from 'lucide-react'

function MobileNav() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Shows', href: '/shows', icon: Tv },
    { name: 'Movies', href: '/movies', icon: Film },
    { name: 'Discover', href: '/', icon: Compass },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 w-full bg-surface border-t border-border flex justify-around p-3 pb-safe z-50">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link 
            key={tab.name}
            href={tab.href} 
            className={`flex flex-col items-center transition-colors ${isActive ? 'text-[#FFD54F]' : 'text-foreground-muted hover:text-foreground-muted'}`}
          >
            <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">{tab.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20">
      <main className="w-full max-w-2xl mx-auto">{children}</main>
      <div className="fixed bottom-0 w-full max-w-2xl left-1/2 -translate-x-1/2">
        <MobileNav />
      </div>
    </div>
  )
}
