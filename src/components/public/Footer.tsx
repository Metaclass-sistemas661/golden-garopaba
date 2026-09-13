"use client"

import Link from 'next/link'
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
          <h2>Sua Próxima Conquista Está Aqui.</h2>
          <p>Agende uma consultoria privada e tenha acesso ao portfólio exclusivo da Golden Garopaba.</p>
          <Link href="/contato" className={styles.ctaButton}>
            Falar com Corretor Agora
          </Link>
        </div>
      </div>

      {/* Footer Section */}
      <footer className={styles.footerSection}>
        <div className={styles.footerContainer}>
          
          <div className={styles.footerBrand} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Link href="/" className={styles.footerLogo}>
              <img src="/logo1.png" alt="Golden Garopaba" style={{ height: '150px', objectFit: 'contain' }} />
            </Link>
            <p>Redefinindo o alto padrão no litoral catarinense. Inteligência de mercado, curadoria exclusiva e discrição absoluta para investidores exigentes.</p>
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

    </section>
  )
}
