'use client'

import { useDevice } from '@/hooks/useDevice'
import { TVNavigationProvider } from './TVNavigationProvider'
import Link from 'next/link'
import { Home, Search, Calendar, User } from 'lucide-react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'

function MobileNav() {
  return (
    <nav className="fixed bottom-0 w-full bg-gray-900 border-t border-gray-800 flex justify-around p-3 pb-safe z-50">
      <Link href="/" className="flex flex-col items-center text-gray-400 hover:text-white">
        <Home size={24} />
        <span className="text-xs mt-1">Home</span>
      </Link>
      <Link href="/search" className="flex flex-col items-center text-gray-400 hover:text-white">
        <Search size={24} />
        <span className="text-xs mt-1">Search</span>
      </Link>
      <Link href="/calendar" className="flex flex-col items-center text-gray-400 hover:text-white">
        <Calendar size={24} />
        <span className="text-xs mt-1">Upcoming</span>
      </Link>
      <Link href="/profile" className="flex flex-col items-center text-gray-400 hover:text-white">
        <User size={24} />
        <span className="text-xs mt-1">Profile</span>
      </Link>
    </nav>
  )
}

function TVNavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const { ref, focused } = useFocusable()
  return (
    <Link
      href={href}
      // @ts-ignore
      ref={ref}
      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
        focused ? 'bg-white text-black scale-105 shadow-xl' : 'text-gray-400 opacity-70'
      }`}
    >
      <Icon size={32} />
      <span className="text-2xl font-semibold hidden md:block">{label}</span>
    </Link>
  )
}

function TVSidebar() {
  return (
    <aside className="w-24 md:w-64 fixed h-screen bg-gray-950 border-r border-gray-900 flex flex-col pt-12 px-4 gap-6 z-50">
      <div className="text-white text-xl md:text-3xl font-black mb-12 px-4 text-center md:text-left">ST</div>
      <TVNavItem href="/" icon={Home} label="Home" />
      <TVNavItem href="/search" icon={Search} label="Search" />
      <TVNavItem href="/calendar" icon={Calendar} label="Upcoming" />
      <TVNavItem href="/profile" icon={User} label="Profile" />
    </aside>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isTV } = useDevice()

  if (isTV) {
    return (
      <TVNavigationProvider>
        <div className="flex min-h-screen bg-gray-900 text-white overflow-hidden">
          <TVSidebar />
          <main className="flex-1 ml-24 md:ml-64 p-8 overflow-y-auto h-screen relative">
            {children}
          </main>
        </div>
      </TVNavigationProvider>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      <main className="p-4">{children}</main>
      <MobileNav />
    </div>
  )
}
