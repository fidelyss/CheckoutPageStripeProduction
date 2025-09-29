import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { client_secret } = await request.json()

    if (!client_secret) {
      return NextResponse.json(
        { error: 'Client secret é obrigatório' },
        { status: 400 }
      )
    }

    // Extrair o PaymentIntent ID do client secret
    const paymentIntentId = client_secret.split('_secret_')[0]

    // Buscar o PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Retornar status e dados do pagamento
    return NextResponse.json({
      status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed',
      payment_intent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: paymentIntent.created,
        payment_method: paymentIntent.payment_method,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
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

