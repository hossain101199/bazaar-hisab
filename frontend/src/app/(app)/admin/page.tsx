'use client'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/admin.service'
import { selectIsAdmin, useAuthStore } from '@/store/auth.store'
import type { User } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { bn } from 'date-fns/locale'
import { Package, Ruler, Shield, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function AdminPage() {
  const router = useRouter()
  const isAdmin = useAuthStore(selectIsAdmin)

  useEffect(() => {
    if (!isAdmin) router.replace('/dashboard')
  }, [isAdmin, router])

  const { data: users = [], isLoading, isError } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => adminService.listUsers().then(r => r.data.users),
    enabled: isAdmin,
  })

  useEffect(() => {
    if (isError) toast.error('ব্যবহারকারী লোড ব্যর্থ হয়েছে')
  }, [isError])

  if (!isAdmin) return null

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">অ্যাডমিন প্যানেল</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/units" className={cn('flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors')}>
          <Ruler className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium">একক পরিচালনা</span>
          <span className="text-xs text-muted-foreground text-center">SYSTEM একক যোগ করুন</span>
        </Link>
        <Link href="/products" className={cn('flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors')}>
          <Package className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium">পণ্য পরিচালনা</span>
          <span className="text-xs text-muted-foreground text-center">SYSTEM পণ্য যোগ করুন</span>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            ব্যবহারকারী তালিকা
            {!isLoading && (
              <Badge variant="secondary" className="text-xs ml-auto">{users.length} জন</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded" />)}
            </div>
          )}
          {!isLoading && users.map((u, i) => (
            <div key={u.id}>
              {i > 0 && <Separator />}
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0">
                    {u.role === 'ADMIN' ? 'অ্যাডমিন' : 'ব্যবহারকারী'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(u.createdAt), 'dd MMM yy', { locale: bn })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
