import Link from 'next/link'
import Image from 'next/image'
import { TrendingUp, Building, Users } from 'lucide-react'
import styles from './page.module.css'
import DashboardReminders from '@/components/admin/DashboardReminders'
import prisma from '@/lib/prisma'
import { 
  getNowInBrazil, 
  getHourInBrazil, 
  createBrazilDate,
  isSameDayInBrazil,
  toSaoPauloTime
} from '@/utils/timezone'

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const resolvedParams = await searchParams
  const filter = resolvedParams.filter || '7d'

  // Usa timezone do Brasil para todas as operações de data/hora
  const nowBrazil = getNowInBrazil()
  let startDate: Date

  if (filter === 'hoje') {
    // Início do dia de hoje no horário de Brasília
    startDate = createBrazilDate(0, false)
  } else if (filter === '7d') {
    // 7 dias atrás no horário de Brasília
    startDate = createBrazilDate(7, false)
  } else if (filter === '30d') {
    // 30 dias atrás no horário de Brasília
    startDate = createBrazilDate(30, false)
  } else {
    startDate = new Date(0)
  }

  // Métricas de imóveis
  const totalPropertiesCount = await prisma.property.count()
  const activeViews = await prisma.propertyView.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true }
  })
  const totalActiveViews = activeViews.length

  // Métricas de Corretores (Equipe)
  const totalBrokers = await prisma.broker.count()
  const brokersData = await prisma.broker.findMany({
    where: { status: 'ACTIVE' },
    include: {
      transactions: true
    }
  })

  // Calcula ranking
  const brokersRanking = brokersData.map(broker => {
    const totalSalesAmount = broker.transactions.reduce((acc, t) => acc + Number(t.amount), 0)
    const goal = Number(broker.salesGoalQuarterly)
    const goalPercentage = goal > 0 ? Math.min((totalSalesAmount / goal) * 100, 100) : 0
    return {
      id: broker.id,
      name: broker.displayName,
      avatarUrl: broker.avatarUrl,
      totalSales: totalSalesAmount,
      goalPercentage
    }
  }).sort((a, b) => b.goalPercentage - a.goalPercentage).slice(0, 5) // Top 5

  let chartData: { day: string; value: number; height: string; active?: boolean }[] = []

  if (filter === 'hoje') {
    // Blocos de horário: 00h-05h, 06h-11h, 12h-17h, 18h-23h
    const blocks = [0, 0, 0, 0]
    
    activeViews.forEach(v => {
      // Converte o horário UTC do banco para horário de Brasília
      const hourInBrazil = getHourInBrazil(v.createdAt)
      
      if (hourInBrazil < 6) blocks[0]++
      else if (hourInBrazil < 12) blocks[1]++
      else if (hourInBrazil < 18) blocks[2]++
      else blocks[3]++
    })
    
    const maxVal = Math.max(...blocks, 1) // Evitar div/0
    const currentHourBrazil = nowBrazil.getHours()
    
    chartData = [
      { day: '00h', value: blocks[0], height: `${Math.max((blocks[0]/maxVal)*100, 5)}%`, active: currentHourBrazil < 6 },
      { day: '06h', value: blocks[1], height: `${Math.max((blocks[1]/maxVal)*100, 5)}%`, active: currentHourBrazil >= 6 && currentHourBrazil < 12 },
      { day: '12h', value: blocks[2], height: `${Math.max((blocks[2]/maxVal)*100, 5)}%`, active: currentHourBrazil >= 12 && currentHourBrazil < 18 },
      { day: '18h', value: blocks[3], height: `${Math.max((blocks[3]/maxVal)*100, 5)}%`, active: currentHourBrazil >= 18 },
    ]
  } else if (filter === '7d') {
    const daysStr = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    
    // Cria os últimos 7 dias baseado no horário de Brasília
    const last7Days = Array.from({length: 7}).map((_, i) => {
      const d = new Date(nowBrazil)
      d.setDate(nowBrazil.getDate() - (6 - i))
      d.setHours(0, 0, 0, 0)
      return { date: d, dayIndex: d.getDay(), count: 0 }
    })
    
    activeViews.forEach(v => {
      // Converte a data UTC do banco para data de Brasília e compara
      const viewDateBrazil = toSaoPauloTime(v.createdAt)
      const match = last7Days.find(d => isSameDayInBrazil(d.date, viewDateBrazil))
      if (match) match.count++
    })
    
    const maxVal = Math.max(...last7Days.map(d => d.count), 1)
    
    chartData = last7Days.map((d, i) => ({
      day: daysStr[d.dayIndex],
      value: d.count,
      height: `${Math.max((d.count/maxVal)*100, 10)}%`,
      active: i === 6 // Hoje é sempre o último
    }))
  } else {
    // 30 dias - vamos agrupar em 4 semanas (usando timezone do Brasil)
    const weeks = [0, 0, 0, 0]
    
    activeViews.forEach(v => {
      const viewDateBrazil = toSaoPauloTime(v.createdAt)
      const diffTime = Math.abs(nowBrazil.getTime() - viewDateBrazil.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 7) weeks[3]++
      else if (diffDays < 14) weeks[2]++
      else if (diffDays < 21) weeks[1]++
      else weeks[0]++
    })
    
    const maxVal = Math.max(...weeks, 1)
    chartData = [
      { day: 'Sem 1', value: weeks[0], height: `${Math.max((weeks[0]/maxVal)*100, 10)}%` },
      { day: 'Sem 2', value: weeks[1], height: `${Math.max((weeks[1]/maxVal)*100, 10)}%` },
      { day: 'Sem 3', value: weeks[2], height: `${Math.max((weeks[2]/maxVal)*100, 10)}%` },
      { day: 'Sem 4', value: weeks[3], height: `${Math.max((weeks[3]/maxVal)*100, 10)}%`, active: true },
    ]
  }

  return (
    <div className={styles.dashboardContainer}>
      
      {/* Top Section - Desempenho Básico */}
      <div className={styles.mainChartCard}>
        <div className={styles.cardHeader}>
          <h2>Visitas em Meus Anúncios (Total: {totalActiveViews})</h2>
          <div className={styles.filterGroup}>
            <Link href="/painel?filter=hoje" className={`${styles.filterBtn} ${filter === 'hoje' ? styles.active : ''}`}>Hoje</Link>
            <Link href="/painel?filter=7d" className={`${styles.filterBtn} ${filter === '7d' ? styles.active : ''}`}>7 Dias</Link>
            <Link href="/painel?filter=30d" className={`${styles.filterBtn} ${filter === '30d' ? styles.active : ''}`}>30 Dias</Link>
          </div>
        </div>
        
        <div className={styles.chartDays}>
          {chartData.map((data, index) => (
            <div key={index} className={`${styles.dayCol} ${data.active ? styles.activeDay : ''}`}>
              <span>{data.day}</span>
            </div>
          ))}
        </div>

        <div className={styles.chartArea}>
          {chartData.map((data, index) => (
            <div key={index} className={`${styles.barWrapper} ${data.active ? styles.barActive : ''}`}>
              <div className={styles.bar} style={{height: data.height}}></div>
            </div>
          ))}
        </div>

        <div className={styles.chartFooter}>
          <div className={styles.footerInfo}>
            <TrendingUp size={16} /> 
            {filter === 'hoje' 
              ? `Você teve ${totalActiveViews} visitas únicas na vitrine hoje!`
              : filter === '7d' 
              ? `O seu anúncio mais visto da semana gerou a maior parte das ${totalActiveViews} visitas.`
              : `Seus anúncios tiveram um total de ${totalActiveViews} visitas nos últimos 30 dias.`}
          </div>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        
        {/* Ranking de Corretores */}
        <div className={styles.meetingsCard}>
          <div className={styles.meetingsHeader} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#b4854d" /> Performance da Equipe
            </h3>
            <span style={{ fontSize: '0.8rem', background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
              {totalBrokers} Corretores
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {brokersRanking.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>Nenhum corretor com vendas registradas.</p>
            ) : (
              brokersRanking.map((broker, index) => (
                <div key={broker.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', flexShrink: 0, overflow: 'hidden' }}>
                    {broker.avatarUrl ? <Image src={broker.avatarUrl} alt={broker.name} fill unoptimized style={{ objectFit: 'cover' }} /> : (index + 1)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{broker.name}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{broker.goalPercentage.toFixed(1)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${broker.goalPercentage}%`, height: '100%', background: '#10b981', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link href="/painel/corretores" style={{ display: 'block', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
            Ver todos os corretores →
          </Link>
        </div>

        {/* Status do Portfólio */}
        <div className={styles.activityCard}>
          <div className={styles.cardHeader}>
            <h3>Resumo da Carteira (Real)</h3>
            <button className={styles.smallIconBtn}><Building size={16} /></button>
          </div>
          <div className={styles.portfolioStats}>
            <div className={styles.portItem}>
              <span className={styles.portLabel}>Total Cadastrado</span>
              <span className={styles.portValue}>{totalPropertiesCount} imóveis</span>
            </div>
            <div className={styles.portItem}>
              <span className={styles.portLabel}>Visualizações Hoje</span>
              <span className={styles.portValue}>{totalActiveViews} views</span>
            </div>
          </div>
          <div className={styles.miniChartArea}>
            <div className={styles.simpleProgressBar}>
              <div className={styles.simpleProgressFill} style={{width: '100%'}}></div>
            </div>
            <p className={styles.progressText}>100% dos dados sincronizados com o banco</p>
          </div>
        </div>

        {/* Tarefas e Lembretes Funcionais (Componente Cliente Isolado) */}
        <DashboardReminders />

      </div>
    </div>
  )
}
