interface SecurityEvent {
  type: 'rate_limit' | 'invalid_request' | 'payment_attempt' | 'webhook_received' | 'suspicious_activity'
  ip: string
  userAgent?: string
  path: string
  details?: Record<string, any>
  timestamp: Date
}

class SecurityLogger {
  private events: SecurityEvent[] = []
  private maxEvents = 1000 // Manter apenas os últimos 1000 eventos em memória

  log(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    }

    this.events.push(securityEvent)

    // Manter apenas os eventos mais recentes
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Log no console para desenvolvimento
    console.log('Security Event:', JSON.stringify(securityEvent, null, 2))

    // Em produção, você enviaria para um serviço de logging como:
    // - AWS CloudWatch
    // - Google Cloud Logging
    // - Datadog
    // - Sentry
    // - ELK Stack
  }

  logRateLimit(ip: string, path: string, userAgent?: string) {
    this.log({
      type: 'rate_limit',
      ip,
      path,
      userAgent,
      details: {
        message: 'Rate limit exceeded',
      },
    })
  }

  logInvalidRequest(ip: string, path: string, reason: string, userAgent?: string) {
    this.log({
      type: 'invalid_request',
      ip,
      path,
      userAgent,
      details: {
        reason,
      },
    })
  }

  logPaymentAttempt(ip: string, amount: number, currency: string, success: boolean, userAgent?: string) {
    this.log({
      type: 'payment_attempt',
      ip,
      path: '/api/create-payment-intent',
      userAgent,
      details: {
        amount,
        currency,
        success,
      },
    })
  }

  logWebhookReceived(ip: string, eventType: string, eventId: string) {
    this.log({
      type: 'webhook_received',
      ip,
      path: '/api/webhooks/stripe',
      details: {
        eventType,
        eventId,
      },
    })
  }

  logSuspiciousActivity(ip: string, path: string, reason: string, userAgent?: string, details?: Record<string, any>) {
    this.log({
      type: 'suspicious_activity',
      ip,
      path,
      userAgent,
      details: {
        reason,
        ...details,
      },
    })
  }

  getRecentEvents(limit = 100): SecurityEvent[] {
    return this.events.slice(-limit)
  }

  getEventsByType(type: SecurityEvent['type'], limit = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit)
  }

  getEventsByIP(ip: string, limit = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.ip === ip)
      .slice(-limit)
  }

  // Detectar padrões suspeitos
  detectSuspiciousPatterns(ip: string): {
    issuspicious: boolean
    reasons: string[]
  } {
    const recentEvents = this.getEventsByIP(ip, 50)
    const reasons: string[] = []

    // Muitas tentativas de rate limit
    const rateLimitEvents = recentEvents.filter(e => e.type === 'rate_limit')
    if (rateLimitEvents.length > 5) {
      reasons.push('Múltiplas violações de rate limit')
    }

    // Muitas requisições inválidas
    const invalidRequests = recentEvents.filter(e => e.type === 'invalid_request')
    if (invalidRequests.length > 10) {
      reasons.push('Múltiplas requisições inválidas')
    }

    // Tentativas de pagamento falhadas
    const failedPayments = recentEvents.filter(
      e => e.type === 'payment_attempt' && e.details?.success === false
    )
    if (failedPayments.length > 3) {
      reasons.push('Múltiplas tentativas de pagamento falhadas')
    }

    // Atividade em horários suspeitos (exemplo: muitas requisições em pouco tempo)
    const recentActivity = recentEvents.filter(
      e => Date.now() - e.timestamp.getTime() < 5 * 60 * 1000 // últimos 5 minutos
    )
    if (recentActivity.length > 20) {
      reasons.push('Atividade excessiva em pouco tempo')
    }

    return {
      issuspicious: reasons.length > 0,
      reasons,
    }
  }

  // Gerar relatório de segurança
  generateSecurityReport(): {
    totalEvents: number
    eventsByType: Record<string, number>
    topIPs: Array<{ ip: string; count: number }>
    suspiciousIPs: Array<{ ip: string; reasons: string[] }>
  } {
    const eventsByType: Record<string, number> = {}
    const ipCounts: Record<string, number> = {}

    this.events.forEach(event => {
      // Contar por tipo
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1

      // Contar por IP
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1
    })

    // Top IPs por atividade
    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }))

    // IPs suspeitos
    const suspiciousIPs = Object.keys(ipCounts)
      .map(ip => ({
        ip,
        ...this.detectSuspiciousPatterns(ip),
      }))
      .filter(result => result.issuspicious)
      .map(({ ip, reasons }) => ({ ip, reasons }))

    return {
      totalEvents: this.events.length,
      eventsByType,
      topIPs,
      suspiciousIPs,
    }
  }
}

// Instância singleton
export const securityLogger = new SecurityLogger()

// Função helper para obter IP da requisição
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')

  return (
    forwardedFor?.split(',')[0]?.trim() ||
    realIP ||
    remoteAddr ||
    '127.0.0.1'
  )
}

