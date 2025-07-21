import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Skip middleware for API routes, static files, and login page
  if (
    req.nextUrl.pathname.startsWith('/api/') ||
    req.nextUrl.pathname.startsWith('/_next/') ||
    req.nextUrl.pathname === '/login' ||
    req.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // For now, let the client-side handle authentication
  // This middleware can be enhanced later for server-side auth checks
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}