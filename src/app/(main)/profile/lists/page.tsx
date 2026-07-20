import { getUserListsWithPosters } from '@/app/actions/listActions'
import ListsClient from './ListsClient'

export const dynamic = "force-dynamic"

export default async function ListsPage() {
  const lists = await getUserListsWithPosters()

  return <ListsClient initialLists={lists} />
}
