# Guia de Segurança - Sistema de Pagamentos

Este documento detalha todas as medidas de segurança implementadas no sistema de pagamentos e as melhores práticas para manter a aplicação segura.

## 🔒 Visão Geral de Segurança

### Princípios de Segurança Aplicados
1. **Defesa em Profundidade**: Múltiplas camadas de proteção
2. **Princípio do Menor Privilégio**: Acesso mínimo necessário
3. **Validação de Entrada**: Todos os dados são validados e sanitizados
4. **Monitoramento Contínuo**: Logs e alertas de segurança
5. **Criptografia**: Dados sensíveis sempre criptografados

## 🛡️ Medidas de Segurança Implementadas

### 1. Rate Limiting
**Localização**: `src/middleware.ts`

```typescript
// Configurações de rate limiting
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // máximo 100 requests por IP por janela
  apiMaxRequests: 10, // máximo 10 requests para APIs sensíveis
}
```

**Proteções**:
- APIs gerais: 100 requests por 15 minutos
- APIs de pagamento: 10 requests por 15 minutos
- Headers informativos de rate limit
- Bloqueio automático de IPs abusivos

### 2. Headers de Segurança
**Localização**: `src/middleware.ts`

```typescript
// Headers de segurança implementados
response.headers.set('X-Content-Type-Options', 'nosniff')
response.headers.set('X-Frame-Options', 'DENY')
response.headers.set('X-XSS-Protection', '1; mode=block')
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
response.headers.set('Content-Security-Policy', "...")
```

**Proteções**:
- **X-Content-Type-Options**: Previne MIME type sniffing
- **X-Frame-Options**: Previne clickjacking
- **X-XSS-Protection**: Proteção contra XSS
- **CSP**: Política rigorosa de conteúdo
- **Referrer-Policy**: Controle de informações de referência

### 3. Validação e Sanitização
**Localização**: `src/lib/validation.ts`

#### Validação de Dados de Entrada
```typescript
export const createPaymentIntentSchema = z.object({
  amount: z.number()
    .int('Valor deve ser um número inteiro')
    .min(50, 'Valor mínimo é R$ 0,50')
    .max(100000000, 'Valor máximo é R$ 1.000.000'),
  currency: z.string()
    .min(3, 'Código da moeda deve ter 3 caracteres')
    .max(3, 'Código da moeda deve ter 3 caracteres')
    .regex(/^[A-Z]{3}$/, 'Código da moeda deve conter apenas letras maiúsculas')
})
```

#### Sanitização de Strings
```typescript
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove caracteres perigosos
    .substring(0, 1000) // Limita tamanho
}
```

#### Detecção de Injeção
```typescript
export function detectInjection(input: string): boolean {
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    // ... mais padrões
  ]
  
  return injectionPatterns.some(pattern => pattern.test(input))
}
```

### 4. Logging de Segurança
**Localização**: `src/lib/security-logger.ts`

#### Eventos Monitorados
- **Rate Limit**: Tentativas de excesso de requisições
- **Requests Inválidos**: Dados malformados ou suspeitos
- **Tentativas de Pagamento**: Sucessos e falhas
- **Webhooks**: Eventos recebidos do Stripe
- **Atividades Suspeitas**: Padrões anômalos

#### Detecção de Padrões Suspeitos
```typescript
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

  // ... mais verificações
}
```

### 5. Verificação de Webhooks
**Localização**: `src/app/api/webhooks/stripe/route.ts`

```typescript
// Verificação de assinatura do webhook
try {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
} catch (err) {
  securityLogger.logSuspiciousActivity(
    ip,
    '/api/webhooks/stripe',
    'Assinatura de webhook inválida'
  )
  return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
}
```

## 🔐 Configurações de Segurança

### Variáveis de Ambiente Sensíveis
```env
# NUNCA commite essas variáveis no código
STRIPE_SECRET_KEY=sk_live_...          # Chave secreta do Stripe
STRIPE_WEBHOOK_SECRET=whsec_...        # Secret do webhook
NEXTAUTH_SECRET=...                    # Secret para autenticação
DATABASE_URL=...                       # URL do banco de dados
```

### Configuração de HTTPS
**Obrigatório em produção**:
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ]
  }
}
```

## 🚨 Monitoramento e Alertas

### Métricas de Segurança
1. **Taxa de Rate Limiting**: % de requests bloqueados
2. **Tentativas de Injeção**: Número de tentativas detectadas
3. **Falhas de Webhook**: Webhooks com assinatura inválida
4. **IPs Suspeitos**: IPs com atividade anômala
5. **Tempo de Resposta**: Detecção de ataques DDoS

### Logs Críticos
```javascript
// Exemplo de log de segurança crítico
{
  "level": "CRITICAL",
  "type": "suspicious_activity",
  "ip": "192.168.1.100",
  "path": "/api/create-payment-intent",
  "reason": "Múltiplas tentativas de injeção SQL",
  "timestamp": "2025-01-01T12:00:00Z",
  "user_agent": "...",
  "details": {
    "attempts": 15,
    "patterns_detected": ["<script>", "DROP TABLE"]
  }
}
```

## 🛠️ Ferramentas de Segurança Recomendadas

### Desenvolvimento
- **ESLint Security Plugin**: Detecção de vulnerabilidades no código
- **npm audit**: Verificação de dependências vulneráveis
- **Snyk**: Monitoramento contínuo de vulnerabilidades

### Produção
- **Cloudflare**: WAF e proteção DDoS
- **Sentry**: Monitoramento de erros e performance
- **DataDog**: Logs e métricas de segurança
- **AWS GuardDuty**: Detecção de ameaças

## 📋 Checklist de Segurança

### Antes do Deploy
- [ ] Todas as variáveis de ambiente configuradas
- [ ] HTTPS ativado e certificado válido
- [ ] Rate limiting testado
- [ ] Webhooks configurados corretamente
- [ ] Logs de segurança funcionando
- [ ] Backup e recovery testados

### Monitoramento Contínuo
- [ ] Alertas de segurança configurados
- [ ] Logs sendo coletados e analisados
- [ ] Métricas de performance monitoradas
- [ ] Atualizações de segurança aplicadas
- [ ] Testes de penetração regulares

### Resposta a Incidentes
- [ ] Plano de resposta a incidentes definido
- [ ] Contatos de emergência atualizados
- [ ] Procedimentos de rollback testados
- [ ] Comunicação com usuários preparada

## 🔍 Auditoria de Segurança

### Verificações Regulares
1. **Análise de Logs**: Revisar logs de segurança semanalmente
2. **Teste de Penetração**: Testes trimestrais
3. **Revisão de Código**: Code review focado em segurança
4. **Atualização de Dependências**: Mensal
5. **Treinamento da Equipe**: Semestral

### Relatórios de Segurança
```javascript
// Exemplo de relatório automático
{
  "period": "2025-01-01 to 2025-01-31",
  "total_events": 15420,
  "security_events": {
    "rate_limit": 45,
    "invalid_request": 12,
    "suspicious_activity": 3,
    "payment_attempts": 1250
  },
  "top_threats": [
    {
      "type": "rate_limit_violation",
      "count": 45,
      "top_ips": ["192.168.1.100", "10.0.0.50"]
    }
  ],
  "recommendations": [
    "Investigar IP 192.168.1.100 por atividade suspeita",
    "Considerar reduzir rate limit para APIs sensíveis"
  ]
}
```

## 🚨 Procedimentos de Emergência

### Em Caso de Ataque
1. **Identificação**: Confirmar se é um ataque real
2. **Contenção**: Bloquear IPs maliciosos
3. **Análise**: Determinar escopo e impacto
4. **Mitigação**: Aplicar correções necessárias
5. **Recuperação**: Restaurar serviços normais
6. **Lições Aprendidas**: Documentar e melhorar

### Contatos de Emergência
- **Equipe de Segurança**: security@empresa.com
- **Stripe Support**: https://support.stripe.com
- **Provedor de Hospedagem**: [contato do provedor]

## 📚 Recursos Adicionais

### Documentação
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Stripe Security](https://stripe.com/docs/security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

### Ferramentas
- [Security Headers](https://securityheaders.com/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [OWASP ZAP](https://www.zaproxy.org/)

---

**⚠️ Lembre-se: A segurança é um processo contínuo, não um estado final. Mantenha-se sempre atualizado com as melhores práticas e ameaças emergentes.**

