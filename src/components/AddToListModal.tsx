'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, ListPlus, Loader2, Check } from 'lucide-react'
import { getUserListsWithItemStatus, createList, addToList } from '@/app/actions/listActions'

export function AddToListModal({ 
  isOpen, 
  onClose, 
  itemId, 
  mediaType,
  coverPath
}: { 
  isOpen: boolean, 
  onClose: () => void,
  itemId: number,
  mediaType: 'tv' | 'movie',
  coverPath?: string
}) {
  const [lists, setLists] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      getUserListsWithItemStatus(itemId, mediaType).then(data => {
        if (isMounted) {
          setLists(data)
          setIsLoading(false)
        }
      })
    }
    return () => { isMounted = false }
  }, [isOpen, itemId, mediaType])

  if (!isOpen) return null

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return
    setIsCreating(true)
    try {
      const newList = await createList(newListName.trim(), coverPath)
      setLists([{ ...newList, hasItem: false }, ...lists])
      setNewListName('')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddToList = async (listId: string) => {
    setSubmittingId(listId)
    try {
      await addToList(listId, itemId, mediaType)
      setLists(prev => prev.map(l => l.id === listId ? { ...l, hasItem: true } : l))
    } catch (e) {
      console.error(e)
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#111111] w-full max-w-md rounded-2xl overflow-hidden border border-border shadow-2xl flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ListPlus className="text-[#FFD54F]" />
              Add to List
            </h2>
            <button onClick={onClose} className="p-2 bg-background/50 hover:bg-background rounded-full transition-colors">
              <X size={20} className="text-foreground-muted" />
            </button>
          </div>

          <div className="p-4 flex flex-col overflow-y-auto no-scrollbar gap-4">
            {/* Create New List */}
            <form onSubmit={handleCreateList} className="flex gap-2">
              <input 
                type="text" 
                placeholder="New List Name..." 
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-[#FFD54F] transition-colors"
              />
              <button 
                type="submit" 
                disabled={isCreating || !newListName.trim()}
                className="bg-[#FFD54F] text-black p-3 rounded-xl font-bold disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
              </button>
            </form>

            <div className="h-px bg-surface-elevated w-full my-2" />

            {/* Existing Lists */}
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-[#FFD54F]" size={32} />
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center p-8 text-foreground-muted">
                You don&apos;t have any custom lists yet. Create one above!
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {lists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => !list.hasItem && handleAddToList(list.id)}
                    disabled={submittingId === list.id || list.hasItem}
                    className={`flex items-center justify-between p-4 rounded-xl bg-surface-elevated border transition-all text-left ${list.hasItem ? 'border-transparent opacity-80 cursor-default' : 'hover:bg-surface border-transparent hover:border-[#3A3A3A]'}`}
                  >
                    <span className="font-bold text-foreground text-lg">{list.name}</span>
                    {submittingId === list.id ? (
                      <Loader2 className="animate-spin text-foreground-muted" size={20} />
                    ) : list.hasItem ? (
                      <Check className="text-blue-500" size={20} />
                    ) : (
                      <Plus className="text-foreground-muted" size={20} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
