import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { dimensions: string[] } }
) {
  try {
    const [width = '300', height = '200'] = params.dimensions

    const widthNum = parseInt(width, 10) || 300
    const heightNum = parseInt(height, 10) || 200

    // Limitar dimensões para evitar abuso
    const maxWidth = Math.min(widthNum, 1200)
    const maxHeight = Math.min(heightNum, 800)

    const svg = `
      <svg width="${maxWidth}" height="${maxHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="20" y="20" width="${maxWidth - 40}" height="${maxHeight - 40}" fill="#e5e7eb" rx="8"/>
        <circle cx="${maxWidth / 2}" cy="${maxHeight / 2 - 20}" r="30" fill="#9ca3af"/>
        <rect x="${maxWidth / 2 - 40}" y="${maxHeight / 2 + 20}" width="80" height="8" fill="#9ca3af" rx="4"/>
        <rect x="${maxWidth / 2 - 30}" y="${maxHeight / 2 + 35}" width="60" height="6" fill="#d1d5db" rx="3"/>
        <text x="${maxWidth / 2}" y="${maxHeight - 15}" text-anchor="middle" fill="#6b7280" font-family="system-ui, sans-serif" font-size="12">
          ${maxWidth} × ${maxHeight}
        </text>
      </svg>
    `

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar placeholder:', error)
    
    return NextResponse.json(
      { error: 'Erro ao gerar imagem' },
      { status: 500 }
    )
  }
}

