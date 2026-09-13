import { getSettings } from '@/app/actions/settings'
import ClientPage from './ClientPage'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesServerPage() {
  const settings = await getSettings()
  return <ClientPage initialSettings={settings} />
}
