'use client'

import Image from 'next/image'
import { Package, Shield, Truck } from 'lucide-react'

interface Product {
  id: number
  name: string
  description: string
  price: number
  image: string
}

interface ProductSummaryProps {
  product: Product
}

export default function ProductSummary({ product }: ProductSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price / 100)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Resumo do Pedido
      </h2>

      {/* Produto */}
      <div className="border rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
            <div className="mt-2">
              <span className="text-lg font-bold text-blue-600">
                {formatPrice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* product.price coloque no formatPrice*/}
      {/* Resumo de Preços */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(1)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Frete</span>
          <span className="text-green-600">Grátis</span>
        </div>
        <div className="border-t pt-3">
          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatPrice(1)}</span>
          </div>
        </div>
      </div>

      {/* Benefícios */}
      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <Shield className="h-4 w-4 mr-2 text-green-600" />
          <span>Compra 100% segura</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Truck className="h-4 w-4 mr-2 text-blue-600" />
          <span>Entrega rápida e gratuita</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="h-4 w-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Garantia de 30 dias</span>
        </div>
      </div>

      {/* Métodos de Pagamento Aceitos */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Métodos de Pagamento Aceitos
        </h4>
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 px-3 py-1 rounded-full text-xs font-medium text-green-800">
            PIX
          </div>
          <div className="bg-blue-100 px-3 py-1 rounded-full text-xs font-medium text-blue-800">
            Cartão de Crédito
          </div>
          <div className="bg-purple-100 px-3 py-1 rounded-full text-xs font-medium text-purple-800">
            Cartão de Débito
          </div>
        </div>
      </div>
    </div>
  )
}

