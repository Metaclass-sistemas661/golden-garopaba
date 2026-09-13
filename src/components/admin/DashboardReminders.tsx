import prisma from '@/lib/prisma'
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import styles from '@/app/painel/page.module.css'

export default async function DashboardReminders() {
  const alerts = []
  
  // 1. Leads aguardando atendimento
  const newLeadsCount = await prisma.lead.count({
    where: { status: 'NEW' }
  })
  
  if (newLeadsCount > 0) {
    alerts.push({
      id: 'leads-new',
      type: 'danger',
      icon: <AlertCircle size={20} color="#ef4444" />,
      title: 'Leads não respondidos',
      text: `Existem ${newLeadsCount} novos leads aguardando seu primeiro contato. Quanto mais rápido responder, maior a conversão.`,
      link: '/painel/leads' // Se a rota leads ainda não existir, isso preparará o terreno
    })
  }
  
  // 2. Imóveis sem fotos
  const propertiesWithoutPhotos = await prisma.property.findMany({
    where: { 
      status: 'AVAILABLE',
    },
    select: { id: true, photos: true }
  })
  
  const propertiesReallyWithoutPhotos = propertiesWithoutPhotos.filter(p => p.photos.length === 0)
  
  if (propertiesReallyWithoutPhotos.length > 0) {
    alerts.push({
      id: 'props-no-photo',
      type: 'warning',
      icon: <AlertTriangle size={20} color="#f59e0b" />,
      title: 'Imóveis sem fotos',
      text: `Existem ${propertiesReallyWithoutPhotos.length} imóveis ativos sem nenhuma foto. Anúncios sem imagem são fortemente penalizados nas buscas.`,
      link: '/painel/imoveis'
    })
  }

  // 3. Imóveis Estagnados (> 90 dias)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  
  const stagnantPropertiesCount = await prisma.property.count({
    where: { 
      status: 'AVAILABLE',
      createdAt: { lt: ninetyDaysAgo }
    }
  })
  
  if (stagnantPropertiesCount > 0) {
    alerts.push({
      id: 'props-stagnant',
      type: 'info',
      icon: <Info size={20} color="#3b82f6" />,
      title: 'Imóveis estagnados',
      text: `Você tem ${stagnantPropertiesCount} imóveis anunciados há mais de 90 dias. Considere revisar valores, atualizar as fotos ou criar novos destaques.`,
      link: '/painel/imoveis'
    })
  }
  
  return (
    <div className={styles.insightsCard}>
      <div className={styles.cardHeader}>
        <h3>Alertas Inteligentes</h3>
        <AlertCircle size={18} color="#f59e0b" />
      </div>
      
      <div className={styles.insightList}>
        {alerts.length === 0 ? (
          <div className={styles.insightItem} style={{ border: '1px solid #10b981', background: '#ecfdf5', cursor: 'default' }}>
            <div className={styles.checkIcon}>
               <CheckCircle2 size={24} color="#10b981" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#065f46', fontSize: '0.95rem', fontWeight: 600 }}>Tudo em dia!</h4>
              <p style={{ margin: 0, color: '#047857', fontSize: '0.85rem', lineHeight: '1.4' }}>Excelente trabalho. Não há nenhuma ação urgente pendente no seu painel de operações.</p>
            </div>
          </div>
        ) : (
          alerts.map(alert => (
            <Link href={alert.link} key={alert.id} style={{ textDecoration: 'none' }}>
              <div 
                className={styles.insightItem} 
                style={{ 
                  cursor: 'pointer',
                  background: alert.type === 'danger' ? '#fef2f2' : alert.type === 'warning' ? '#fffbeb' : '#eff6ff',
                  borderColor: alert.type === 'danger' ? '#fecaca' : alert.type === 'warning' ? '#fde68a' : '#bfdbfe',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  {alert.icon}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '0.95rem', fontWeight: 600 }}>{alert.title}</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: '1.4' }}>{alert.text}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
