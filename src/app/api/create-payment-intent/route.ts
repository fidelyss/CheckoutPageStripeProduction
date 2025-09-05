import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createPaymentIntentSchema, detectInjection } from '@/lib/validation'
import { securityLogger, getClientIP } from '@/lib/security-logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || undefined

  try {
    const body = await request.json()
    console.log('BODY RECEIVED:', body)

    // 🔒 Validação contra injeção
    const bodyString = JSON.stringify(body)
    if (detectInjection(bodyString)) {
      securityLogger.logSuspiciousActivity(
        ip,
        '/api/create-payment-intent',
        'Tentativa de injeção detectada',
        userAgent,
        { body }
      )
      return NextResponse.json(
        { error: 'Dados inválidos detectados' },
        { status: 400 }
      )
    }

    // ✅ Validação com Zod
    const validationResult = createPaymentIntentSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('VALIDATION ERRORS:', validationResult.error.issues)

      securityLogger.logInvalidRequest(
        ip,
        '/api/create-payment-intent',
        'Dados de entrada inválidos',
        userAgent
      )
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { amount, currency, metadata } = validationResult.data
    const finalAmount = Math.round(amount)

    if (finalAmount <= 0) {
      return NextResponse.json(
        { error: 'O valor deve ser maior que 0' },
        { status: 400 }
      )
    }

    // ✅ Criar PaymentIntent com método cartão
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: currency.toLowerCase(),
      payment_method_types: ['card'], // <- força uso exclusivo de cartão
      metadata: {
        integration_check: 'accept_a_payment',
        created_at: new Date().toISOString(),
        client_ip: ip,
        ...metadata,
      },
    })

    // 🛡️ Log da tentativa de pagamento
    securityLogger.logPaymentAttempt(ip, finalAmount, currency, true, userAgent)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Erro ao criar PaymentIntent:', error)

    // 🛡️ Log da tentativa de pagamento falhada
    securityLogger.logPaymentAttempt(ip, 0, 'unknown', false, userAgent)

    if (error && typeof error === 'object' && 'message' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}