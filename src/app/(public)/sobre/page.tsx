import { Metadata } from 'next'
import styles from './Sobre.module.css'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sobre Nós | Golden Garopaba',
  description: 'Conheça Rafael Jesse e a Golden Garopaba, especialistas em imóveis exclusivos no litoral catarinense.',
}

export default function SobrePage() {
  return (
    <main className={styles.main}>
      
      {/* Hero Header Minimalista */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.subtitle}>Nossa Essência</span>
          <h1 className={styles.title}>Redefinindo o Alto Padrão no Litoral Catarinense</h1>
          <p className={styles.heroText}>
            A Golden Garopaba nasceu para atender a um público exigente, que não busca apenas uma propriedade, mas um legado, um estilo de vida e um excelente investimento.
          </p>
        </div>
      </section>

      {/* Seção Corretor / História */}
      <section className={styles.brokerSection}>
        <div className={styles.container}>
          <div className={styles.brokerGrid}>
            
            <div className={styles.brokerImageWrapper}>
              <div className={styles.imageBox}>
                <Image 
                  src="/corretor.png" 
                  alt="Rafael Jesse - Especialista em Imóveis Exclusivos" 
                  fill
                  className={styles.brokerImage}
                />
              </div>
            </div>

            <div className={styles.brokerContent}>
              <h2 className={styles.sectionTitle}>Rafael Jesse</h2>
              <h3 className={styles.sectionRole}>Fundador & Especialista em Imóveis Exclusivos</h3>
              
              <div className={styles.divider}></div>
              
              <p className={styles.paragraph}>
                Com um profundo conhecimento do mercado imobiliário litorâneo, Rafael Jesse construiu sua reputação baseada em três pilares inegociáveis: <strong>discrição absoluta, curadoria implacável e visão estratégica de mercado.</strong>
              </p>
              
              <p className={styles.paragraph}>
                Sua atuação vai muito além de apresentar imóveis. Ele atua como um verdadeiro parceiro para investidores, empresários e famílias que buscam posicionar seu patrimônio em um dos litorais que mais valoriza no Brasil.
              </p>

              <p className={styles.paragraph}>
                "Nosso compromisso é entregar não apenas as chaves de uma propriedade extraordinária, mas a certeza de um negócio seguro e altamente rentável."
              </p>

            </div>
          </div>
        </div>
      </section>

      {/* Seção de Valores / Diferenciais */}
      <section className={styles.valuesSection}>
        <div className={styles.container}>
          <div className={styles.valuesHeader}>
            <h2>Por que escolher a Golden?</h2>
            <p>Um serviço de <em>concierge</em> imobiliário focado na máxima performance.</p>
          </div>
          
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>💎</div>
              <h3>Curadoria Restrita</h3>
              <p>Apenas propriedades que passam pelo nosso rigoroso crivo de excelência arquitetônica e de documentação entram no portfólio.</p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🛡️</div>
              <h3>Blindagem Jurídica</h3>
              <p>Análise minuciosa de toda a cadeia dominial para garantir que a sua transação seja livre de qualquer risco.</p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🤫</div>
              <h3>Off-Market Real</h3>
              <p>Acesso exclusivo a mansões que não estão anunciadas publicamente, preservando a identidade dos proprietários e compradores.</p>
            </div>
          </div>
        </div>
      </section>

      {/* A seção do footer (com CTA) já é injetada automaticamente pelo layout global! */}
      
    </main>
  )
}
