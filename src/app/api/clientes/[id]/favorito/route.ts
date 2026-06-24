// src/app/api/clientes/[id]/favorito/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiError } from '@/lib/permisos'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    const existe = await prisma.favoritoCliente.findUnique({
      where: { usuarioId_clienteId: { usuarioId: session.user.id, clienteId: params.id } },
    })

    if (existe) {
      await prisma.favoritoCliente.delete({
        where: { usuarioId_clienteId: { usuarioId: session.user.id, clienteId: params.id } },
      })
      return NextResponse.json({ ok: true, esFavorito: false })
    } else {
      await prisma.favoritoCliente.create({
        data: { usuarioId: session.user.id, clienteId: params.id },
      })
      return NextResponse.json({ ok: true, esFavorito: true })
    }
  } catch (error) {
    return apiError(error)
  }
}
