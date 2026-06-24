'use client'

// src/components/dashboard/DashboardContenido.tsx
// Tablero del mes: metas, crecimiento, métricas clave

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  Target, TrendingUp, TrendingDown, Users, CalendarDays,
  Wallet, Trophy, AlertCircle, Clock, Star, Info
} from 'lucide-react'
import { formatearMonto, formatearFechaCorta } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DashboardData {
  mes: {
    nuevosProspectos: number
    citasAgendadas: number
    propuestasEnviadas: number
    clientesGanados: number
    ingresosCobrados: number
    pagosPendientes: number
    pagosVencidos: number
    tasaCierre: number
    valorEmbudo: number
  }
  meta: {
    tipo: string
    valor: number
    actual: number
    porcentaje: number
  }
  crecimiento: Array<{
    mes: string
    ingresos: number
    ganados: number
  }>
  origenes: Array<{
    origen: string
    leads: number
    ingresos: number
    cambio?: number
  }>
  perdidas: Array<{
    motivo: string
    cantidad: number
  }>
  vendedores: Array<{
    nombre: string
    cierres: number
    ingresos: number
    metaPorcentaje: number
    clientesEnRiesgo: number
    comisionGanada?: number
  }>
  pronostico: {
    esperado: number
    semaforo: 'verde' | 'amarillo' | 'rojo'
    frase: string
  }
  comparaciones: {
    nuevosVsAnterior: number
    citasVsAnterior: number
    ingresosVsAnterior: number
  }
  tiempoPromedioRespuesta: number  // horas
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

function Flecha({ porcentaje }: { porcentaje: number }) {
  const sube = porcentaje >= 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-sm font-semibold', sube ? 'text-green-500' : 'text-red-500')}>
      {sube ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {sube ? '+' : ''}{porcentaje.toFixed(0)}%
    </span>
  )
}

function MetricaCard({
  titulo, valor, subtitulo, icono: Icon, acento, comparacion, formato = 'numero'
}: {
  titulo: string
  valor: number
  subtitulo?: string
  icono: React.ElementType
  acento: string
  comparacion?: number
  formato?: 'numero' | 'dinero' | 'porcentaje'
}) {
  const valorFormateado = formato === 'dinero'
    ? formatearMonto(valor)
    : formato === 'porcentaje'
    ? `${valor.toFixed(1)}%`
    : valor.toString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{titulo}</p>
        <div className={cn('p-2 rounded-xl', acento + '/10')}>
          <Icon className={cn('w-4 h-4', acento)} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
        {valorFormateado}
      </p>
      {subtitulo && (
        <p className="text-xs text-slate-400 mt-1">{subtitulo}</p>
      )}
      {comparacion !== undefined && (
        <div className="mt-2">
          <Flecha porcentaje={comparacion} />
          <span className="text-xs text-slate-400 ml-1">vs. mes anterior</span>
        </div>
      )}
    </motion.div>
  )
}

function BarraMeta({ actual, meta, tipo }: { actual: number; meta: number; tipo: string }) {
  const pct = Math.min((actual / meta) * 100, 100)
  const semaforo = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {tipo === 'cierres' ? actual : formatearMonto(actual)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            de {tipo === 'cierres' ? meta + ' cierres' : formatearMonto(meta)} meta del mes
          </p>
        </div>
        <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{pct.toFixed(0)}%</p>
      </div>
      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', semaforo)}
        />
      </div>
    </div>
  )
}

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export function DashboardContenido() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        const resp = await fetch('/api/dashboard')
        if (!resp.ok) throw new Error()
        const json = await resp.json()
        setData(json.data)
      } catch {
        setError(true)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  if (error) {
    return (
      <div className="empty-state">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">No se pudo cargar el tablero</p>
        <p className="text-sm text-slate-400 mt-1">Revisa tu conexión e intenta recargar la página.</p>
        <button onClick={() => window.location.reload()} className="btn-secundario mt-4">Recargar</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="seccion-header">
        <div>
          <h1 className="seccion-titulo flex items-center gap-2">
            <span className="text-marca-300">📊</span> Tablero
          </h1>
          <p className="seccion-subtitulo">¿Vas a cerrar el mes?</p>
        </div>
      </div>

      {/* Bento grid: Meta del mes */}
      {cargando ? (
        <Skeleton className="h-40 w-full" />
      ) : data && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-marca-300" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Meta del mes</h2>
          </div>

          <BarraMeta
            actual={data.meta.actual}
            meta={data.meta.valor}
            tipo={data.meta.tipo}
          />

          {/* Pronóstico */}
          <div className={cn(
            'mt-4 p-3 rounded-xl flex items-center gap-2 text-sm',
            data.pronostico.semaforo === 'verde' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
            data.pronostico.semaforo === 'amarillo' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' :
            'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
          )}>
            <span className="text-lg">{data.pronostico.semaforo === 'verde' ? '🟢' : data.pronostico.semaforo === 'amarillo' ? '🟡' : '🔴'}</span>
            <p className="font-medium">{data.pronostico.frase}</p>
          </div>
        </motion.div>
      )}

      {/* Métricas del mes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cargando ? (
          Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : data && (
          <>
            <MetricaCard titulo="Nuevos prospectos" valor={data.mes.nuevosProspectos} icono={Users} acento="text-blue-400" comparacion={data.comparaciones.nuevosVsAnterior} />
            <MetricaCard titulo="Citas agendadas" valor={data.mes.citasAgendadas} icono={CalendarDays} acento="text-emerald-400" comparacion={data.comparaciones.citasVsAnterior} />
            <MetricaCard titulo="Clientes ganados" valor={data.mes.clientesGanados} icono={Trophy} acento="text-green-500" />
            <MetricaCard titulo="Tasa de cierre" valor={data.mes.tasaCierre} icono={Target} acento="text-marca-400" formato="porcentaje" />
            <MetricaCard titulo="Ingresos cobrados" valor={data.mes.ingresosCobrados} icono={Wallet} acento="text-amber-400" comparacion={data.comparaciones.ingresosVsAnterior} formato="dinero" />
            <MetricaCard titulo="Valor del embudo" valor={data.mes.valorEmbudo} icono={TrendingUp} acento="text-violet-400" formato="dinero" subtitulo="Dinero vivo en negociación" />
            <MetricaCard titulo="Pagos pendientes" valor={data.mes.pagosPendientes} icono={Clock} acento="text-slate-400" formato="dinero" />
            <MetricaCard titulo="Pagos VENCIDOS" valor={data.mes.pagosVencidos} icono={AlertCircle} acento="text-red-500" formato="dinero" subtitulo="Requieren atención urgente" />
          </>
        )}
      </div>

      {/* Gráfica de crecimiento 6 meses */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-marca-300" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Crecimiento — últimos 6 meses</h2>
        </div>

        {cargando ? (
          <Skeleton className="h-48" />
        ) : !data || data.crecimiento.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-center">
            <div>
              <p className="text-slate-400 text-sm">Aún juntando historial,</p>
              <p className="text-slate-400 text-sm">esto se llena solo con el tiempo 📈</p>
            </div>
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.crecimiento} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [formatearMonto(value), 'Ingresos']}
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid var(--borde)', background: 'var(--bg-superficie)', fontSize: '13px' }}
                />
                <Bar dataKey="ingresos" radius={[6,6,0,0]}>
                  {data.crecimiento.map((entry, i) => (
                    <Cell key={i} fill={i === data.crecimiento.length - 1 ? '#7cc2e8' : '#7cc2e880'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Dos columnas: Origenes + Pérdidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origenes */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            📍 De dónde llegan los clientes
          </h2>
          {cargando ? <Skeleton className="h-40" /> : !data?.origenes.length ? (
            <p className="text-sm text-slate-400 py-4 text-center">Aún sin datos de origen suficientes</p>
          ) : (
            <div className="space-y-3">
              {data.origenes.slice(0, 5).map(o => (
                <div key={o.origen} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{o.origen}</p>
                      <p className="text-sm text-slate-500">{o.leads} leads</p>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-marca-300 rounded-full"
                        style={{ width: `${Math.min((o.leads / (data.origenes[0]?.leads || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  {o.cambio !== undefined && <Flecha porcentaje={o.cambio} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por qué perdemos */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            ❌ Por qué perdemos ventas
          </h2>
          {cargando ? <Skeleton className="h-40" /> : !data?.perdidas.length ? (
            <div className="py-4 text-center">
              <p className="text-sm text-slate-400">Sin ventas perdidas registradas este mes</p>
              <p className="text-xs text-slate-300 dark:text-slate-500 mt-1">¡Sigue así! 🎉</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.perdidas.map(p => (
                <div key={p.motivo} className="flex items-center justify-between">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{p.motivo}</p>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {p.cantidad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ranking del equipo */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Ranking del equipo</h2>
        </div>

        {cargando ? <Skeleton className="h-32" /> : !data?.vendedores.length ? (
          <p className="text-sm text-slate-400 py-4 text-center">Sin datos del equipo</p>
        ) : (
          <div className="space-y-3">
            {data.vendedores.map((v, i) => {
              const medallas = ['🥇', '🥈', '🥉']
              return (
                <div key={v.nombre} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xl w-8">{medallas[i] || `${i+1}.`}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{v.nombre}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-slate-500">{v.cierres} cierres · {formatearMonto(v.ingresos)}</p>
                      {v.clientesEnRiesgo > 0 && (
                        <span className="text-xs text-amber-500">⚠️ {v.clientesEnRiesgo} en riesgo</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{v.metaPorcentaje.toFixed(0)}%</p>
                    <p className="text-xs text-slate-400">de su meta</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
