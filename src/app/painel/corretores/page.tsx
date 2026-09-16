import Link from 'next/link'
import Image from 'next/image'
import { Edit, Award, Target, UserCircle2 } from 'lucide-react'
import styles from './page.module.css'
import prisma from '@/lib/prisma'

import BrokerSearchInput from '@/components/admin/BrokerSearchInput'

export const dynamic = 'force-dynamic'

export default async function CorretoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const resolvedParams = await searchParams
  const q = resolvedParams.q || ''

  const brokers = await prisma.broker.findMany({
    where: q ? {
      OR: [
        { displayName: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { creci: { contains: q, mode: 'insensitive' } }
      ]
    } : undefined,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Corretores Associados</h1>
          <p className={styles.subtitle}>Gestão de equipe, metas de vendas e performance corporativa.</p>
        </div>
        <div className={styles.headerActions}>
          <BrokerSearchInput />
        </div>
      </div>

      {/* GRID DE CORRETORES */}
      <div className={styles.grid}>
        {brokers.length === 0 ? (
          <div className={styles.emptyState}>
            Nenhum corretor cadastrado ainda.
          </div>
        ) : (
          brokers.map(broker => (
            <div key={broker.id} className={styles.brokerCard}>
              <div className={styles.cardHeader}>
                <div className={styles.brokerInfo}>
                  <div className={styles.avatar}>
                    {broker.avatarUrl ? (
                      <Image src={broker.avatarUrl} alt={broker.displayName} width={56} height={56} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <UserCircle2 size={56} strokeWidth={1} color="#cbd5e1" />
                    )}
                  </div>
                  <div className={styles.nameInfo}>
                    <h3>{broker.displayName}</h3>
                    <p>CRECI: {broker.creci}</p>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${styles[broker.status.toLowerCase()]}`}>
                  {broker.status === 'ACTIVE' ? 'Ativo' : broker.status === 'VACATION' ? 'Férias' : 'Inativo'}
                </span>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Especialidade</span>
                  <span className={styles.statValue}>{broker.specialty}</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Comissões</span>
                  <span className={styles.statValue} style={{fontSize: '1rem'}}>{Number(broker.commissionPercentageSale)}% (V) / {Number(broker.commissionPercentageRent)}% (A)</span>
                </div>
              </div>

              <div className={styles.goalSection}>
                <div className={styles.goalHeader}>
                  <Target size={16} className={styles.goalIcon} />
                  <span className={styles.statLabel}>Meta Trimestral (Vendas)</span>
                </div>
                <span className={styles.goalValue}>
                  {broker.salesGoalQuarterly ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(broker.salesGoalQuarterly)) : 'Não definida'}
                </span>
              </div>

              <div className={styles.cardActions}>
                <Link href={`/painel/corretores/editar/${broker.id}`} className={`${styles.actionBtn} ${styles.btnSecondary}`}>
                  <Edit size={16} />
                  Editar
                </Link>
                <Link href={`/painel/corretores/${broker.id}/performance`} className={`${styles.actionBtn} ${styles.btnPrimary}`}>
                  <Award size={16} />
                  Ver Performance
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
