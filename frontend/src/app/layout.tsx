import type { Metadata, Viewport } from 'next'
import { Hind_Siliguri } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/providers/QueryProvider'
import { cn } from '@/lib/utils'
import './globals.css'

const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'বাজার হিসাব',
  description: 'বাজার হিসাব সফটওয়্যার',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={cn('font-sans', hind.variable)}>
      <body className="min-h-screen bg-background antialiased">
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
