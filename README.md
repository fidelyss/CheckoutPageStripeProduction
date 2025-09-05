# Sistema de Pagamentos Seguros com Stripe

Um sistema completo de pagamentos desenvolvido com Next.js, TypeScript e Stripe, oferecendo suporte a PIX, cartões de crédito e débito, com foco total em segurança e experiência do usuário.

## 🚀 Características Principais

### 💳 Métodos de Pagamento
- **PIX Instantâneo**: Pagamentos em tempo real via PIX
- **Cartões de Crédito**: Visa, Mastercard, American Express
- **Cartões de Débito**: Processamento seguro de débito
- **Múltiplas Moedas**: Suporte a BRL e outras moedas

### 🔒 Segurança Avançada
- **Rate Limiting**: Proteção contra ataques de força bruta
- **Validação de Dados**: Sanitização e validação rigorosa de inputs
- **Headers de Segurança**: CSP, XSS Protection, CSRF Protection
- **Logging de Segurança**: Monitoramento de atividades suspeitas
- **Webhook Verification**: Verificação de assinatura dos webhooks do Stripe

### 🎨 Interface Moderna
- **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- **UI/UX Otimizada**: Interface intuitiva e acessível
- **Feedback Visual**: Estados de loading, sucesso e erro
- **Temas Personalizáveis**: Fácil customização visual

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Stripe (para chaves de API)

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd payment-page
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas chaves do Stripe:
```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_nextauth_secret_aqui
```

### 4. Execute o projeto
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 🏗️ Estrutura do Projeto

```
payment-page/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── create-payment-intent/    # API para criar PaymentIntent
│   │   │   ├── verify-payment/           # API para verificar pagamentos
│   │   │   ├── webhooks/stripe/          # Webhook do Stripe
│   │   │   └── placeholder/              # API para imagens placeholder
│   │   ├── checkout/                     # Página de checkout
│   │   ├── success/                      # Página de sucesso
│   │   ├── globals.css                   # Estilos globais
│   │   ├── layout.tsx                    # Layout principal
│   │   └── page.tsx                      # Página inicial
│   ├── components/
│   │   ├── CheckoutForm.tsx              # Formulário de checkout
│   │   └── ProductSummary.tsx            # Resumo do produto
│   ├── lib/
│   │   ├── validation.ts                 # Utilitários de validação
│   │   └── security-logger.ts            # Logger de segurança
│   └── middleware.ts                     # Middleware de segurança
├── .env.local                            # Variáveis de ambiente
├── .env.example                          # Exemplo de variáveis
└── README.md                             # Esta documentação
```

## 🔧 Configuração do Stripe

### 1. Obtenha suas chaves de API
1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá para "Developers" > "API keys"
3. Copie sua chave pública e secreta (use as de teste para desenvolvimento)

### 2. Configure o Webhook
1. No Dashboard do Stripe, vá para "Developers" > "Webhooks"
2. Clique em "Add endpoint"
3. URL do endpoint: `https://seu-dominio.com/api/webhooks/stripe`
4. Selecione os eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_method.attached`
5. Copie o "Signing secret" para a variável `STRIPE_WEBHOOK_SECRET`

### 3. Ative o PIX (para contas brasileiras)
1. No Dashboard do Stripe, vá para "Settings" > "Payment methods"
2. Ative o PIX para sua conta
3. Configure as informações bancárias necessárias

## 💻 Uso da API

### Criar PaymentIntent
```javascript
POST /api/create-payment-intent
Content-Type: application/json

{
  "amount": 5000,        // Valor em centavos (R$ 50,00)
  "currency": "BRL",     // Moeda
  "metadata": {          // Dados opcionais
    "order_id": "12345"
  }
}
```

### Verificar Pagamento
```javascript
POST /api/verify-payment
Content-Type: application/json

{
  "client_secret": "pi_xxx_secret_xxx"
}
```

## 🔒 Recursos de Segurança

### Rate Limiting
- **APIs Gerais**: 100 requests por 15 minutos por IP
- **APIs de Pagamento**: 10 requests por 15 minutos por IP
- **Headers de Rate Limit**: Incluídos nas respostas

### Validação de Dados
- **Sanitização**: Remoção de caracteres perigosos
- **Validação de Schema**: Usando Zod para validação rigorosa
- **Detecção de Injeção**: Proteção contra XSS e injection attacks

### Logging de Segurança
- **Eventos Monitorados**: Rate limit, requests inválidos, tentativas de pagamento
- **Detecção de Padrões**: Identificação automática de atividades suspeitas
- **Relatórios**: Geração de relatórios de segurança

### Headers de Segurança
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [política restritiva]
```

## 🎨 Customização

### Cores e Temas
Edite o arquivo `src/app/globals.css` para personalizar:
```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #1e40af;
  --success-color: #10b981;
  --error-color: #ef4444;
}
```

### Componentes
Os componentes estão em `src/components/` e podem ser facilmente customizados:
- `CheckoutForm.tsx`: Formulário principal de pagamento
- `ProductSummary.tsx`: Resumo do produto/pedido

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente no dashboard
3. Deploy automático a cada push

### Outros Provedores
O projeto é compatível com qualquer provedor que suporte Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

### Configurações de Produção
1. Use chaves de produção do Stripe
2. Configure domínio personalizado
3. Ative HTTPS (obrigatório para pagamentos)
4. Configure monitoramento e logs

## 📊 Monitoramento

### Métricas Importantes
- Taxa de conversão de pagamentos
- Tempo de resposta das APIs
- Eventos de segurança
- Erros de pagamento

### Logs de Segurança
```javascript
// Exemplo de evento de segurança
{
  "type": "payment_attempt",
  "ip": "192.168.1.1",
  "amount": 5000,
  "currency": "BRL",
  "success": true,
  "timestamp": "2025-01-01T12:00:00Z"
}
```

## 🐛 Troubleshooting

### Problemas Comuns

#### Erro: "Stripe key not found"
- Verifique se as variáveis de ambiente estão configuradas
- Reinicie o servidor após alterar `.env.local`

#### Erro: "Webhook signature verification failed"
- Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
- Confirme se a URL do webhook está correta no Stripe

#### PIX não aparece como opção
- Verifique se sua conta Stripe suporta PIX
- Confirme se o PIX está ativado no Dashboard

### Debug
Para ativar logs detalhados:
```bash
DEBUG=stripe:* npm run dev
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

- **Documentação do Stripe**: https://stripe.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Issues**: Abra uma issue neste repositório

## 🔄 Changelog

### v1.0.0 (2025-01-01)
- ✅ Sistema completo de pagamentos
- ✅ Suporte a PIX e cartões
- ✅ Medidas de segurança avançadas
- ✅ Interface responsiva
- ✅ Documentação completa

---

**Desenvolvido com ❤️ usando Next.js, TypeScript e Stripe**
