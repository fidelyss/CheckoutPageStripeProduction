import { z } from 'zod'

// Schema para validação de PaymentIntent
export const createPaymentIntentSchema = z.object({
  amount: z.number()
    .int()
    .min(50, 'Valor mínimo é R$ 0,50')
    .max(100000000, 'Valor máximo é R$ 1.000.000'),

  currency: z.string()
    .min(3, 'Código da moeda deve ter 3 caracteres')
    .max(3, 'Código da moeda deve ter 3 caracteres')
    .regex(/^[a-zA-Z]{3}$/, 'Código da moeda deve conter apenas letras'),

});


// Schema para validação de webhook
export const verifyPaymentSchema = z.object({
  client_secret: z.string()
    .min(1, 'Client secret é obrigatório')
    .regex(/^pi_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/, 'Formato de client secret inválido'),
})

// Função para sanitizar strings
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove caracteres perigosos
    .substring(0, 1000) // Limita tamanho
}

// Função para validar e sanitizar e-mail
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Função para validar CPF (formato brasileiro)
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/[^\d]/g, '')

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  // Validação dos dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false

  return true
}

// Função para validar CNPJ (formato brasileiro)
export function validateCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '')

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false

  // Validação dos dígitos verificadores
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

  length = length + 1
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

// Função para validar número de telefone brasileiro
export function validateBrazilianPhone(phone: string): boolean {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/[^\d]/g, '')

  // Verifica se tem 10 ou 11 dígitos (com DDD)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) return false

  // Verifica se o DDD é válido (11-99)
  const ddd = parseInt(cleanPhone.substring(0, 2))
  if (ddd < 11 || ddd > 99) return false

  return true
}

// Função para validar CEP brasileiro
export function validateCEP(cep: string): boolean {
  // Remove caracteres não numéricos
  const cleanCEP = cep.replace(/[^\d]/g, '')

  // Verifica se tem 8 dígitos
  return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP)
}

// Função para detectar tentativas de injeção
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

// Função para validar origem da requisição
export function validateOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false
  return allowedOrigins.includes(origin)
}

// Função para gerar hash seguro
export async function generateSecureHash(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

