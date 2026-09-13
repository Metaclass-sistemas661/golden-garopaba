import styles from '../legal.module.css'

export default function Cookies() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Uso de Cookies</h1>
        <p className={styles.lastUpdate}>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      
      <div className={styles.content}>
        <p>
          A Golden Garopaba utiliza cookies e tecnologias semelhantes para garantir que possamos oferecer a melhor experiência possível ao nosso usuário de alto padrão.
        </p>

        <h2>1. O que são Cookies?</h2>
        <p>
          Cookies são pequenos arquivos de texto que um site salva no seu computador ou dispositivo móvel quando você o visita. Eles permitem que o site se lembre das suas ações e preferências (como login, idioma, e preferências de navegação) por um período de tempo.
        </p>

        <h2>2. Como Utilizamos os Cookies</h2>
        <ul>
          <li><strong>Cookies Estritamente Necessários:</strong> Fundamentais para o funcionamento do site e para a utilização de seus recursos, como navegação segura.</li>
          <li><strong>Cookies de Desempenho (Analytics):</strong> Utilizados para entender como os visitantes interagem com nosso site, identificando as propriedades mais visualizadas para melhorar a usabilidade.</li>
          <li><strong>Cookies de Funcionalidade:</strong> Permitem que o site memorize as escolhas que você fez no passado (como salvar suas propriedades favoritas).</li>
        </ul>

        <h2>3. Controle de Cookies</h2>
        <p>
          Você pode controlar e/ou excluir cookies conforme desejar. Você pode apagar todos os cookies que já estão no seu computador e configurar a maioria dos navegadores para evitar que sejam colocados. No entanto, se você fizer isso, pode ser necessário ajustar manualmente algumas preferências sempre que visitar o nosso site, e alguns serviços e funcionalidades podem não funcionar corretamente.
        </p>
        
        <h2>4. Alterações na Política de Cookies</h2>
        <p>
          Podemos atualizar esta política de tempos em tempos. Recomendamos que você a revise periodicamente para se manter informado sobre o uso de cookies.
        </p>
      </div>
    </div>
  )
}
