'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ArrowDownUp, MoreHorizontal, X } from 'lucide-react'
import { createList } from '@/app/actions/listActions'

type ListWithPosters = {
  id: string
  name: string
  cover_url: string | null
  posters: string[]
}

export default function ListsClient({ initialLists }: { initialLists: ListWithPosters[] }) {
  const router = useRouter()
  const [lists, setLists] = useState(initialLists)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateList = async () => {
    if (!newListName.trim()) return
    setIsCreating(true)
    try {
      const newList = await createList(newListName.trim())
      // Add the new list to the UI optimistically with 0 posters
      setLists([{ ...newList, posters: [] }, ...lists])
      setIsModalOpen(false)
      setNewListName('')
    } catch (error) {
      console.error('Failed to create list', error)
      alert('Failed to create list')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-y-auto pb-24 relative">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-surface">
        <div className="flex items-center px-4 h-14 relative">
          <button onClick={() => router.back()} className="p-2 -ml-2 absolute left-4 z-10">
            <ChevronLeft size={24} />
          </button>
          <h1 className="flex-1 text-center font-bold text-[17px]">Lists</h1>
          <button className="p-2 -mr-2 absolute right-4 z-10">
            <ArrowDownUp size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Create Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-[#FFD54F] text-black font-bold py-3 rounded-full hover:bg-[#FFC107] transition-colors shadow-lg"
        >
          CREATE A NEW LIST
        </button>

        {/* Lists Grid */}
        <div className="flex flex-col gap-4 mt-6">
          {lists.map(list => (
            <div 
              key={list.id} 
              className="relative w-full h-48 rounded-xl overflow-hidden bg-surface cursor-pointer group"
              onClick={() => {
                // Navigate to a specific list page if it existed, e.g., router.push(`/list/${list.id}`)
              }}
            >
              {/* Collage Background */}
              <div className="absolute inset-0 flex">
                {list.posters.length > 0 ? (
                  <>
                    {/* If we have 1, 2, 3, or 4 posters, we render them side by side */}
                    {list.posters.slice(0, 4).map((poster, idx, arr) => (
                      <div 
                        key={idx} 
                        className="h-full bg-cover bg-center border-l border-surface first:border-l-0"
                        style={{ 
                          width: `${100 / arr.length}%`,
                          backgroundImage: `url(https://image.tmdb.org/t/p/w500${poster})` 
                        }}
                      />
                    ))}
                  </>
                ) : (
                  <div className="w-full h-full bg-surface-elevated flex items-center justify-center text-foreground-muted">
                    Empty List
                  </div>
                )}
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* More Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  // Open list options
                }}
                className="absolute top-2 right-2 p-2 text-white/80 hover:text-white"
              >
                <MoreHorizontal size={24} />
              </button>

              {/* List Name */}
              <h2 className="absolute bottom-4 left-4 text-2xl font-black text-white tracking-wide">
                {list.name}
              </h2>
            </div>
          ))}

          {lists.length === 0 && (
            <div className="text-center mt-12 text-foreground-muted">
              You haven't created any lists yet.
            </div>
          )}
        </div>
      </div>

      {/* Create List Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface-elevated w-full max-w-sm rounded-2xl p-6 relative shadow-2xl border border-border">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-foreground-muted hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4">Create List</h2>
            <input 
              type="text"
              autoFocus
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              placeholder="List name..."
              className="w-full bg-surface text-foreground px-4 py-3 rounded-xl outline-none border border-border focus:border-[#FFD54F] mb-6"
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateList()
              }}
            />
            <button 
              onClick={handleCreateList}
              disabled={!newListName.trim() || isCreating}
              className="w-full bg-[#FFD54F] text-black font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
