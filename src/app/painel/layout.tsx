import Sidebar from '@/components/admin/Sidebar'
import RightSidebar from '@/components/admin/RightSidebar'
import styles from './layout.module.css'
import { getSettings } from '@/app/actions/settings'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSettings();

  const customVars = {
    '--color-primary': settings?.colorPrimary || '#7a6645',
    '--color-secondary': settings?.colorSecondary || '#4a4d4b',
    '--font-primary': settings?.typography === 'roboto' ? 'Roboto, sans-serif' : 'var(--font-inter)',
    '--font-secondary': settings?.typography === 'playfair' ? 'var(--font-playfair)' : 'var(--font-inter)',
  } as React.CSSProperties;

  return (
    <div className={styles.adminLayout} style={customVars}>
      <Sidebar />
      <div className={styles.mainContent}>
        {/* AdminHeader temporariamente removido/ocultado aqui pois as ações foram pras sidebars,
            mas pode ser reativado se precisar de breadcrumbs */}
        <main className={styles.contentArea} data-lenis-prevent="true">
          {children}
        </main>
      </div>
      <RightSidebar />
    </div>
  )
}
