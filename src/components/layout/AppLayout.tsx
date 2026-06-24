// src/components/layout/AppLayout.tsx
// Layout principal del CRM: sidebar en desktop, barra inferior en móvil

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, KanbanSquare, CalendarDays, Wallet,
  ListChecks, Trophy, XCircle, Archive, Share2, UserCog,
  Search, Sparkles, ShieldCheck, Bell, HelpCircle, LogOut,
  ChevronDown, Menu, X, Plus, Sun, Moon, Monitor,
  CalendarPlus,
} from 'lucide-react'
import { cn, obtenerIniciales } from '@/lib/utils'
import { useOnboarding } from '@/components/OnboardingProvider'
import { BuscadorGlobal } from '@/components/BuscadorGlobal'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  acento: string
  badge?: number
  soloAdmin?: boolean
  tourId?: string
}

const NAV_PRINCIPAL: NavItem[] = [
  { href: '/dashboard',   label: 'Tablero',       icon: LayoutDashboard, acento: 'text-marca-300', tourId: 'dashboard' },
  { href: '/clientes',    label: 'Clientes',       icon: Users,           acento: 'text-blue-400',  tourId: 'clientes' },
  { href: '/embudo',      label: 'Embudo',         icon: KanbanSquare,    acento: 'text-violet-400' },
  { href: '/agenda',      label: 'Agenda',         icon: CalendarDays,    acento: 'text-emerald-400', tourId: 'agenda' },
  { href: '/pagos',       label: 'Pagos',          icon: Wallet,          acento: 'text-amber-400' },
  { href: '/seguimiento', label: 'Hoy te toca',    icon: ListChecks,      acento: 'text-orange-400', tourId: 'seguimiento' },
]

const NAV_SECUNDARIO: NavItem[] = [
  { href: '/completados', label: 'Completados',    icon: Trophy,          acento: 'text-green-500' },
  { href: '/perdidos',    label: 'Perdidos',       icon: XCircle,         acento: 'text-slate-400' },
  { href: '/archivados',  label: 'Archivados',     icon: Archive,         acento: 'text-gray-400' },
  { href: '/compartir',   label: 'Compartir',      icon: Share2,          acento: 'text-marca-400' },
  { href: '/asistente',   label: 'Asistente IA',   icon: Sparkles,        acento: 'text-marca-300' },
  { href: '/admin',       label: 'Administrador',  icon: ShieldCheck,     acento: 'text-marca-400', soloAdmin: true },
]

const NAV_MOBILE: NavItem[] = [
  { href: '/dashboard',   label: 'Inicio',         icon: LayoutDashboard, acento: 'text-marca-300' },
  { href: '/clientes',    label: 'Clientes',       icon: Users,           acento: 'text-blue-400' },
  { href: '/embudo',      label: 'Embudo',         icon: KanbanSquare,    acento: 'text-violet-400' },
  { href: '/seguimiento', label: 'Tareas',         icon: ListChecks,      acento: 'text-orange-400' },
]

function TemaSelector() {
  const [tema, setTema] = useState<'claro' | 'oscuro' | 'auto'>('auto')
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    const guardado = localStorage.getItem('tema') as typeof tema || 'auto'
    setTema(guardado)
  }, [])

  const aplicarTema = (nuevoTema: typeof tema) => {
    setTema(nuevoTema)
    localStorage.setItem('tema', nuevoTema)

    const esDark =
      nuevoTema === 'oscuro' ||
      (nuevoTema === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    document.documentElement.classList.toggle('dark', esDark)
    setAbierto(false)
  }

  const IconoActual = tema === 'claro' ? Sun : tema === 'oscuro' ? Moon : Monitor

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors toque-seguro flex items-center justify-center"
        aria-label="Cambiar tema"
      >
        <IconoActual className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-modal z-50 overflow-hidden"
          >
            {[
              { valor: 'claro', label: 'Claro', icon: Sun },
              { valor: 'oscuro', label: 'Oscuro', icon: Moon },
              { valor: 'auto', label: 'Automático', icon: Monitor },
            ].map(({ valor, label, icon: Icon }) => (
              <button
                key={valor}
                onClick={() => aplicarTema(valor as typeof tema)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors',
                  tema === valor ? 'text-marca-500 dark:text-marca-300 font-medium' : 'text-slate-700 dark:text-slate-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
                {tema === valor && <span className="ml-auto text-marca-500">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavLink({ item, collapsed = false }: { item: NavItem; collapsed?: boolean }) {
  const pathname = usePathname()
  const activo = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      data-tour={item.tourId}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group',
        'min-h-[44px]',
        activo
          ? 'bg-marca-300/10 dark:bg-marca-300/15 text-marca-600 dark:text-marca-300 font-semibold'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', activo ? item.acento : 'group-hover:' + item.acento)} />
      {!collapsed && (
        <span className="text-sm truncate">{item.label}</span>
      )}
    </Link>
  )
}

function AvatarMenu({ nombre, correo, rol }: { nombre: string; correo: string; rol: string }) {
  const [abierto, setAbierto] = useState(false)
  const inicial = obtenerIniciales(nombre)

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors toque-seguro"
      >
        <div className="w-8 h-8 rounded-full bg-marca-300 text-white flex items-center justify-center text-sm font-bold">
          {inicial}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      <AnimatePresence>
        {abierto && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-modal z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{nombre}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{correo}</p>
                <span className="inline-block mt-1 text-xs bg-marca-300/10 text-marca-600 dark:text-marca-300 px-2 py-0.5 rounded-full">
                  {rol === 'ADMIN' ? 'Administrador' : rol === 'VENDEDOR' ? 'Vendedor' : 'Solo lectura'}
                </span>
              </div>

              <div className="py-1">
                <Link href="/perfil" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors" onClick={() => setAbierto(false)}>
                  <Users className="w-4 h-4" /> Mi perfil
                </Link>
                <Link href="/configuracion" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors" onClick={() => setAbierto(false)}>
                  <ShieldCheck className="w-4 h-4" /> Configuración
                </Link>
              </div>

              <div className="py-1 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { mostrarTour } = useOnboarding()
  const [sidebarAbierta, setSidebarAbierta] = useState(false)
  const [buscadorAbierto, setBuscadorAbierto] = useState(false)

  const esAdmin = session?.user?.rol === 'ADMIN'
  const usuario = session?.user

  // Atajo de teclado para el buscador
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
        e.preventDefault()
        setBuscadorAbierto(true)
      }
      if (e.key === 'Escape') {
        setBuscadorAbierto(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full z-30">
        {/* Logo */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-marca-300 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                Techos y<br />Cubiertas
              </p>
            </div>
          </Link>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_PRINCIPAL.map(item => <NavLink key={item.href} item={item} />)}

          <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

          {NAV_SECUNDARIO
            .filter(item => !item.soloAdmin || esAdmin)
            .map(item => <NavLink key={item.href} item={item} />)
          }
        </nav>

        {/* Páginas de agenda */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <NavLink item={{ href: '/agenda-publica', label: 'Mis ligas de citas', icon: CalendarPlus, acento: 'text-teal-400' }} />
        </div>
      </aside>

      {/* ── SIDEBAR MÓVIL (overlay) ── */}
      <AnimatePresence>
        {sidebarAbierta && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarAbierta(false)}
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 z-50 lg:hidden shadow-xl"
            >
              <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarAbierta(false)}>
                  <div className="w-9 h-9 rounded-xl bg-marca-300 flex items-center justify-center">
                    <span className="text-white font-bold">T</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Techos y Cubiertas</p>
                </Link>
                <button onClick={() => setSidebarAbierta(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <nav className="p-3 space-y-0.5 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
                {[...NAV_PRINCIPAL, ...NAV_SECUNDARIO.filter(i => !i.soloAdmin || esAdmin)]
                  .map(item => (
                    <div key={item.href} onClick={() => setSidebarAbierta(false)}>
                      <NavLink item={item} />
                    </div>
                  ))
                }
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header superior */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-glass border-b border-slate-200 dark:border-slate-800 px-4 h-14 flex items-center gap-3">
          {/* Hamburger móvil */}
          <button
            onClick={() => setSidebarAbierta(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Buscador */}
          <button
            data-tour="buscador"
            onClick={() => setBuscadorAbierto(true)}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors max-w-md text-left"
            aria-label="Buscar (Ctrl+K)"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Buscar clientes, pagos, notas…</span>
            <span className="sm:hidden">Buscar…</span>
            <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-slate-400">
              /
            </kbd>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Botón de campana */}
            <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors toque-seguro flex items-center justify-center" aria-label="Recordatorios">
              <Bell className="w-5 h-5" />
              {/* Badge de notificaciones - se actualizará dinámicamente */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse-dot" aria-label="Tienes recordatorios pendientes" />
            </button>

            {/* Tema */}
            <TemaSelector />

            {/* Ayuda */}
            <button
              onClick={mostrarTour}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors toque-seguro flex items-center justify-center"
              aria-label="Ayuda y tutorial"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Avatar */}
            {usuario && (
              <AvatarMenu
                nombre={usuario.name ?? ''}
                correo={usuario.email ?? ''}
                rol={usuario.rol}
              />
            )}
          </div>
        </header>

        {/* Contenido de página */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── BARRA INFERIOR MÓVIL ── */}
      <nav
        data-tour="nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center"
      >
        {NAV_MOBILE.map(item => {
          const Icon = item.icon
          const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
          const activo = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors toque-seguro',
                activo
                  ? 'text-marca-500 dark:text-marca-300'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}

        {/* Botón "+" */}
        <div className="flex-1 flex items-center justify-center">
          <Link
            href="/clientes/nuevo"
            data-tour="nuevo"
            className="w-12 h-12 rounded-full bg-marca-300 hover:bg-marca-400 text-white flex items-center justify-center shadow-lg -mt-5"
            aria-label="Agregar nuevo cliente"
          >
            <Plus className="w-6 h-6" />
          </Link>
        </div>
      </nav>

      {/* Buscador global */}
      <BuscadorGlobal abierto={buscadorAbierto} onCerrar={() => setBuscadorAbierto(false)} />
    </div>
  )
}
