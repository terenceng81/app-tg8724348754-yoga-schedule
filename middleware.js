import { NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export function middleware(request) {
  const session = getSessionCookie(request)
  const path = request.nextUrl.pathname

  // Protect dashboard and admin routes
  if ((path.startsWith('/dashboard') || path.startsWith('/admin')) && !session) {
    return NextResponse.redirect(new URL(`/login?return=${encodeURIComponent(path)}`, request.url))
  }

  // Admin-only guard
  if (path.startsWith('/admin') && session) {
    try {
      const payload = JSON.parse(Buffer.from(session.split('.')[1], 'base64').toString())
      if (payload?.user?.role !== 'admin') {
        return NextResponse.redirect(new URL('/schedule', request.url))
      }
    } catch {}
  }

  return NextResponse.next()
}
export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] }
