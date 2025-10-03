import { NextRequest, NextResponse } from 'next/server'

// Rate limiting simples em memória (para produção, use Redis ou similar)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

// Configurações de rate limiting
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // máximo 100 requests por IP por janela
  apiMaxRequests: 10, // máximo 10 requests para APIs sensíveis
}

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`
}

function isRateLimited(ip: string, path: string, maxRequests: number): boolean {
  const key = getRateLimitKey(ip, path)
  const now = Date.now()
  const record = rateLimit.get(key)

  if (!record || now > record.resetTime) {
    // Nova janela de tempo
    rateLimit.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    })
    return false
  }

  if (record.count >= maxRequests) {
    return true
  }

  record.count++
  return false
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Headers de segurança
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;"
  )

  // Obter IP do cliente
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  const pathname = request.nextUrl.pathname

  // Rate limiting para APIs sensíveis
  if (pathname.startsWith('/api/')) {
    const maxRequests = pathname.includes('payment') || pathname.includes('webhook')
      ? RATE_LIMIT.apiMaxRequests
      : RATE_LIMIT.maxRequests

    if (isRateLimited(ip, pathname, maxRequests)) {
      return NextResponse.json(
        {
          error: 'Muitas tentativas. Tente novamente mais tarde.',
          retryAfter: Math.ceil(RATE_LIMIT.windowMs / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(RATE_LIMIT.windowMs / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    // Adicionar headers de rate limit
    const key = getRateLimitKey(ip, pathname)
    const record = rateLimit.get(key)
    if (record) {
      response.headers.set('X-RateLimit-Limit', maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString())
      response.headers.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString())
    }
  }

  // Validação de User-Agent para APIs
  if (pathname.startsWith('/api/') && !pathname.includes('/webhooks/')) {
    const userAgent = request.headers.get('user-agent')
    if (!userAgent || userAgent.length < 10) {
      return NextResponse.json(
        { error: 'User-Agent inválido' },
        { status: 400 }
      )
    }
  }

  // Validação de Content-Type para POSTs
  if (request.method === 'POST' && pathname.startsWith('/api/') && !pathname.includes('/webhooks/')) {
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser application/json' },
        { status: 400 }
      )
    }
  }

  return response
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
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}

