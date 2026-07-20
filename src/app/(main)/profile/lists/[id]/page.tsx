import { getListDetailsWithItems } from '@/app/actions/listActions'
import ListDetailClient from './ListDetailClient'

export const dynamic = "force-dynamic"

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const list = await getListDetailsWithItems(resolvedParams.id)
    return <ListDetailClient list={list as any} />
  } catch (e) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold mb-2">List Not Found</h1>
        <p className="text-foreground-muted">This list may have been deleted or doesn't exist.</p>
      </div>
    )
  }
}
