'use client'

import { useState } from 'react'
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js'
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setMessage('')

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    })

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'Erro no pagamento')
      } else {
        setMessage('Ocorreu um erro inesperado.')
      }
    } else {
      setIsSuccess(true)
      setMessage('Pagamento processado com sucesso!')
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações de Cobrança */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Endereço de Cobrança
        </h3>
        <AddressElement 
          options={{
            mode: 'billing',
            allowedCountries: ['BR'],
            fields: {
              phone: 'always',
            },
            validation: {
              phone: {
                required: 'always',
              },
            },
          }}
        />
      </div>

      {/* Métodos de Pagamento */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Método de Pagamento
        </h3>
        <PaymentElement 
          options={{
            layout: 'accordion',
            paymentMethodOrder: ['pix', 'card'],
          }}
        />
      </div>

      {/* Mensagem de Status */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          isSuccess 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {isSuccess ? (
            <CheckCircle className="mr-2 h-5 w-5" />
          ) : (
            <AlertCircle className="mr-2 h-5 w-5" />
          )}
          {message}
        </div>
      )}

      {/* Botão de Pagamento */}
      <button
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
            Processando...
          </>
        ) : (
          'Finalizar Pagamento'
        )}
      </button>

      {/* Informações de Segurança */}
      <div className="text-sm text-gray-600 text-center space-y-2">
        <p className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Pagamento seguro com criptografia SSL
        </p>
        <p>Seus dados estão protegidos pela Stripe</p>
      </div>
    </form>
  )
}

