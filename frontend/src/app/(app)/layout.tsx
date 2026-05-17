'use client'

import { AppShell } from '@/components/layout/AppShell'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

function SessionLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-lg">
        ক্যা
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-foreground">বাজার হিসাব</p>
        <p className="text-xs text-muted-foreground">লোড হচ্ছে...</p>
      </div>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mt-1" />
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, setToken, setUser, logout } = useAuthStore()

  // Initialize synchronously from Zustand — if the user just logged in the token
  // is already in the store, so we skip the spinner entirely on login → dashboard.
  const [ready, setReady] = useState(() => !!token)

  // Prevents double-invocation in React Strict Mode (dev) from firing two
  // simultaneous refresh calls. With rotating refresh tokens the second call
  // fails, triggering logout() even though the first call succeeded.
  const refreshStarted = useRef(false)

  useEffect(() => {
    // Token already present (login path) — nothing to restore.
    if (token) return
    if (refreshStarted.current) return
    refreshStarted.current = true

    authService
      .refresh()
      .then(({ accessToken, user }) => {
        setToken(accessToken)
        setUser(user)
        document.cookie = `role=${user.role}; path=/; SameSite=Lax`
      })
      .catch(() => {
        logout()
        router.replace('/login')
      })
      .finally(() => setReady(true))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Session is being restored — show branded splash.
  if (!ready) return <SessionLoader />

  // Token was cleared (logout or refresh failure) and navigation to /login is
  // in-flight. Show the splash instead of a blank white screen.
  if (!token) return <SessionLoader />

  return <AppShell>{children}</AppShell>
}
