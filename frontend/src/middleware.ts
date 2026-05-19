import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = new Set(['/login', '/register'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has('refreshToken')
  const role = request.cookies.get('role')?.value

  // Root: redirect based on session state
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(hasSession ? '/dashboard' : '/login', request.url)
    )
  }

  // Authenticated user → away from login/register
  if (PUBLIC_PATHS.has(pathname) && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Unauthenticated user → away from protected pages
  if (!PUBLIC_PATHS.has(pathname) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated non-admin → away from admin pages.
  // The role cookie is refreshed on every token rotation (POST /api/auth/refresh),
  // so it reflects the DB role within one access-token TTL (15 min) of any change.
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
