import { useState, type ReactNode } from 'react'
import { ToastContext } from './toastContext'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)

  function showToast(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 2800)
  }

  return <ToastContext.Provider value={{ showToast }}>{children}{toast && <div className={`fixed left-4 right-4 top-20 z-[60] rounded-lg border p-4 text-sm font-medium shadow-lg sm:left-auto sm:right-6 sm:max-w-sm ${toast.tone === 'error' ? 'border-[var(--error)]/30 bg-[var(--error-light)] text-[var(--error)]' : 'border-[var(--success)]/30 bg-[var(--success-light)] text-[var(--success)]'}`} role="status">{toast.message}</div>}</ToastContext.Provider>
}

