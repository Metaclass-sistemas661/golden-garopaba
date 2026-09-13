import Header from '@/components/public/Header'
import Footer from '@/components/public/Footer'
import CookieBanner from '@/components/public/CookieBanner'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      {/* pt-80px is removed since we handle spacing inside pages */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
        <Footer />
      </div>
      <CookieBanner />
    </>
  )
}
