import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `Eres un asistente de IA integrado en JM Consulting, un sistema de gestión para consultoría de restaurantes. 
          
Tu rol es ayudar a los usuarios con:
- Preguntas sobre el sistema y sus módulos (Dashboard, Consulting, Forecast, P&L, Cashflow, Comparativos, Configuración)
- Análisis de datos de restaurantes
- Consultas sobre ventas, costos, y métricas
- Explicaciones sobre cómo usar las diferentes funcionalidades
- Respuestas generales sobre gestión de restaurantes

Sé amable, profesional y conciso en tus respuestas. Responde siempre en español.`
        },
        ...messages
      ],
      stream: false,
      thinking: { type: 'disabled' }
    })

    const messageContent = completion.choices?.[0]?.message?.content

    if (!messageContent) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: messageContent,
      success: true 
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
