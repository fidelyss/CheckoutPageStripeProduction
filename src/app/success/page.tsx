'use client';
export const dynamic = "force-dynamic"

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Download, Mail, Home } from 'lucide-react'

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [paymentIntent, setPaymentIntent] = useState<any>(null)

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret')

    if (clientSecret) {
      // Verificar status do pagamento
      fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ client_secret: clientSecret }),
      })
        .then((res) => res.json())
        .then((data) => {
          setPaymentStatus(data.status)
          setPaymentIntent(data.payment_intent)
        })
        .catch(() => {
          setPaymentStatus('failed')
        })
    } else {
      setPaymentStatus('failed')
    }
  }, [searchParams])

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando pagamento...</p>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pagamento não foi concluído
          </h1>
          <p className="text-gray-600 mb-8">
            Houve um problema com seu pagamento. Tente novamente.
          </p>
          <div className="space-y-4">
            <Link
              href="/checkout"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Tentar Novamente
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Ícone de Sucesso */}
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Título */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pagamento Realizado com Sucesso!
          </h1>

          {/* Descrição */}
          <p className="text-xl text-gray-600 mb-8">
            Obrigado pela sua compra. Seu pedido foi processado e você receberá um e-mail de confirmação em breve.
          </p>

          {/* Detalhes do Pagamento */}
          {paymentIntent && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Detalhes do Pagamento
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID da Transação:</span>
                  <span className="font-mono text-sm">{paymentIntent.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(paymentIntent.amount / 100)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Pago
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span>{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Próximos Passos */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Próximos Passos
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">E-mail de Confirmação</p>
                  <p className="text-blue-700 text-sm">
                    Você receberá um e-mail com os detalhes da compra e instruções de acesso.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Download className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Download do Produto</p>
                  <p className="text-blue-700 text-sm">
                    O link para download estará disponível no e-mail de confirmação.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-4">
            <button className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center">
              <Download className="mr-2 h-5 w-5" />
              Baixar Produto
            </button>

            <Link
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Link>
          </div>

          {/* Suporte */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Precisa de ajuda? Entre em contato conosco em{' '}
              <a href="mailto:suporte@exemplo.com" className="text-blue-600 hover:underline">
                suporte@exemplo.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPageCon() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SuccessPageContent />
    </Suspense>
  )
}