'use client'

import { useState } from 'react'
import { ListPlus } from 'lucide-react'
import { AddToListModal } from '@/components/AddToListModal'

export function AddToListButtonClient({ 
  itemId, 
  mediaType,
  coverPath
}: { 
  itemId: number,
  mediaType: 'tv' | 'movie',
  coverPath?: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-full shadow-lg border transition-all bg-background/60 border-gray-600 text-foreground hover:bg-background/80"
        title="Add to Custom List"
      >
        <ListPlus size={24} />
      </button>

      {isOpen && (
        <AddToListModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          itemId={itemId}
          mediaType={mediaType}
          coverPath={coverPath}
        />
      )}
    </>
  )
}
