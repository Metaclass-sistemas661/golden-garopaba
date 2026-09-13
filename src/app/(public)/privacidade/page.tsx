import styles from '../legal.module.css'

export default function Privacidade() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Política de Privacidade</h1>
        <p className={styles.lastUpdate}>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      
      <div className={styles.content}>
        <p>
          A Golden Garopaba leva a sua privacidade a sério. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você interage com nosso site e serviços.
        </p>

        <h2>1. Coleta de Informações</h2>
        <p>Coletamos as seguintes informações quando você utiliza nossos serviços:</p>
        <ul>
          <li><strong>Informações de contato:</strong> Nome, e-mail, telefone e informações fornecidas voluntariamente em nossos formulários.</li>
          <li><strong>Informações de navegação:</strong> Endereço IP, tipo de navegador, páginas visitadas e tempo de permanência, coletadas através de cookies.</li>
        </ul>

        <h2>2. Uso das Informações</h2>
        <p>Utilizamos suas informações para:</p>
        <ul>
          <li>Prestar um atendimento personalizado e agendar visitas.</li>
          <li>Enviar atualizações sobre imóveis exclusivos e lançamentos (com seu consentimento).</li>
          <li>Melhorar a segurança e performance do nosso site.</li>
        </ul>

        <h2>3. Compartilhamento de Dados</h2>
        <p>
          A Golden Garopaba não vende ou aluga suas informações pessoais. Seus dados são estritamente confidenciais e podem ser compartilhados apenas com parceiros jurídicos ou cartoriais necessários para a formalização de propostas de compra e locação, sempre mediante seu consentimento explícito.
        </p>

        <h2>4. Seus Direitos</h2>
        <p>
          De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de solicitar o acesso, a correção ou a exclusão dos seus dados pessoais armazenados em nosso sistema a qualquer momento.
        </p>

        <h2>5. Contato</h2>
        <p>
          Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato com nosso Encarregado de Dados (DPO) através do e-mail <a href="mailto:privacidade@goldengaropaba.com.br">privacidade@goldengaropaba.com.br</a>.
        </p>
      </div>
    </div>
  )
}
