// src/app/api/ai/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const MODEL = 'claude-sonnet-4-6'

const RequestSchema = z.object({
  clienteId: z.string().optional(),
  funcion: z.enum(['mensaje', 'temperatura', 'proxima_accion', 'resumen', 'objecion', 'chat']),
  canal: z.enum(['whatsapp', 'correo']).optional().default('whatsapp'),
  mensaje: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    await requireAuth('ver_cliente')
    const body = await request.json()
    const { clienteId, funcion, canal, mensaje } = RequestSchema.parse(body)

    if (funcion === 'chat') {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        return NextResponse.json({
          ok: true,
          sinLlave: true,
          resultado: `Para respuestas personalizadas, configura tu ANTHROPIC_API_KEY.\n\nPreguntaste: "${mensaje}"\n\nTip: Las objeciones de precio se vencen mostrando ROI y garantÃ­a.`,
        })
      }
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 600,
          system: 'Eres el asistente de ventas de Techos y Cubiertas, empresa de arcotechos y estructuras metÃ¡licas en Ecatepec. Das consejos concretos y breves. Responde en espaÃ±ol, mÃ¡x 3 pÃ¡rrafos.',
          messages: [{ role: 'user', content: mensaje || 'Â¿CÃ³mo puedo vender mÃ¡s?' }],
        }),
      })
      const data = await res.json()
      return NextResponse.json({ ok: true, resultado: data.content?.[0]?.text || 'No pude generar respuesta.' })
    }

    if (!clienteId) {
      return NextResponse.json({ ok: false, mensaje: 'clienteId requerido' }, { status: 400 })
    }

    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, eliminadoEn: null },
      select: {
        id: true,
        nombre: true,
        etapa: true,
        temperatura: true,
        objecionPrincipal: true,
        valorEstimado: true,
        ultimoContacto: true,
        proximaAccionFecha: true,
        notas: true,
        vendedorId: true,
      },
    })

    if (!cliente) {
      return NextResponse.json({ ok: false, mensaje: 'Cliente no encontrado' }, { status: 404 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY

    const clienteNormalizado = {
      nombre: cliente.nombre,
      etapa: cliente.etapa as string | null,
      temperatura: cliente.temperatura as string,
      objecionPrincipal: cliente.objecionPrincipal,
      valorEstimado: cliente.valorEstimado,
      ultimoContacto: cliente.ultimoContacto,
      proximaAccionFecha: cliente.proximaAccionFecha,
      notas: cliente.notas,
    }

    if (!apiKey) {
      return NextResponse.json({
        ok: true,
        resultado: `Asistente IA no disponible. Configura ANTHROPIC_API_KEY para activarlo.\n\nCliente: ${cliente.nombre}\nEtapa: ${cliente.etapa ?? 'No definida'}\nTemperatura: ${cliente.temperatura}`,
        fuenteIA: false,
      })
    }

    const contexto = `Cliente: ${cliente.nombre}\nEtapa: ${cliente.etapa ?? 'No definida'}\nTemperatura: ${cliente.temperatura}\nObjeciÃ³n: ${cliente.objecionPrincipal ?? 'Ninguna'}\nValor estimado: ${cliente.valorEstimado ? '$' + cliente.valorEstimado.toLocaleString('es-MX') : 'No definido'}`

    const prompts: Record<string, string> = {
      mensaje: `Redacta un mensaje de ${canal === 'whatsapp' ? 'WhatsApp' : 'correo'} para este cliente. MÃ¡x 150 palabras.\n\n${contexto}`,
      temperatura: `Analiza y responde SOLO en JSON: {"temperatura":"CALIENTE|TIBIO|FRIO","razon":"frase corta"}\n\n${contexto}`,
      proxima_accion: `Sugiere la prÃ³xima acciÃ³n. Responde SOLO en JSON: {"accion":"acciÃ³n concreta","diasSugeridos":nÃºmero}\n\n${contexto}`,
      resumen: `Resume en 3-5 lÃ­neas el estado de este cliente y quÃ© hacer para cerrar.\n\n${contexto}`,
      objecion: `Sugiere cÃ³mo vencer la objeciÃ³n "${cliente.objecionPrincipal}" de este cliente.\n\n${contexto}`,
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompts[funcion] || prompts.resumen }],
      }),
    })

    const data = await response.json()
    const texto = data.content?.[0]?.text ?? ''

    return NextResponse.json({ ok: true, resultado: texto, fuenteIA: true })
  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json({ ok: false, mensaje: 'Error interno' }, { status: 500 })
  }
}
