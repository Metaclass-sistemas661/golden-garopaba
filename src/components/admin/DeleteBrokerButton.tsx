'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { deleteBroker } from '@/app/actions/brokers'
import styles from '@/app/painel/corretores/page.module.css'

interface DeleteBrokerButtonProps {
  brokerId: string
  brokerName: string
  creci: string
  transactionCount: number
}

/**
 * Botão e modal de confirmação para excluir um corretor diretamente no banco de dados.
 * Usa Portal em document.body para não ficar preso ao containing block do card com transform.
 */
export default function DeleteBrokerButton({
  brokerId,
  brokerName,
  creci,
  transactionCount,
}: DeleteBrokerButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        setIsOpen(false)
        setErrorMessage(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isDeleting])

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    setErrorMessage(null)

    const result = await deleteBroker(brokerId)

    if (result.success) {
      setIsOpen(false)
      setIsDeleting(false)
      router.refresh()
      return
    }

    setErrorMessage(result.error || 'Não foi possível excluir o corretor. Tente novamente.')
    setIsDeleting(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorMessage(null)
          setIsOpen(true)
        }}
        className={`${styles.actionBtn} ${styles.btnDanger}`}
        aria-label={`Excluir corretor ${brokerName}`}
        title="Excluir corretor"
      >
        <Trash2 size={16} />
        Excluir
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-broker-title-${brokerId}`}
            onClick={() => {
              if (!isDeleting) {
                setIsOpen(false)
                setErrorMessage(null)
              }
            }}
          >
            <div className={styles.confirmModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div className={styles.confirmTitleGroup}>
                  <span className={styles.confirmIconWrap}>
                    <AlertTriangle size={22} />
                  </span>
                  <div>
                    <h3 id={`delete-broker-title-${brokerId}`} className={styles.modalTitle}>
                      Excluir corretor
                    </h3>
                    <p className={styles.modalSubtitle}>
                      {brokerName} • CRECI {creci}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => {
                    if (!isDeleting) {
                      setIsOpen(false)
                      setErrorMessage(null)
                    }
                  }}
                  aria-label="Fechar janela de confirmação"
                  disabled={isDeleting}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.confirmModalBody}>
                <p className={styles.confirmText}>
                  Tem certeza que deseja excluir <strong>{brokerName}</strong> permanentemente do banco de dados? Esta ação não pode ser desfeita.
                </p>

                {transactionCount > 0 && (
                  <div className={styles.confirmWarning}>
                    Este corretor possui <strong>{transactionCount}</strong>{' '}
                    {transactionCount === 1 ? 'transação registrada' : 'transações registradas'} no histórico, que também {transactionCount === 1 ? 'será removida' : 'serão removidas'} em cascata.
                  </div>
                )}

                {errorMessage && (
                  <div className={styles.confirmError} role="alert">
                    {errorMessage}
                  </div>
                )}
              </div>

              <div className={styles.confirmModalActions}>
                <button
                  type="button"
                  className={styles.cancelModalBtn}
                  onClick={() => {
                    setIsOpen(false)
                    setErrorMessage(null)
                  }}
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.confirmDeleteBtn}
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  <Trash2 size={16} />
                  {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
