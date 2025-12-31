import { z } from 'zod'

/* ------------------------------------------------------------------
 * CONFIGURAÇÃO DE PREÇO E CÂMBIO
 * ------------------------------------------------------------------ */

// Preço base do produto (USD)
export const BASE_PRICE_USD = 8

// Cotações fixas (USD como base)
// ⚠️ depois você pode trocar por API real
export const EXCHANGE_RATES = {
  usd: 1,
  brl: 5.57,
  eur: 0.92,
  gbp: 0.79,
} as const

export type SupportedCurrency = keyof typeof EXCHANGE_RATES

/* ------------------------------------------------------------------
 * SCHEMA DE CRIAÇÃO DO PAYMENT INTENT
 * ------------------------------------------------------------------ */

// Frontend envia APENAS a moeda
export const createPaymentIntentSchema = z
  .object({
    currency: z.enum(['usd', 'brl', 'eur', 'gbp']),
  })
  .transform((data) => {
    const rate = EXCHANGE_RATES[data.currency]

    // Converte USD → moeda escolhida
    const convertedValue = BASE_PRICE_USD * rate

    // Stripe trabalha com centavos
    const amountInCents = Math.round(convertedValue * 100)

    return {
      currency: data.currency,
      amount: amountInCents,
      basePriceUsd: BASE_PRICE_USD,
      exchangeRate: rate,
    }
  })

/* ------------------------------------------------------------------
 * SCHEMA PARA VALIDAÇÃO DE WEBHOOK
 * ------------------------------------------------------------------ */

export const verifyPaymentSchema = z.object({
  client_secret: z.string()
    .min(1, 'Client secret é obrigatório')
    .regex(/^pi_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/, 'Formato de client secret inválido'),
})

/* ------------------------------------------------------------------
 * FUNÇÕES DE SEGURANÇA (MANTIDAS)
 * ------------------------------------------------------------------ */

// Sanitização de strings
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '')
    .substring(0, 1000)
}

// Validação de e-mail
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Validação de CPF
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/[^\d]/g, '')
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  remainder = remainder === 10 ? 0 : remainder
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  remainder = remainder === 10 ? 0 : remainder
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false

  return true
}

// Validação de CNPJ
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
  if (cleanCNPJ.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false

  let length = cleanCNPJ.length - 2
  let numbers = cleanCNPJ.substring(0, length)
  const digits = cleanCNPJ.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  length++
  numbers = cleanCNPJ.substring(0, length)
  sum = 0
  pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

// Validação de telefone brasileiro
export function validateBrazilianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[^\d]/g, '')
  if (cleanPhone.length < 10 || cleanPhone.length > 11) return false
  const ddd = parseInt(cleanPhone.substring(0, 2))
  return ddd >= 11 && ddd <= 99
}

// Validação de CEP
export function validateCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/[^\d]/g, '')
  return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP)
}

// Detecção de injeção
export function detectInjection(input: string): boolean {
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ]

  return injectionPatterns.some(pattern => pattern.test(input))
}

// Validação de origem
export function validateOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false
  return allowedOrigins.includes(origin)
}

// Geração de hash seguro
export async function generateSecureHash(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
