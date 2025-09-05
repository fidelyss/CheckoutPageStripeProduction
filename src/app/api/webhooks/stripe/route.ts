import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { securityLogger, getClientIP } from '@/lib/security-logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      securityLogger.logInvalidRequest(
        ip,
        '/api/webhooks/stripe',
        'Assinatura do webhook não encontrada'
      )
      console.error('Webhook: Assinatura não encontrada')
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      securityLogger.logSuspiciousActivity(
        ip,
        '/api/webhooks/stripe',
        'Assinatura de webhook inválida',
        undefined,
        { error: err instanceof Error ? err.message : 'Unknown error' }
      )
      console.error('Webhook: Erro na verificação da assinatura:', err)
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 400 }
      )
    }

    // Log do evento recebido
    securityLogger.logWebhookReceived(ip, event.type, event.id)
    console.log('Webhook recebido:', event.type, event.id)

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent
        console.log('Pagamento bem-sucedido:', paymentIntentSucceeded.id)
        
        await handlePaymentSuccess(paymentIntentSucceeded)
        break

      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object as Stripe.PaymentIntent
        console.log('Pagamento falhou:', paymentIntentFailed.id)
        
        await handlePaymentFailure(paymentIntentFailed)
        break

      case 'payment_method.attached':
        const paymentMethod = event.data.object as Stripe.PaymentMethod
        console.log('Método de pagamento anexado:', paymentMethod.id)
        break

      default:
        console.log('Evento não tratado:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    securityLogger.logSuspiciousActivity(
      ip,
      '/api/webhooks/stripe',
      'Erro no processamento do webhook',
      undefined,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
    console.error('Erro no webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Implementar lógica de sucesso do pagamento
    console.log('Processando pagamento bem-sucedido:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer: paymentIntent.customer,
      metadata: paymentIntent.metadata,
    })

    // Exemplo de ações que podem ser realizadas:
    // 1. Salvar no banco de dados
    // 2. Enviar e-mail de confirmação
    // 3. Liberar acesso ao produto
    // 4. Atualizar status do pedido
    // 5. Registrar métricas

    // Simular salvamento no banco de dados
    const orderData = {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'completed',
      createdAt: new Date(),
      metadata: paymentIntent.metadata,
      clientIP: paymentIntent.metadata?.client_ip,
    }

    console.log('Pedido salvo:', orderData)

    // Em produção, você implementaria:
    // await saveOrderToDatabase(orderData)
    // await sendConfirmationEmail(paymentIntent)
    // await grantProductAccess(paymentIntent)

  } catch (error) {
    console.error('Erro ao processar pagamento bem-sucedido:', error)
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Implementar lógica de falha do pagamento
    console.log('Processando falha do pagamento:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      last_payment_error: paymentIntent.last_payment_error,
      metadata: paymentIntent.metadata,
    })

    // Exemplo de ações que podem ser realizadas:
    // 1. Registrar tentativa de pagamento falhada
    // 2. Enviar e-mail de notificação
    // 3. Atualizar status do pedido
    // 4. Registrar métricas de falha
    // 5. Alertar equipe de suporte se necessário

    // Log de segurança para tentativas de pagamento falhadas
    if (paymentIntent.metadata?.client_ip) {
      securityLogger.logPaymentAttempt(
        paymentIntent.metadata.client_ip,
        paymentIntent.amount,
        paymentIntent.currency,
        false
      )
    }

  } catch (error) {
    console.error('Erro ao processar falha do pagamento:', error)
  }
}

