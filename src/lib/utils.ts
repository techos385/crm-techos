// src/lib/utils.ts
// Utilidades compartidas en todo el CRM

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── Combinar clases de Tailwind ───
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Formatear fechas en español humano ───
export function formatearFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return 'Sin fecha'
  
  const f = typeof fecha === 'string' ? parseISO(fecha) : fecha
  
  if (isToday(f)) {
    return `Hoy ${format(f, 'h:mm a', { locale: es })}`
  }
  if (isYesterday(f)) {
    return `Ayer ${format(f, 'h:mm a', { locale: es })}`
  }
  
  const ahora = new Date()
  const diffDias = Math.floor((ahora.getTime() - f.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDias < 7) {
    return formatDistanceToNow(f, { addSuffix: true, locale: es })
  }
  
  return format(f, "d 'de' MMM 'de' yyyy", { locale: es })
}

export function formatearFechaCorta(fecha: Date | string | null | undefined): string {
  if (!fecha) return '—'
  const f = typeof fecha === 'string' ? parseISO(fecha) : fecha
  return format(f, "d MMM yyyy", { locale: es })
}

export function formatearFechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return '—'
  const f = typeof fecha === 'string' ? parseISO(fecha) : fecha
  return format(f, "d MMM yyyy, h:mm a", { locale: es })
}

// ─── Días desde última acción ───
export function diasSinContacto(ultimoContacto: Date | null | undefined): number {
  if (!ultimoContacto) return 999
  const ahora = new Date()
  return Math.floor((ahora.getTime() - new Date(ultimoContacto).getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Formatear dinero ───
export function formatearMonto(
  monto: number | null | undefined,
  moneda: string = 'MXN'
): string {
  if (monto == null) return '$0'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto)
}

// ─── Temperatura ───
export const TEMPERATURA_CONFIG = {
  CALIENTE: { emoji: '🔥', label: 'Caliente', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
  TIBIO:    { emoji: '🟡', label: 'Tibio',    color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
  FRIO:     { emoji: '🔵', label: 'Frío',     color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
}

// ─── Etapas del embudo ───
export const ETAPAS_EMBUDO: Record<string, { label: string; orden: number; esActiva: boolean }> = {
  NUEVO_PROSPECTO:     { label: 'Nuevo Prospecto',      orden: 1,  esActiva: true },
  CONTACTADO:          { label: 'Contactado',            orden: 2,  esActiva: true },
  INFORMACION_RECIBIDA:{ label: 'Información Recibida',  orden: 3,  esActiva: true },
  COTIZACION_ENVIADA:  { label: 'Cotización Enviada',    orden: 4,  esActiva: true },
  CITA_AGENDADA:       { label: 'Cita Agendada',         orden: 5,  esActiva: true },
  VISITA_PROGRAMADA:   { label: 'Visita Programada',     orden: 6,  esActiva: true },
  VISITA_REALIZADA:    { label: 'Visita Realizada',      orden: 7,  esActiva: true },
  RECOTIZACION_ENVIADA:{ label: 'Recotización Enviada',  orden: 8,  esActiva: true },
  PROPUESTA_ENVIADA:   { label: 'Propuesta Enviada',     orden: 9,  esActiva: true },
  SEGUIMIENTO:         { label: 'Seguimiento',           orden: 10, esActiva: true },
  NEGOCIACION:         { label: 'Negociación',           orden: 11, esActiva: true },
  PROYECTO_GANADO:     { label: 'Proyecto Ganado',       orden: 12, esActiva: true },
  ANTICIPO_RECIBIDO:   { label: 'Anticipo Recibido',     orden: 13, esActiva: true },
  PROYECTO_EN_EJECUCION:{ label: 'Proyecto en Ejecución', orden: 14, esActiva: true },
  PROYECTO_ENTREGADO:  { label: 'Proyecto Entregado',    orden: 15, esActiva: true },
  CLIENTE_RECURRENTE:  { label: 'Cliente Recurrente',    orden: 16, esActiva: true },
  PERDIDO:             { label: 'Perdido',               orden: 17, esActiva: false },
  PRECIO_ALTO:         { label: 'Precio Alto',           orden: 18, esActiva: false },
  CANCELO_PROYECTO:    { label: 'Canceló Proyecto',      orden: 19, esActiva: false },
  ELIGIO_COMPETENCIA:  { label: 'Eligió Competencia',    orden: 20, esActiva: false },
  SIN_PRESUPUESTO:     { label: 'Sin Presupuesto',       orden: 21, esActiva: false },
  NO_RESPONDIO:        { label: 'No Respondió',          orden: 22, esActiva: false },
}

export const ETAPAS_ACTIVAS = Object.entries(ETAPAS_EMBUDO)
  .filter(([, v]) => v.esActiva)
  .sort((a, b) => a[1].orden - b[1].orden)
  .map(([k, v]) => ({ key: k, ...v }))

// ─── Estado de cartera badges ───
export const ESTADO_CARTERA_CONFIG = {
  ACTIVO:    { label: 'Activo',    color: 'bg-marca-300/20 text-marca-600 dark:text-marca-300', icon: 'Activity' },
  GANADO:    { label: 'Ganado',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: 'Trophy' },
  PERDIDO:   { label: 'Perdido',   color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: 'XCircle' },
  ARCHIVADO: { label: 'Archivado', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: 'Archive' },
}

// ─── Origenes / canales ───
export const ORIGENES = [
  { value: 'landing', label: 'Landing web', utm: 'landing' },
  { value: 'instagram', label: 'Instagram', utm: 'instagram' },
  { value: 'facebook', label: 'Facebook', utm: 'facebook' },
  { value: 'whatsapp', label: 'WhatsApp', utm: 'whatsapp' },
  { value: 'referido', label: 'Recomendación / Referido', utm: 'referido' },
  { value: 'visita', label: 'Visita directa', utm: 'visita' },
  { value: 'telefono', label: 'Llamada directa', utm: 'telefono' },
  { value: 'otro', label: 'Otro', utm: 'otro' },
]

// ─── Métodos de pago ───
export const METODOS_PAGO = [
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'DEPOSITO_ANTICIPO', label: 'Depósito / Anticipo' },
]

// ─── Generar URL de WhatsApp ───
export function generarUrlWhatsApp(
  telefono: string,
  mensaje: string
): string {
  // Limpiar teléfono: quitar todo lo que no sea número
  const telLimpio = telefono.replace(/\D/g, '')
  // Asegurar código de país México si no tiene
  const telIntl = telLimpio.startsWith('52') ? telLimpio : `52${telLimpio}`
  const mensajeCodificado = encodeURIComponent(mensaje)
  return `https://wa.me/${telIntl}?text=${mensajeCodificado}`
}

// ─── Sustituir variables en plantillas ───
export function sustituirVariables(
  plantilla: string,
  datos: {
    nombre?: string
    empresa?: string
    etapa?: string
    valor?: string | number
    vendedor?: string
    objecion?: string
    tipoObra?: string
    [key: string]: string | number | undefined
  }
): string {
  let resultado = plantilla
  for (const [key, value] of Object.entries(datos)) {
    if (value !== undefined) {
      resultado = resultado.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
    }
  }
  return resultado
}

// ─── Iniciales del avatar ───
export function obtenerIniciales(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

// ─── Número de teléfono bonito ───
export function formatearTelefono(tel: string | null | undefined): string {
  if (!tel) return ''
  const limpio = tel.replace(/\D/g, '')
  if (limpio.length === 10) {
    return `${limpio.slice(0, 2)} ${limpio.slice(2, 6)} ${limpio.slice(6)}`
  }
  if (limpio.length === 12 && limpio.startsWith('52')) {
    return `+52 ${limpio.slice(2, 4)} ${limpio.slice(4, 8)} ${limpio.slice(8)}`
  }
  return tel
}

// ─── Debounce ───
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// ─── Respuesta API estándar ───
export function apiOk<T>(data: T, status: number = 200) {
  return Response.json({ ok: true, data }, { status })
}

export function apiError(mensaje: string, status: number = 400) {
  return Response.json({ ok: false, error: mensaje }, { status })
}

// ─── Normalizar texto para búsqueda (sin acentos) ───
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
