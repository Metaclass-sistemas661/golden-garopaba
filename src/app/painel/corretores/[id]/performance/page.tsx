import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, DollarSign, Target, Award } from 'lucide-react'

interface PerformanceProps {
  params: Promise<{
    id: string
  }>
}

export default async function PerformancePage({ params }: PerformanceProps) {
  const { id } = await params
  
  const broker = await prisma.broker.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { transactionDate: 'desc' },
        include: { property: true }
      }
    }
  })

  if (!broker) {
    notFound()
  }

  // Cálculos Reais
  const totalSalesAmount = broker.transactions.reduce((acc, t) => acc + Number(t.amount), 0)
  const totalCommission = broker.transactions.reduce((acc, t) => acc + Number(t.commissionAmount), 0)
  
  const goal = Number(broker.salesGoalQuarterly)
  const goalPercentage = goal > 0 ? (totalSalesAmount / goal) * 100 : 0
  const isGoalReached = goalPercentage >= 100

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/painel/corretores" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#f8fafc', borderRadius: '12px', color: '#475569' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Performance: {broker.displayName}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
            Acompanhamento de metas e fechamentos
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: '#fef3c7', padding: '0.5rem', borderRadius: '8px', color: '#d97706' }}><Target size={24} /></div>
            <span style={{ fontWeight: 600, color: '#475569' }}>Meta Trimestral</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
            {goal > 0 ? `R$ ${(goal / 1000000).toFixed(1)} Mi` : 'Não definida'}
          </h2>
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
          {isGoalReached && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#10b981' }} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: '#dcfce7', padding: '0.5rem', borderRadius: '8px', color: '#16a34a' }}><TrendingUp size={24} /></div>
            <span style={{ fontWeight: 600, color: '#475569' }}>Vendas Realizadas</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
            R$ {totalSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          {goal > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(goalPercentage, 100)}%`, height: '100%', background: isGoalReached ? '#10b981' : '#3b82f6', borderRadius: '3px' }} />
              </div>
              <span style={{ fontSize: '0.85rem', color: isGoalReached ? '#10b981' : '#64748b', fontWeight: 600 }}>
                {goalPercentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: '#e0e7ff', padding: '0.5rem', borderRadius: '8px', color: '#4f46e5' }}><Award size={24} /></div>
            <span style={{ fontWeight: 600, color: '#475569' }}>Comissões Geradas</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
            R$ {totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Base: {Number(broker.commissionPercentageSale)}% Venda / {Number(broker.commissionPercentageRent)}% Aluguel</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#1e293b', margin: '0 0 1.5rem 0' }}>Histórico de Fechamentos</h3>
        
        {broker.transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
            <DollarSign size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
            <p>Nenhuma transação registrada para este corretor ainda.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Data</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Imóvel</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tipo</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Valor Negociado</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Comissão</th>
                </tr>
              </thead>
              <tbody>
                {broker.transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', color: '#334155' }}>
                      {t.transactionDate.toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '1rem', color: '#334155', fontWeight: 500 }}>
                      {t.property.title} <br/>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cód: {t.property.code}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {t.transactionType === 'SALE' ? 'Venda' : 'Aluguel'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 600 }}>
                      R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '1rem', color: '#16a34a', fontWeight: 600 }}>
                      R$ {Number(t.commissionAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
