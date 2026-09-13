import styles from '../legal.module.css'

export default function Termos() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Termos de Serviço</h1>
        <p className={styles.lastUpdate}>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      
      <div className={styles.content}>
        <p>
          Bem-vindo à Golden Garopaba. Ao acessar ou usar nosso site, você concorda em cumprir estes Termos de Serviço. Leia-os atentamente antes de continuar.
        </p>

        <h2>1. Aceitação dos Termos</h2>
        <p>
          Ao acessar o site da Golden Garopaba, você concorda em ficar vinculado a estes Termos, bem como a todas as leis e regulamentações aplicáveis.
        </p>

        <h2>2. Uso do Site e Precisão das Informações</h2>
        <p>
          Embora a Golden Garopaba se esforce para manter todas as informações sobre propriedades atualizadas (incluindo preços, metragem e disponibilidade), ressaltamos que os dados estão sujeitos a alterações a qualquer momento, sem aviso prévio. A apresentação de um imóvel em nosso catálogo não garante a sua disponibilidade iminente.
        </p>

        <h2>3. Propriedade Intelectual</h2>
        <p>
          Todo o conteúdo presente neste site, incluindo fotografias dos imóveis, vídeos, textos, logotipos e design, são de propriedade exclusiva da Golden Garopaba e estão protegidos pelas leis de direitos autorais. O uso não autorizado destes materiais é estritamente proibido.
        </p>

        <h2>4. Confidencialidade e Intermediação</h2>
        <p>
          A Golden Garopaba atua como intermediadora em negociações imobiliárias. As propostas realizadas através da nossa plataforma ou equipe comercial estarão sujeitas a análise documental e aprovação jurídica, garantindo a segurança de ambas as partes (comprador e vendedor).
        </p>

        <h2>5. Foro</h2>
        <p>
          Quaisquer disputas relacionadas a estes Termos de Serviço serão regidas pelas leis da República Federativa do Brasil e julgadas no foro da comarca de Garopaba, Santa Catarina.
        </p>
      </div>
    </div>
  )
}
