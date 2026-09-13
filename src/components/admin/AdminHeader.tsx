import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import styles from './AdminHeader.module.css'

export default function AdminHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h2 className={styles.title}>Painel Administrativo</h2>
      </div>
      <div className={styles.right}>
        <div className={styles.userProfile}>
          <span className={styles.userName}>Admin</span>
          <form action={async () => {
            'use server'
            const supabase = await createClient()
            await supabase.auth.signOut()
            redirect('/login')
          }}>
            <button type="submit" className={styles.logoutBtn}>Sair</button>
          </form>
        </div>
      </div>
    </header>
  )
}
