'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

/* ------------------------------------------------------------------
 * CONFIGURAÇÃO DO PRODUTO (VISUAL)
 * ------------------------------------------------------------------ */

const BASE_PRICE_USD = 8

const EXCHANGE_RATES = {
  usd: 1,
  brl: 5.57,
  eur: 0.92,
  gbp: 0.79,
}

const CURRENCY_LABELS = {
  usd: 'USD ($)',
  brl: 'BRL (R$)',
  eur: 'EUR (€)',
  gbp: 'GBP (£)',
} as const

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(value)
}

/* ------------------------------------------------------------------
 * FORMULÁRIO DE PAGAMENTO
 * ------------------------------------------------------------------ */

function CardForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setMessage('')

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    })

    if (error) {
      setMessage(error.message || 'Erro ao processar pagamento')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {message && <div className="text-red-600 text-sm">{message}</div>}
      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Processando...' : 'Finalizar Pagamento'}
      </button>
    </form>
  )
}

/* ------------------------------------------------------------------
 * CHECKOUT
 * ------------------------------------------------------------------ */

export default function CheckoutPage() {
  const [currency, setCurrency] = useState<'usd' | 'brl' | 'eur' | 'gbp'>('usd')
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const convertedPrice = BASE_PRICE_USD * EXCHANGE_RATES[currency]

  useEffect(() => {
    setLoading(true)
    setError('')
    setClientSecret('')

    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError('Erro ao iniciar pagamento')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Erro ao conectar com o servidor')
        setLoading(false)
      })
  }, [currency])

  // ✅ OPTIONS NO LUGAR CORRETO + as const
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center px-4">
      <div className="max-w-xl w-full bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Finalizar Compra
        </h1>

        {/* MOEDA */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Moeda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="w-full border rounded-lg px-3 py-2"
          >
            {Object.keys(CURRENCY_LABELS).map((cur) => (
              <option key={cur} value={cur}>
                {CURRENCY_LABELS[cur as keyof typeof CURRENCY_LABELS]}
              </option>
            ))}
          </select>
        </div>

        {/* PREÇO */}
        <div className="mb-6 text-center">
          <p className="text-gray-500 text-sm">Preço do produto</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatPrice(convertedPrice, currency)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Valor base: USD {BASE_PRICE_USD}
          </p>
        </div>

        {/* PAGAMENTO */}
        {loading && <p className="text-center">Carregando checkout...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}

        {clientSecret && (
          <Elements stripe={stripePromise} options={options}>
            <CardForm />
          </Elements>
        )}
      </div>
    </div>
  )
}
