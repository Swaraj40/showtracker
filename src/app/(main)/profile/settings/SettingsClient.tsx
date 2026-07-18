'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import { logout } from '@/app/(auth)/actions'
import { useRef } from 'react'
import { ImportProgressModal } from './ImportProgressModal'

export default function SettingsClient() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'APP' | 'UPCOMING'>('APP')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Settings State (Mocking persisted settings)
  const [displayInLang, setDisplayInLang] = useState(true)
  const [autoPlayVideos, setAutoPlayVideos] = useState(true)
  const [hideWatchedEpisodes, setHideWatchedEpisodes] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [importFile, setImportFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.name.endsWith('.zip')) {
      alert('Please select a valid gdpr-data.zip file.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setImportFile(file)
  }

  const closeImportModal = () => {
    setImportFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-y-auto pb-24 relative">
      <ImportProgressModal file={importFile} onClose={closeImportModal} />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-surface">
        <div className="flex items-center px-4 h-14">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="flex-1 text-center font-bold text-[17px] -ml-8">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pt-2 border-b border-surface">
          {(['ACCOUNT', 'APP', 'UPCOMING'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-3 text-center text-[13px] font-bold tracking-wider ${
                activeTab === tab 
                  ? 'border-b-4 border-foreground text-foreground' 
                  : 'text-foreground-muted'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-6">
        
        {activeTab === 'ACCOUNT' && (
          <div className="space-y-6">
            <Section title="Account Settings">
              <Row title="Change Email" hasArrow />
              <Row title="Change Password" hasArrow />
              <button 
                onClick={async () => {
                  const { createClient } = await import('@/utils/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push('/login')
                  router.refresh()
                }} 
                className="w-full text-left"
              >
                <Row title="Log Out" hasArrow />
              </button>
            </Section>

            <Section title="Data">
              <button onClick={() => fileInputRef.current?.click()} className="w-full text-left">
                <Row title="Import from TV Time" subtitle="Restore your watch history from a gdpr-data.zip export file" />
              </button>
              <input 
                type="file" 
                accept=".zip" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </Section>
          </div>
        )}

        {activeTab === 'APP' && (
          <div className="space-y-8">
            <Section title="Titles">
              <ToggleRow 
                title="Display in your language" 
                subtitle="By default, titles will display in English"
                checked={displayInLang}
                onChange={setDisplayInLang}
              />
            </Section>

            <Section title="Comments">
              <Row 
                title="Select comment languages" 
                subtitle="By default, comments are displayed in English and your device language"
                hasArrow 
              />
            </Section>

            <Section title="Notifications">
              <Row title="Select which alerts you receive" hasArrow />
            </Section>

            <Section title="Theme">
              <RadioRow 
                label="Automatically sync app with device setting" 
                checked={theme === 'system'} 
                onChange={() => setTheme('system')} 
              />
              <RadioRow 
                label="Light Mode" 
                checked={theme === 'light'} 
                onChange={() => setTheme('light')} 
              />
              <RadioRow 
                label="Dark Mode" 
                checked={theme === 'dark'} 
                onChange={() => setTheme('dark')} 
              />
            </Section>

            <Section title="Recommendations">
              <Row title="Manage disliked shows and movies" hasArrow />
            </Section>

            <Section title="Feed">
              <ToggleRow 
                title="Auto-play videos" 
                subtitle="Automatically play video trailers"
                checked={autoPlayVideos}
                onChange={setAutoPlayVideos}
              />
            </Section>
          </div>
        )}

        {activeTab === 'UPCOMING' && (
          <div className="space-y-8">
            <Section title="Episodes to display">
              <Row title="Filter networks" hasArrow />
              <ToggleRow 
                title="Hide watched episodes" 
                checked={hideWatchedEpisodes}
                onChange={setHideWatchedEpisodes}
              />
            </Section>
          </div>
        )}

      </div>


    </div>
  )
}

// Subcomponents

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <h2 className="text-[17px] font-bold mb-4">{title}</h2>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}

function Row({ title, subtitle, hasArrow }: { title: string, subtitle?: string, hasArrow?: boolean }) {
  return (
    <div className="flex items-center justify-between cursor-pointer group">
      <div className="flex flex-col pr-4">
        <span className="text-[16px]">{title}</span>
        {subtitle && <span className="text-[13px] text-foreground-muted mt-1">{subtitle}</span>}
      </div>
      {hasArrow && <ChevronRight size={20} className="text-foreground-muted" />}
    </div>
  )
}

function ToggleRow({ title, subtitle, checked, onChange }: { title: string, subtitle?: string, checked: boolean, onChange: (c: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col pr-4">
        <span className="text-[16px]">{title}</span>
        {subtitle && <span className="text-[13px] text-foreground-muted mt-1">{subtitle}</span>}
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-white' : 'bg-gray-600'}`}
      >
        <span
          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-6 bg-background' : 'translate-x-0 bg-[#A0A0A0]'}`}
        />
      </button>
    </div>
  )
}

function RadioRow({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
  return (
    <div className="flex items-center gap-4 cursor-pointer" onClick={onChange}>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? 'border-white' : 'border-gray-500'}`}>
        {checked && <div className="w-3 h-3 rounded-full bg-white" />}
      </div>
      <span className="text-[16px]">{label}</span>
    </div>
  )
}
