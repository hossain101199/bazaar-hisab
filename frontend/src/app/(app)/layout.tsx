'use client'

import { AppShell } from '@/components/layout/AppShell'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, setToken, setUser, logout } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (token) {
      setReady(true)
      return
    }
    // No in-memory token — try to get a new one from the httpOnly refresh cookie.
    authService
      .refresh()
      .then(({ accessToken, user }) => {
        setToken(accessToken)
        setUser(user)
      })
      .catch(() => {
        logout()
        router.replace('/login')
      })
      .finally(() => setReady(true))
  // Run once on mount — intentionally empty dep array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return null

  if (!token) return null

  return <AppShell>{children}</AppShell>
}
