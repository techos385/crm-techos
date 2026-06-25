'use client'
// src/components/admin/AdminContenido.tsx

import { useState, useEffect } from 'react'
import { Users, Trash2, Download, Shield, Eye, EyeOff, Plus, Loader2, RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { cn, formatearFecha } from '@/lib/utils'
import { useToast } from '@/components/ui/Toaster'

interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: string
  activo: boolean
  ultimoAcceso: string | null
  creadoEn: string
}

interface LogAuditoria {
  id: string
  accion: string
  tabla: string
  registroId: string | null
  descripcion: string | null
  creadoEn: string
  usuario: { nombre: string } | null
}

type Tab = 'usuarios' | 'bitacora' | 'respaldo' | 'papelera'

export function AdminContenido() {
  const { agregar } = useToast()
  const [tab, setTab] = useState<Tab>('usuarios')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [logs, setLogs] = useState<LogAuditoria[]>([])
  const [clientesEliminados, setClientesEliminados] = useState<{ id: string; nombre: string; eliminadoEn: string }[]>([])
  const [cargando, setCargando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [verPass, setVerPass] = useState(false)
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', rol: 'VENDEDOR' })

  const cargarUsuarios = async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/usuarios')
      const data = await res.json()
      if (data.ok) setUsuarios(data.data || [])
    } finally { setCargando(false) }
  }

  const cargarBitacora = async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/usuarios?bitacora=true')
      const data = await res.json()
      if (data.ok) setLogs(data.data || [])
    } finally { setCargando(false) }
  }

  const cargarPapelera = async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/clientes?eliminados=true')
      const data = await res.json()
      if (data.ok) setClientesEliminados(data.data || [])
    } finally { setCargando(false) }
  }

  useEffect(() => {
    if (tab === 'usuarios') cargarUsuarios()
    else if (tab === 'bitacora') cargarBitacora()
    else if (tab === 'papelera') cargarPapelera()
  }, [tab])

  const crearUsuario = async () => {
    if (!form.nombre || !form.correo || !form.password) {
      agregar({ tipo: 'error', titulo: 'Faltan campos', mensaje: 'Nombre, correo y contraseña son requeridos' })
      return
    }
    setGuardando(true)
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.ok) {
        agregar({ tipo: 'exito', titulo: 'Usuario creado ✓', mensaje: '' })
        setMostrarForm(false)
        setForm({ nombre: '', correo: '', password: '', rol: 'VENDEDOR' })
        cargarUsuarios()
      } else {
        agregar({ tipo: 'error', titulo: data.mensaje || 'Error', mensaje: '' })
      }
    } finally { setGuardando(false) }
  }

  const toggleActivo = async (usuario: Usuario) => {
    const res = await fetch(`/api/usuarios?id=${usuario.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !usuario.activo }),
    })
    if ((await res.json()).ok) {
      agregar({ tipo: 'exito', titulo: usuario.activo ? 'Usuario desactivado' : 'Usuario activado', mensaje: '' })
      cargarUsuarios()
    }
  }

  const restaurarCliente = async (id: string) => {
    const res = await fetch(`/api/clientes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurar: true }),
    })
    if ((await res.json()).ok) {
      agregar({ tipo: 'exito', titulo: 'Cliente restaurado ✓', mensaje: '' })
      cargarPapelera()
    }
  }

  const exportar = async (tipo: 'json' | 'clientes' | 'pagos') => {
    try {
      const res = await fetch(`/api/exportar?tipo=${tipo}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `techos-${tipo}-${new Date().toISOString().slice(0, 10)}.${tipo === 'json' ? 'json' : 'csv'}`
      a.click()
      URL.revokeObjectURL(url)
      agregar({ tipo: 'exito', titulo: 'Archivo descargado ✓', mensaje: '' })
    } catch {
      agregar({ tipo: 'error', titulo: 'Error al exportar', mensaje: '' })
    }
  }

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'usuarios', label: 'Usuarios', icon: Users },
    { key: 'bitacora', label: 'Bitácora', icon: Shield },
    { key: 'respaldo', label: 'Respaldo', icon: Download },
    { key: 'papelera', label: 'Papelera', icon: Trash2 },
  ]

  const ROLES = ['ADMIN', 'VENDEDOR', 'SOLO_LECTURA']
  const ROL_LABEL: Record<string, string> = { ADMIN: '⚡ Admin', VENDEDOR: '👤 Vendedor', SOLO_LECTURA: '👁 Solo lectura' }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all')}
              style={tab === t.key ? { background: 'var(--color-marca)', color: 'white' } : { color: 'var(--text-secundario)' }}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* USUARIOS */}
      {tab === 'usuarios' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Equipo de ventas</h3>
            <button onClick={() => setMostrarForm(true)} className="btn-primario flex items-center gap-2 py-2 px-4">
              <Plus size={16} /> Agregar usuario
            </button>
          </div>

          {cargando ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-marca)' }} /></div>
          ) : (
            <div className="space-y-2">
              {usuarios.map(u => (
                <div key={u.id} className={cn('card p-4 flex items-center gap-4', !u.activo && 'opacity-50')}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                    style={{ background: 'var(--color-marca)' }}>
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{u.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secundario)' }}>{u.correo}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="badge text-xs">{ROL_LABEL[u.rol] || u.rol}</span>
                      {u.ultimoAcceso && (
                        <span className="text-xs" style={{ color: 'var(--text-secundario)' }}>
                          Último acceso: {formatearFecha(u.ultimoAcceso)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActivo(u)}
                    className={cn('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all', u.activo ? 'text-red-500 border-red-500/30' : 'text-green-500 border-green-500/30')}
                  >
                    {u.activo ? <><X size={12} /> Desactivar</> : <><CheckCircle size={12} /> Activar</>}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form nuevo usuario */}
          {mostrarForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="card p-6 w-full max-w-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Nuevo usuario</h3>
                  <button onClick={() => setMostrarForm(false)} className="p-2 rounded-lg hover:opacity-70 transition-opacity">
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Nombre completo</label>
                    <input className="campo w-full" placeholder="María García" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Correo</label>
                    <input className="campo w-full" type="email" placeholder="maria@techosycubiertas.mx" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Contraseña inicial</label>
                    <div className="relative">
                      <input className="campo w-full pr-10" type={verPass ? 'text' : 'password'} placeholder="Mín. 8 caracteres" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                      <button onClick={() => setVerPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60">
                        {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Rol</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLES.map(r => (
                        <button key={r} onClick={() => setForm(p => ({ ...p, rol: r }))}
                          className="py-2 px-2 rounded-xl text-xs font-medium transition-all border"
                          style={form.rol === r ? { background: 'var(--color-marca)', color: 'white', borderColor: 'var(--color-marca)' } : { borderColor: 'var(--border)' }}>
                          {ROL_LABEL[r]}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secundario)' }}>
                      {form.rol === 'ADMIN' ? 'Acceso total al CRM' : form.rol === 'VENDEDOR' ? 'Ve y gestiona solo sus propios clientes' : 'Solo puede consultar, no modificar'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setMostrarForm(false)} className="btn-secundario flex-1">Cancelar</button>
                  <button onClick={crearUsuario} disabled={guardando} className="btn-primario flex-1">
                    {guardando ? 'Creando…' : 'Crear usuario'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BITÁCORA */}
      {tab === 'bitacora' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Registro de actividad</h3>
            <button onClick={cargarBitacora} className="p-2 rounded-lg hover:opacity-70 transition-opacity card">
              <RefreshCw size={16} />
            </button>
          </div>
          {cargando ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-marca)' }} /></div>
          ) : logs.length === 0 ? (
            <div className="card p-8 text-center"><p style={{ color: 'var(--text-secundario)' }}>Sin actividad registrada</p></div>
          ) : (
            <div className="space-y-1">
              {logs.map(l => (
                <div key={l.id} className="card p-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--color-marca)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{l.usuario?.nombre || 'Sistema'}</span>
                      {' — '}
                      <span className="badge text-xs">{l.accion}</span>
                      {' en '}
                      <span className="opacity-70">{l.tabla}</span>
                    </p>
                    {l.descripcion && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secundario)' }}>{l.descripcion}</p>}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secundario)' }}>{formatearFecha(l.creadoEn)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RESPALDO */}
      {tab === 'respaldo' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Exportar datos</h3>
          <div className="card p-4 space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-orange-500" />
              <p className="text-sm" style={{ color: 'var(--text-secundario)' }}>
                Exporta tus datos regularmente como respaldo. Los archivos se generan al momento y contienen toda la información sin filtros.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { tipo: 'json' as const, label: '📦 Respaldo completo', desc: 'Todos los datos en JSON (importable)', color: 'text-blue-500' },
              { tipo: 'clientes' as const, label: '👥 Clientes CSV', desc: 'Lista de todos los clientes en Excel', color: 'text-green-500' },
              { tipo: 'pagos' as const, label: '💰 Pagos CSV', desc: 'Historial de cobros en Excel', color: 'text-yellow-500' },
            ].map(e => (
              <button key={e.tipo} onClick={() => exportar(e.tipo)}
                className="card p-5 text-left hover:opacity-80 transition-opacity space-y-1">
                <p className={cn('font-semibold', e.color)}>{e.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-secundario)' }}>{e.desc}</p>
                <p className="text-xs font-medium mt-2" style={{ color: 'var(--color-marca)' }}>↓ Descargar</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PAPELERA */}
      {tab === 'papelera' && (
        <div className="space-y-3">
          <h3 className="font-semibold">Clientes eliminados</h3>
          {cargando ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-marca)' }} /></div>
          ) : clientesEliminados.length === 0 ? (
            <div className="card p-8 text-center">
              <Trash2 size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Papelera vacía</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secundario)' }}>Los clientes eliminados aparecen aquí y pueden restaurarse.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clientesEliminados.map(c => (
                <div key={c.id} className="card p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secundario)' }}>Eliminado: {formatearFecha(c.eliminadoEn)}</p>
                  </div>
                  <button onClick={() => restaurarCliente(c.id)} className="btn-secundario text-xs py-1.5 px-3">
                    ↩ Restaurar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
