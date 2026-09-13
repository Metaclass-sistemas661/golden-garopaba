'use client'

import { useState } from 'react'
import { X, CheckCircle, Handshake, Loader2, DollarSign, Calendar, User } from 'lucide-react'
import { registerTransaction } from '@/app/actions/transactions'
import { BrokerDTO } from '@/types/dto'
import styles from './TransactionModal.module.css'

interface TransactionModalProps {
  propertyId: string
  propertyTitle: string
  transactionType: 'SALE' | 'RENT'
  brokers: BrokerDTO[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function TransactionModal({ propertyId, propertyTitle, transactionType, brokers, isOpen, onClose, onSuccess }: TransactionModalProps) {
  const [selectedBroker, setSelectedBroker] = useState('')
  const [amount, setAmount] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBroker || !amount || !transactionDate) return

    setIsSaving(true)
    
    // Converte o valor formatado para number (removendo pontos)
    const numericAmount = Number(amount.replace(/\./g, '').replace(',', '.'))

    const res = await registerTransaction({
      propertyId,
      brokerId: selectedBroker,
      transactionType,
      amount: numericAmount,
      transactionDate
    })

    if (res.success) {
      onSuccess()
    } else {
      alert(res.error || 'Erro ao registrar fechamento.')
    }
    setIsSaving(false)
  }

  // Máscara monetária simples
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value === '') {
      setAmount('')
      return
    }
    
    const numberValue = parseInt(value, 10) / 100
    setAmount(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.iconWrapper}>
              <Handshake size={24} color="#b4854d" />
            </div>
            <div>
              <h2>Registrar Fechamento</h2>
              <p>{propertyTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Corretor Responsável</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <select required value={selectedBroker} onChange={e => setSelectedBroker(e.target.value)}>
                <option value="">Selecione o corretor...</option>
                {brokers.map(broker => {
                  const percent = transactionType === 'SALE' ? broker.commissionPercentageSale : broker.commissionPercentageRent;
                  return (
                    <option key={broker.id} value={broker.id}>
                      {broker.displayName} ({Number(percent)}%)
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Valor Fechado (R$)</label>
              <div className={styles.inputWrapper}>
                <DollarSign size={18} className={styles.inputIcon} />
                <input 
                  type="text" 
                  required 
                  placeholder="0,00" 
                  value={amount} 
                  onChange={handleAmountChange} 
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Data do Negócio</label>
              <div className={styles.inputWrapper}>
                <Calendar size={18} className={styles.inputIcon} />
                <input 
                  type="date" 
                  required 
                  value={transactionDate} 
                  onChange={e => setTransactionDate(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancelar</button>
            <button type="submit" disabled={isSaving || !selectedBroker || !amount} className={styles.confirmBtn}>
              {isSaving ? <Loader2 size={18} className={styles.spin} /> : <CheckCircle size={18} />}
              Confirmar Fechamento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
