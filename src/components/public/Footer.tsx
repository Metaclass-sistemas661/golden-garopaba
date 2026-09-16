"use client"

import Link from 'next/link'
import Image from 'next/image'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <section className={styles.bottomUnifiedWrapper}>
      
      {/* CTA Video Section */}
      <div className={styles.ctaSection}>
        <video 
          className={styles.ctaVideo} 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/VIDEO-CTA.mp4" type="video/mp4" />
        </video>
        
        <div className={styles.ctaGlassBox}>
          <h2>O Seu Novo Lar Está Aqui.</h2>
          <p>Fale com nossa equipe e receba um atendimento personalizado para encontrar o seu imóvel ideal.</p>
          <a href="https://wa.me/5548999999999?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20um%20corretor!" target="_blank" rel="noopener noreferrer" className={styles.ctaButton}>
            Falar com Corretor Agora
          </a>
        </div>
      </div>

      {/* Footer Section */}
      <footer className={styles.footerSection}>
        <div className={styles.footerContainer}>
          
          <div className={styles.footerBrand} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Link href="/" className={styles.footerLogo}>
              <Image src="/logo1.png" alt="Golden Garopaba" width={150} height={150} style={{ objectFit: 'contain' }} />
            </Link>
            <p>Conectando pessoas aos melhores imóveis em Garopaba. Inteligência de mercado e atendimento dedicado para a sua segurança.</p>
          </div>

          <div className={styles.footerLinksWrapper}>
            <div className={styles.footerCol}>
              <h4>Entre em Contato</h4>
              <ul className={styles.contactList}>
                <li>
                  <span className={styles.contactLabel}>E-mail</span>
                  <a href="mailto:contato@goldengaropaba.com.br">contato@goldengaropaba.com.br</a>
                </li>
                <li>
                  <span className={styles.contactLabel}>Telefone / WhatsApp</span>
                  <a href="tel:+5548999999999">+55 (48) 99999-9999</a>
                </li>
                <li>
                  <span className={styles.contactLabel}>Endereço</span>
                  <span>Av. dos Pescadores, 1000 - Centro<br/>Garopaba/SC, 88495-000</span>
                </li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4>Navegação</h4>
              <ul>
                <li><Link href="/">Início</Link></li>
                <li><Link href="/imoveis">Imóveis</Link></li>
                <li><Link href="/lancamentos">Lançamentos</Link></li>
                <li><Link href="/sobre">Sobre Nós</Link></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacidade">Política de Privacidade</Link></li>
                <li><Link href="/termos">Termos de Serviço</Link></li>
                <li><Link href="/cookies">Uso de Cookies</Link></li>
              </ul>
            </div>
          </div>

        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Golden Garopaba por Rafael Jesse. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/5548999999999?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20um%20corretor!" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          backgroundColor: '#25D366',
          color: 'white',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
          zIndex: 9999,
          transition: 'transform 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ fill: 'white', stroke: 'none' }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </a>
    </section>
  )
}
