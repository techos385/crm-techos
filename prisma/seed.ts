// prisma/seed.ts
// Datos de ejemplo para Techos y Cubiertas
// Solo corre en base vacía o cuando se pide explícitamente

import { PrismaClient, Rol, EtapaEmbudo, EstadoCartera, TemperaturaCliente, EstadoPago, MetodoPago, TipoNota, EtiquetaArchivo, EstadoCita } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ── Verificar si ya hay datos reales ──
  const totalClientes = await prisma.cliente.count()
  const totalUsuarios = await prisma.usuario.count()

  if (totalClientes > 0 || totalUsuarios > 0) {
    console.log('⚠️  Ya existen datos en la base. El seed NO sobreescribirá nada.')
    console.log(`   Clientes: ${totalClientes}, Usuarios: ${totalUsuarios}`)
    console.log('   Si deseas sembrar de nuevo, vacía la base manualmente primero.')
    return
  }

  console.log('🌱 Sembrando datos de ejemplo para Techos y Cubiertas...')

  // ── USUARIOS ──
  const hashAdmin = await bcrypt.hash('Admin2024!', 12)
  const hashVendedor1 = await bcrypt.hash('Vendedor123!', 12)
  const hashVendedor2 = await bcrypt.hash('Vendedor123!', 12)

  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Roberto Sánchez',
      correo: 'admin@techosycubiertas.mx',
      contrasenaHash: hashAdmin,
      rol: Rol.ADMIN,
      telefono: '5512345678',
      metaMensual: 5,
      metaTipo: 'cierres',
      comision: 5,
      onboardingCompletado: false,
      slugAgenda: 'roberto',
      agendaActiva: true,
      agendaBio: 'Director de Techos y Cubiertas. +20 años cubriendo proyectos en el Estado de México.',
    }
  })

  const vendedor1 = await prisma.usuario.create({
    data: {
      nombre: 'María García',
      correo: 'maria@techosycubiertas.mx',
      contrasenaHash: hashVendedor1,
      rol: Rol.VENDEDOR,
      telefono: '5587654321',
      metaMensual: 2,
      metaTipo: 'cierres',
      comision: 4,
      onboardingCompletado: false,
      slugAgenda: 'maria',
      agendaActiva: true,
      agendaBio: 'Ejecutiva de ventas. Especialista en arcotechos y canchas deportivas.',
    }
  })

  const vendedor2 = await prisma.usuario.create({
    data: {
      nombre: 'Carlos Herrera',
      correo: 'carlos@techosycubiertas.mx',
      contrasenaHash: hashVendedor2,
      rol: Rol.VENDEDOR,
      telefono: '5598765432',
      metaMensual: 2,
      metaTipo: 'cierres',
      comision: 4,
      onboardingCompletado: false,
      slugAgenda: 'carlos',
      agendaActiva: true,
      agendaBio: 'Ejecutivo de ventas. Especialista en estructuras para naves industriales y bodegas.',
    }
  })

  // ── ETIQUETAS ──
  const etVip = await prisma.etiqueta.create({ data: { nombre: 'VIP', color: '#f59e0b' } })
  const etReferido = await prisma.etiqueta.create({ data: { nombre: 'Referido', color: '#10b981' } })
  const etAnticipo = await prisma.etiqueta.create({ data: { nombre: 'Pagó anticipo', color: '#7cc2e8' } })
  const etGrande = await prisma.etiqueta.create({ data: { nombre: 'Proyecto grande', color: '#8b5cf6' } })
  const etRecurrente = await prisma.etiqueta.create({ data: { nombre: 'Cliente recurrente', color: '#06b6d4' } })

  // ── FECHAS BASE ──
  const ahora = new Date()
  const hace1mes = new Date(ahora); hace1mes.setMonth(ahora.getMonth() - 1)
  const hace2mes = new Date(ahora); hace2mes.setMonth(ahora.getMonth() - 2)
  const hace3mes = new Date(ahora); hace3mes.setMonth(ahora.getMonth() - 3)
  const hace4mes = new Date(ahora); hace4mes.setMonth(ahora.getMonth() - 4)
  const hace5mes = new Date(ahora); hace5mes.setMonth(ahora.getMonth() - 5)
  const manana = new Date(ahora); manana.setDate(ahora.getDate() + 1)
  const pasado = new Date(ahora); pasado.setDate(ahora.getDate() + 2)
  const ayer = new Date(ahora); ayer.setDate(ahora.getDate() - 1)
  const hace3dias = new Date(ahora); hace3dias.setDate(ahora.getDate() - 3)
  const hace5dias = new Date(ahora); hace5dias.setDate(ahora.getDate() - 5)
  const hace7dias = new Date(ahora); hace7dias.setDate(ahora.getDate() - 7)
  const hace10dias = new Date(ahora); hace10dias.setDate(ahora.getDate() - 10)

  const proxSem = new Date(ahora); proxSem.setDate(ahora.getDate() + 7)
  const proxSem2 = new Date(ahora); proxSem2.setDate(ahora.getDate() + 14)

  // ── CLIENTES ──

  // 1. Cliente caliente en negociación (activo)
  const c1 = await prisma.cliente.create({
    data: {
      nombre: 'Lic. Jorge Ramírez Flores',
      telefono: '55 1234 5678',
      telefonoIntl: '5215512345678',
      correo: 'jramirez@colegioecatepec.edu.mx',
      origen: 'Instagram',
      utmFuente: 'instagram',
      etapa: EtapaEmbudo.NEGOCIACION,
      estadoCartera: EstadoCartera.ACTIVO,
      temperatura: TemperaturaCliente.CALIENTE,
      objecionPrincipal: 'Está caro',
      valorEstimado: 380000,
      proximaAccion: 'Llamar para cerrar — ofrecer anticipo del 30% y arrancar en 2 semanas',
      proximaAccionFecha: manana,
      empresa: 'Colegio Particular Ecatepec',
      empresaNombre: 'Colegio Particular Ecatepec S.C.',
      empresaGiro: 'Educación privada',
      empresaPuesto: 'Director General',
      responsableProyecto: 'Lic. Jorge Ramírez',
      zonaUbicacion: 'Ecatepec de Morelos, Edo. Méx.',
      tipoObra: 'Techado de cancha deportiva',
      medidasProyecto: '30m x 15m',
      tipoCubierta: 'Arcotecho de policarbonato',
      esArcotecho: true,
      presupuestoEstimado: 400000,
      montoCotizado: 380000,
      etapaProyecto: 'Cotización aprobada, negociando condiciones',
      notas: 'Director muy interesado. Dijo que "está un poco caro" pero necesita el techo antes de ciclo escolar. Tiene presupuesto aprobado por el consejo directivo.',
      vendedorId: admin.id,
      ultimoContacto: hace3dias,
    }
  })
  await prisma.etiquetaEnCliente.create({ data: { clienteId: c1.id, etiquetaId: etVip.id } })
  await prisma.etiquetaEnCliente.create({ data: { clienteId: c1.id, etiquetaId: etGrande.id } })

  // 2. Cliente en propuesta enviada (activo, tibio)
  const c2 = await prisma.cliente.create({
    data: {
      nombre: 'Ing. Patricia Morales Vega',
      telefono: '55 8765 4321',
      telefonoIntl: '5215587654321',
      correo: 'pmorales@bodegasmorales.com',
      origen: 'Facebook',
      utmFuente: 'facebook',
      etapa: EtapaEmbudo.PROPUESTA_ENVIADA,
      estadoCartera: EstadoCartera.ACTIVO,
      temperatura: TemperaturaCliente.TIBIO,
      objecionPrincipal: 'Lo voy a pensar',
      valorEstimado: 220000,
      proximaAccion: 'Enviar WhatsApp de seguimiento y recordar que los precios de acero suben en 30 días',
      proximaAccionFecha: ayer,  // VENCIDA para que se vea en alertas
      empresa: 'Bodegas Morales e Hijos',
      empresaNombre: 'Bodegas Morales e Hijos S.A. de C.V.',
      empresaGiro: 'Almacenaje y logística',
      empresaPuesto: 'Directora de Operaciones',
      responsableProyecto: 'Ing. Patricia Morales',
      zonaUbicacion: 'Coacalco, Edo. Méx.',
      tipoObra: 'Techo de bodega industrial',
      medidasProyecto: '40m x 20m',
      tipoCubierta: 'Estructura metálica con lámina acanalada',
      esEstructuraMetalica: true,
      presupuestoEstimado: 250000,
      montoCotizado: 220000,
      notas: 'Necesita el presupuesto aprobado por su socio. Dijo "lo voy a pensar" — lleva 8 días sin responder.',
      vendedorId: vendedor1.id,
      ultimoContacto: hace7dias,
    }
  })
  await prisma.etiquetaEnCliente.create({ data: { clienteId: c2.id, etiquetaId: etGrande.id } })

  // 3. Cliente nuevo (recién llegó por landing)
  const c3 = await prisma.cliente.create({
    data: {
      nombre: 'Sr. Miguel Ángel Torres',
      telefono: '55 9876 5432',
      telefonoIntl: '5215598765432',
      correo: 'mtorres@gmail.com',
      origen: 'Landing',
      utmFuente: 'landing',
      etapa: EtapaEmbudo.NUEVO_PROSPECTO,
      estadoCartera: EstadoCartera.ACTIVO,
      temperatura: TemperaturaCliente.CALIENTE,
      objecionPrincipal: '',
      valorEstimado: 85000,
      proximaAccion: 'Contactar en menos de 24 h — tiene urgencia',
      proximaAccionFecha: ahora,
      zonaUbicacion: 'Tecámac, Edo. Méx.',
      tipoObra: 'Techo de salón de fiestas',
      medidasProyecto: '20m x 10m',
      esArcotecho: true,
      notas: 'Llegó por la landing hace 2 horas. Pide cotización urgente para su salón de eventos.',
      vendedorId: vendedor1.id,
      ultimoContacto: ahora,
    }
  })

  // 4. Cliente en seguimiento (activo, frío)
  const c4 = await prisma.cliente.create({
    data: {
      nombre: 'Profr. Alejandro Gutiérrez',
      telefono: '55 1122 3344',
      telefonoIntl: '5215511223344',
      correo: 'agutierrez@escuelaprimaria.edu.mx',
      origen: 'Recomendación',
      etapa: EtapaEmbudo.SEGUIMIENTO,
      estadoCartera: EstadoCartera.ACTIVO,
      temperatura: TemperaturaCliente.FRIO,
      objecionPrincipal: 'Sin presupuesto aprobado aún',
      valorEstimado: 150000,
      proximaAccion: 'Llamar la próxima semana — espera aprobación del presupuesto anual',
      proximaAccionFecha: proxSem,
      empresa: 'Escuela Primaria Lázaro Cárdenas',
      empresaNombre: 'Escuela Primaria Federal Lázaro Cárdenas',
      empresaGiro: 'Educación pública',
      empresaPuesto: 'Director de la escuela',
      zonaUbicacion: 'Ecatepec de Morelos, Edo. Méx.',
      tipoObra: 'Arcotecho para patio escolar',
      medidasProyecto: '25m x 12m',
      esArcotecho: true,
      presupuestoEstimado: 150000,
      montoCotizado: 148000,
      notas: 'El director quiere el arcotecho pero dice que el presupuesto escolar lo aprueban en noviembre. Lo tenemos desde hace 3 meses.',
      vendedorId: vendedor2.id,
      ultimoContacto: hace10dias,
    }
  })

  // 5. Cita agendada para mañana (activo, caliente)
  const c5 = await prisma.cliente.create({
    data: {
      nombre: 'Sr. Fernando Castillo Ríos',
      telefono: '55 5566 7788',
      telefonoIntl: '5215555667788',
      correo: 'fcastillo@gimnasiofitness.com',
      origen: 'Instagram',
      utmFuente: 'instagram',
      etapa: EtapaEmbudo.CITA_AGENDADA,
      estadoCartera: EstadoCartera.ACTIVO,
      temperatura: TemperaturaCliente.CALIENTE,
      objecionPrincipal: '',
      valorEstimado: 95000,
      proximaAccion: 'Confirmar cita de mañana a las 10:00 AM',
      proximaAccionFecha: manana,
      zonaUbicacion: 'Ciudad Azteca, Ecatepec, Edo. Méx.',
      tipoObra: 'Techo para gimnasio',
      medidasProyecto: '18m x 12m',
      tipoCubierta: 'Estructura metálica con lámina termo-acústica',
      esEstructuraMetalica: true,
      presupuestoEstimado: 100000,
      notas: 'Dueño de gimnasio. Necesita techo antes de temporada de lluvias. Muy urgido.',
      vendedorId: admin.id,
      ultimoContacto: ayer,
    }
  })

  // 6. CLIENTE GANADO (hace 2 meses)
  const c6 = await prisma.cliente.create({
    data: {
      nombre: 'Lic. Claudia Hernández',
      telefono: '55 9900 1122',
      telefonoIntl: '5215599001122',
      correo: 'claudia@albercatecamac.com',
      origen: 'Facebook',
      utmFuente: 'facebook',
      etapa: EtapaEmbudo.PROYECTO_ENTREGADO,
      estadoCartera: EstadoCartera.GANADO,
      temperatura: TemperaturaCliente.CALIENTE,
      objecionPrincipal: '',
      valorEstimado: 310000,
      empresa: 'Alberca Club Tecámac',
      responsableProyecto: 'Claudia Hernández',
      zonaUbicacion: 'Tecámac, Edo. Méx.',
      tipoObra: 'Arcotecho para alberca',
      medidasProyecto: '35m x 16m',
      tipoCubierta: 'Arcotecho con policarbonato UV',
      esArcotecho: true,
      montoCotizado: 310000,
      notas: 'Cliente muy satisfecha. Prometió recomendarnos con su red de albercas.',
      vendedorId: admin.id,
      ultimoContacto: hace2mes,
      ganandoEn: hace2mes,
    }
  })
  await prisma.etiquetaEnCliente.create({ data: { clienteId: c6.id, etiquetaId: etVip.id } })
  await prisma.etiquetaEnCliente.create({ data: { clienteId: c6.id, etiquetaId: etRecurrente.id } })

  // 7. CLIENTE GANADO (hace 4 meses)
  const c7 = await prisma.cliente.create({
    data: {
      nombre: 'Ing. Roberto Díaz Luna',
      telefono: '55 3344 5566',
      telefonoIntl: '5215533445566',
      correo: 'rdiaz@naveindustrial.com',
      origen: 'Recomendación',
      etapa: EtapaEmbudo.CLIENTE_RECURRENTE,
      estadoCartera: EstadoCartera.GANADO,
      temperatura: TemperaturaCliente.CALIENTE,
      objecionPrincipal: '',
      valorEstimado: 520000,
      empresa: 'Metalúrgica Díaz S.A.',
      empresaNombre: 'Metalúrgica Díaz S.A. de C.V.',
      empresaGiro: 'Manufactura metálica',
      empresaPuesto: 'Gerente de Planta',
      zonaUbicacion: 'Cuautitlán Izcalli, Edo. Méx.',
      tipoObra: 'Nave industrial',
      medidasProyecto: '60m x 30m',
      tipoCubierta: 'Estructura metálica industrial pesada',
      esEstructuraMetalica: true,
      montoCotizado: 520000,
      notas: 'Nave completa entregada. Ya está pidiendo cotización para una segunda nave.',
      vendedorId: vendedor2.id,
      ultimoContacto: hace4mes,
      ganandoEn: hace4mes,
    }
  })
  await prisma.etiquetaEnCliente.create({ data: { clienteId: c7.id, etiquetaId: etVip.id } })
  await prisma.etiquetaEnCliente.create({ data: { clienteId: c7.id, etiquetaId: etRecurrente.id } })

  // 8. CLIENTE PERDIDO (hace 1 mes)
  const c8 = await prisma.cliente.create({
    data: {
      nombre: 'Sr. Arturo Medina',
      telefono: '55 7788 9900',
      telefonoIntl: '5215577889900',
      correo: 'arturo.medina@outlook.com',
      origen: 'Instagram',
      utmFuente: 'instagram',
      etapa: EtapaEmbudo.PRECIO_ALTO,
      estadoCartera: EstadoCartera.PERDIDO,
      temperatura: TemperaturaCliente.FRIO,
      objecionPrincipal: 'Está caro',
      valorEstimado: 75000,
      motivoPerdida: 'Se fue con la competencia',
      zonaUbicacion: 'Ecatepec de Morelos, Edo. Méx.',
      tipoObra: 'Techo de negocio local',
      medidasProyecto: '12m x 8m',
      esArcotecho: true,
      montoCotizado: 75000,
      notas: 'Nos dijo que encontró a alguien más barato. No quisimos bajar de precio por debajo del costo.',
      vendedorId: vendedor1.id,
      ultimoContacto: hace1mes,
      perdiendoEn: hace1mes,
    }
  })

  // 9. Cliente en cotización enviada (activo)
  const c9 = await prisma.cliente.create({
    data: {
      nombre: 'C.P. Sandra López Martínez',
      telefono: '55 4455 6677',
      telefonoIntl: '5215544556677',
      correo: 'slopez@salonfiestasangel.mx',
      origen: 'WhatsApp',
      utmFuente: 'whatsapp',
      etapa: EtapaEmbudo.COTIZACION_ENVIADA,
      estadoCartera: EstadoCartera.ACTIVO,
      temperatura: TemperaturaCliente.TIBIO,
      objecionPrincipal: 'Lo voy a pensar',
      valorEstimado: 125000,
      proximaAccion: 'Llamar para saber si revisó la cotización y resolver dudas',
      proximaAccionFecha: hace5dias, // VENCIDA
      zonaUbicacion: 'Chalco, Edo. Méx.',
      tipoObra: 'Techo para salón de eventos',
      medidasProyecto: '22m x 10m',
      tipoCubierta: 'Arcotecho de lona tensada',
      esArcotecho: true,
      presupuestoEstimado: 130000,
      montoCotizado: 125000,
      notas: 'Dueña de salón de fiestas. Pidió cotización el martes, enviamos el miércoles. No ha respondido.',
      vendedorId: vendedor1.id,
      ultimoContacto: hace5dias,
    }
  })
  await prisma.etiquetaEnCliente.create({ data: { clienteId: c9.id, etiquetaId: etReferido.id } })

  // 10. Cliente en visita programada (activo)
  const c10 = await prisma.cliente.create({
    data: {
      nombre: 'Profr. Héctor Jiménez Reyes',
      telefono: '55 2233 4455',
      telefonoIntl: '5215522334455',
      correo: 'hjmenez@secundaria.edu.mx',
      origen: 'Recomendación',
      etapa: EtapaEmbudo.VISITA_PROGRAMADA,
      estadoCartera: EstadoCartera.ACTIVO,
      temperatura: TemperaturaCliente.CALIENTE,
      objecionPrincipal: '',
      valorEstimado: 280000,
      proximaAccion: 'Visita técnica para medir y tomar fotografías — llevar brochure',
      proximaAccionFecha: pasado,
      empresa: 'Secundaria Técnica No. 47',
      empresaNombre: 'Escuela Secundaria Técnica Federal No. 47',
      empresaGiro: 'Educación pública',
      empresaPuesto: 'Director',
      zonaUbicacion: 'Ecatepec de Morelos, Edo. Méx.',
      tipoObra: 'Arcotecho para área deportiva',
      medidasProyecto: '28m x 14m + pequeña área de 10x8',
      esArcotecho: true,
      presupuestoEstimado: 300000,
      notas: 'Nos contactó por recomendación del Colegio Ecatepec. Necesita dos áreas cubiertas. Muy interesado.',
      vendedorId: admin.id,
      ultimoContacto: hace3dias,
    }
  })
  await prisma.etiquetaEnCliente.create({ data: { clienteId: c10.id, etiquetaId: etReferido.id } })
  await prisma.etiquetaEnCliente.create({ data: { clienteId: c10.id, etiquetaId: etGrande.id } })

  // 11. Cliente contactado (activo, tibio)
  const c11 = await prisma.cliente.create({
    data: {
      nombre: 'Sr. Mauricio Reyes',
      telefono: '55 6677 8899',
      telefonoIntl: '5215566778899',
      correo: 'mreyes@gmail.com',
      origen: 'Facebook',
      utmFuente: 'facebook',
      etapa: EtapaEmbudo.CONTACTADO,
      estadoCartera: EstadoCartera.ACTIVO,
      temperatura: TemperaturaCliente.TIBIO,
      objecionPrincipal: 'Lo voy a pensar',
      valorEstimado: 60000,
      proximaAccion: 'Agendar visita para ver el espacio y dar cotización formal',
      proximaAccionFecha: proxSem,
      zonaUbicacion: 'Nezahualcóyotl, Edo. Méx.',
      tipoObra: 'Techado de negocio de abarrotes',
      medidasProyecto: '14m x 7m',
      esArcotecho: true,
      notas: 'Tiene una tienda de abarrotes y quiere techado en el patio. Interesado pero dice "lo tengo que pensar con mi esposa".',
      vendedorId: vendedor2.id,
      ultimoContacto: ayer,
    }
  })

  // 12. CLIENTE ARCHIVADO
  const c12 = await prisma.cliente.create({
    data: {
      nombre: 'Arq. Beatriz Soto',
      telefono: '55 0011 2233',
      telefonoIntl: '5215500112233',
      correo: 'bsoto@arquitectura.mx',
      origen: 'Instagram',
      utmFuente: 'instagram',
      etapa: EtapaEmbudo.NUEVO_PROSPECTO,
      estadoCartera: EstadoCartera.ARCHIVADO,
      temperatura: TemperaturaCliente.FRIO,
      objecionPrincipal: 'Proyecto en pausa',
      valorEstimado: 200000,
      zonaUbicacion: 'Ecatepec de Morelos, Edo. Méx.',
      tipoObra: 'Estructura para club deportivo',
      esEstructuraMetalica: true,
      notas: 'Arquitecta que diseña un club deportivo. El proyecto se pausó por problemas de permisos municipales. La archivamos para retomar en 6 meses.',
      vendedorId: vendedor1.id,
      ultimoContacto: hace2mes,
      archivandoEn: hace1mes,
      estadoAnterior: EstadoCartera.ACTIVO,
      etapaAnterior: EtapaEmbudo.NUEVO_PROSPECTO,
    }
  })

  // ── CITAS ──
  await prisma.cita.create({
    data: {
      clienteId: c5.id,
      vendedorId: admin.id,
      titulo: 'Reunión de cotización - Fernando Castillo (Gimnasio)',
      descripcion: 'Revisar medidas y presentar propuesta para el techo del gimnasio',
      inicio: new Date(manana.getFullYear(), manana.getMonth(), manana.getDate(), 10, 0),
      fin: new Date(manana.getFullYear(), manana.getMonth(), manana.getDate(), 10, 30),
      tipo: 'reunion',
      estado: EstadoCita.PROGRAMADA,
    }
  })

  await prisma.cita.create({
    data: {
      clienteId: c10.id,
      vendedorId: admin.id,
      titulo: 'Visita técnica - Secundaria No. 47',
      descripcion: 'Visita técnica para medir las dos áreas a cubrir',
      inicio: new Date(pasado.getFullYear(), pasado.getMonth(), pasado.getDate(), 9, 0),
      fin: new Date(pasado.getFullYear(), pasado.getMonth(), pasado.getDate(), 9, 30),
      tipo: 'visita',
      estado: EstadoCita.PROGRAMADA,
    }
  })

  await prisma.cita.create({
    data: {
      clienteId: c6.id,
      vendedorId: admin.id,
      titulo: 'Reunión inicial - Alberca Club Tecámac',
      descripcion: 'Primera reunión para presentar propuesta',
      inicio: new Date(hace2mes.getFullYear(), hace2mes.getMonth(), hace2mes.getDate(), 11, 0),
      fin: new Date(hace2mes.getFullYear(), hace2mes.getMonth(), hace2mes.getDate(), 11, 30),
      tipo: 'reunion',
      estado: EstadoCita.REALIZADA,
    }
  })

  await prisma.cita.create({
    data: {
      clienteId: c1.id,
      vendedorId: admin.id,
      titulo: 'Reunión de cierre - Colegio Ecatepec',
      descripcion: 'Presentar propuesta final y condiciones de pago',
      inicio: new Date(hace5dias.getFullYear(), hace5dias.getMonth(), hace5dias.getDate(), 10, 0),
      fin: new Date(hace5dias.getFullYear(), hace5dias.getMonth(), hace5dias.getDate(), 10, 30),
      tipo: 'reunion',
      estado: EstadoCita.REALIZADA,
    }
  })

  // ── PAGOS ──

  // Pagos del cliente GANADO c6 (hace 2 meses) - Alberca Tecámac
  const pago6a = await prisma.pago.create({
    data: {
      clienteId: c6.id,
      concepto: 'Anticipo 40% - Arcotecho Alberca Club Tecámac',
      monto: 124000,
      metodo: MetodoPago.TRANSFERENCIA,
      estado: EstadoPago.PAGADO,
      fechaPago: hace2mes,
      creadoEn: hace2mes,
      registradoPorId: admin.id,
    }
  })
  const pago6b = await prisma.pago.create({
    data: {
      clienteId: c6.id,
      concepto: 'Segunda parcialidad 30% - Alberca Club',
      monto: 93000,
      metodo: MetodoPago.TRANSFERENCIA,
      estado: EstadoPago.PAGADO,
      fechaPago: new Date(hace1mes.getFullYear(), hace1mes.getMonth(), hace1mes.getDate() - 10),
      registradoPorId: admin.id,
    }
  })
  const pago6c = await prisma.pago.create({
    data: {
      clienteId: c6.id,
      concepto: 'Liquidación final 30% - Alberca Club',
      monto: 93000,
      metodo: MetodoPago.DEPOSITO_ANTICIPO,
      estado: EstadoPago.PAGADO,
      fechaPago: hace1mes,
      registradoPorId: admin.id,
    }
  })

  // Pagos del cliente GANADO c7 (hace 4 meses) - Nave Industrial
  await prisma.pago.create({
    data: {
      clienteId: c7.id,
      concepto: 'Anticipo 40% - Nave Industrial Metalúrgica',
      monto: 208000,
      metodo: MetodoPago.TRANSFERENCIA,
      estado: EstadoPago.PAGADO,
      fechaPago: hace5mes,
      creadoEn: hace5mes,
      registradoPorId: vendedor2.id,
    }
  })
  await prisma.pago.create({
    data: {
      clienteId: c7.id,
      concepto: 'Segunda exhibición - Nave Industrial',
      monto: 156000,
      metodo: MetodoPago.TRANSFERENCIA,
      estado: EstadoPago.PAGADO,
      fechaPago: hace4mes,
      creadoEn: hace4mes,
      registradoPorId: vendedor2.id,
    }
  })
  await prisma.pago.create({
    data: {
      clienteId: c7.id,
      concepto: 'Liquidación - Nave Industrial Metalúrgica',
      monto: 156000,
      metodo: MetodoPago.TRANSFERENCIA,
      estado: EstadoPago.PAGADO,
      fechaPago: hace3mes,
      creadoEn: hace3mes,
      registradoPorId: vendedor2.id,
    }
  })

  // Pago con anticipo del cliente en negociación c1
  await prisma.pago.create({
    data: {
      clienteId: c1.id,
      concepto: 'Anticipo 30% - Cancha Colegio Ecatepec',
      monto: 114000,
      metodo: MetodoPago.DEPOSITO_ANTICIPO,
      estado: EstadoPago.PENDIENTE,
      fechaVencimiento: manana,
      registradoPorId: admin.id,
    }
  })

  // Pago VENCIDO (c2)
  await prisma.pago.create({
    data: {
      clienteId: c2.id,
      concepto: 'Anticipo acordado - Bodega Morales',
      monto: 66000,
      metodo: MetodoPago.TRANSFERENCIA,
      estado: EstadoPago.VENCIDO,
      fechaVencimiento: hace7dias,
      registradoPorId: vendedor1.id,
    }
  })

  // ── NOTAS / LÍNEA DE TIEMPO ──

  await prisma.nota.create({
    data: {
      clienteId: c1.id,
      autorId: admin.id,
      tipo: TipoNota.NOTA_MANUAL,
      contenido: 'El director dijo que el presupuesto ya está aprobado pero quiere ver si podemos bajar algo. Le expliqué que somos los más baratos de calidad en la zona. Prometió decidir esta semana.',
      fechaNota: hace5dias,
    }
  })
  await prisma.nota.create({
    data: {
      clienteId: c1.id,
      autorId: admin.id,
      tipo: TipoNota.LLAMADA,
      contenido: 'Llamada de 20 minutos. Confirmó que tiene prisa por el ciclo escolar. Su objeción es el precio, no el proveedor.',
      fechaNota: hace7dias,
    }
  })
  await prisma.nota.create({
    data: {
      clienteId: c1.id,
      autorId: admin.id,
      tipo: TipoNota.CAMBIO_ETAPA,
      contenido: 'Avanzó a Negociación después de la reunión de cierre',
      fechaNota: hace5dias,
    }
  })

  await prisma.nota.create({
    data: {
      clienteId: c2.id,
      autorId: vendedor1.id,
      tipo: TipoNota.NOTA_MANUAL,
      contenido: 'Enviamos propuesta por correo y WhatsApp. Leyó el mensaje pero no respondió.',
      fechaNota: hace7dias,
    }
  })

  await prisma.nota.create({
    data: {
      clienteId: c6.id,
      autorId: admin.id,
      tipo: TipoNota.CAMBIO_ESTADO,
      contenido: 'Marcado como Ganado. Proyecto entregado completo y con garantía.',
      fechaNota: hace1mes,
    }
  })

  await prisma.nota.create({
    data: {
      clienteId: c7.id,
      autorId: vendedor2.id,
      tipo: TipoNota.CAMBIO_ESTADO,
      contenido: 'Proyecto de nave industrial entregado. Cliente muy satisfecho. Pide cotización para segunda nave.',
      fechaNota: hace3mes,
    }
  })

  // ── ARCHIVO SIMULADO (c1) ──
  await prisma.archivo.create({
    data: {
      clienteId: c1.id,
      subidoPorId: admin.id,
      nombre: 'Cotizacion_ColegioEcatepec_v2.pdf',
      etiqueta: EtiquetaArchivo.COTIZACION,
      tipo: 'application/pdf',
      tamano: 245000,
      // datos: null — sin archivo real, solo metadatos de ejemplo
    }
  })

  // ── RECORDATORIOS ──
  await prisma.recordatorio.create({
    data: {
      usuarioId: admin.id,
      clienteId: c1.id,
      titulo: 'Llamar al director del Colegio para cerrar',
      descripcion: 'Tiene presupuesto aprobado, solo hay que darle el último empujón',
      fecha: manana,
    }
  })
  await prisma.recordatorio.create({
    data: {
      usuarioId: vendedor1.id,
      clienteId: c2.id,
      titulo: 'Seguimiento urgente — Bodega Morales',
      descripcion: 'Lleva 7 días sin responder. Posible pérdida si no actuamos hoy.',
      fecha: ahora,
    }
  })

  // ── CONFIGURACIÓN DEL NEGOCIO ──
  const configItems = [
    { clave: 'negocio_nombre', valor: 'Techos y Cubiertas' },
    { clave: 'negocio_color', valor: '#7cc2e8' },
    { clave: 'negocio_moneda', valor: 'MXN' },
    { clave: 'negocio_moneda_simbolo', valor: '$' },
    { clave: 'negocio_timezone', valor: 'America/Mexico_City' },
    { clave: 'negocio_horario_inicio', valor: '09:00' },
    { clave: 'negocio_horario_fin', valor: '18:00' },
    { clave: 'negocio_duracion_cita', valor: '30' },
    { clave: 'negocio_telefono', valor: '5512345678' },
    { clave: 'negocio_direccion', valor: 'Ecatepec de Morelos, Estado de México, México' },
    { clave: 'meta_mes', valor: '5' },
    { clave: 'meta_tipo', valor: 'cierres' },
    { clave: 'umbral_estancamiento', valor: '7' },
    { clave: 'whatsapp_mensaje_tipo', valor: 'Hola {nombre}, gracias por contactar a Techos y Cubiertas. Con gusto te ayudamos con tu proyecto es para Arcotecho o estructura metálica. Para brindarte una cotización, ¿podrías compartirnos las medidas, ubicación y algunas fotografías del área a cubrir?' },
    { clave: 'negocio_descripcion', valor: 'Especialistas en techos, fabricación e instalación de arcotechos y estructuras metálicas para escuelas, bodegas, canchas deportivas, albercas, salones de fiestas, gimnasios y naves industriales. Más de 20 años de experiencia.' },
    { clave: 'motivos_perdida', valor: JSON.stringify(['Precio alto', 'Se fue con la competencia', 'No contestó', 'No era el momento', 'No calificaba', 'Proyecto cancelado', 'Otro']) },
  ]

  for (const item of configItems) {
    await prisma.configNegocio.create({ data: item })
  }

  // ── PLANTILLAS DE MENSAJES ──
  const plantillas = [
    // Cierre
    {
      nombre: 'Cierre directo — ¿Lo dejamos cerrado hoy?',
      tipo: 'whatsapp',
      categoria: 'cierre',
      cuerpo: 'Hola {nombre}, soy {vendedor} de Techos y Cubiertas. Quería saber si pudiste revisar la propuesta que te enviamos para {tipoObra}. Tenemos disponibilidad para arrancar la próxima semana, ¿lo dejamos cerrado hoy y agendamos el inicio? 🔨',
      esSistema: true,
    },
    // Vencer "está caro"
    {
      nombre: 'Vencer objeción — Está caro',
      tipo: 'whatsapp',
      categoria: 'objecion_precio',
      cuerpo: 'Hola {nombre}, entiendo que el presupuesto es importante. Quiero comentarte que trabajamos con acero de primera calidad y garantía de 5 años — a largo plazo es la opción más económica. Además, podemos estructurar el pago en parcialidades para que no lo sientas de golpe. ¿Te cuento cómo funciona? 💪',
      esSistema: true,
    },
    // Vencer "lo voy a pensar"
    {
      nombre: 'Vencer objeción — Lo voy a pensar',
      tipo: 'whatsapp',
      categoria: 'objecion_pensar',
      cuerpo: 'Hola {nombre}, ¿cómo estás? Solo quería comentarte que el precio del acero sube el próximo mes y si cerramos esta semana te podemos respetar el presupuesto actual de {valor}. ¿Qué dudas tienes que podamos resolver juntos hoy? 🙌',
      esSistema: true,
    },
    // Reactivar frío
    {
      nombre: 'Reactivar cliente frío',
      tipo: 'whatsapp',
      categoria: 'reactivacion',
      cuerpo: 'Hola {nombre}, hace tiempo hablamos de tu proyecto de {tipoObra}. Quería saber si sigue en planes porque tenemos disponibilidad ahora y podríamos arrancar rápido. ¿Sigue siendo algo que te interesa? 😊',
      esSistema: true,
    },
    // Confirmar cita
    {
      nombre: 'Confirmar cita',
      tipo: 'whatsapp',
      categoria: 'cita',
      cuerpo: 'Hola {nombre}, te confirmamos nuestra cita para mañana. Cualquier cambio avísanos con tiempo. ¡Nos vemos! 📅',
      esSistema: true,
    },
    // Cobrar pago vencido
    {
      nombre: 'Recuperar pago vencido',
      tipo: 'whatsapp',
      categoria: 'cobro',
      cuerpo: 'Hola {nombre}, un recordatorio de que tienes un pago pendiente de ${valor} con nosotros. ¿Cuándo podrías realizarlo? Con gusto coordinamos. Gracias 🙏',
      esSistema: true,
    },
    // Post-venta / onboarding
    {
      nombre: 'Post-venta — Seguimiento tras entrega',
      tipo: 'whatsapp',
      categoria: 'postventa',
      cuerpo: 'Hola {nombre}, ¡esperamos que estés muy contento/a con tu nuevo techo! 🎉 Si tienes alguna duda o necesitas algo, aquí estamos. Y si conoces a alguien que necesite una estructura, nos encantaría ayudarle — tenemos una promoción especial para referidos. ¡Gracias por confiar en Techos y Cubiertas! 🏗️',
      esSistema: true,
    },
    // Pedir referidos
    {
      nombre: 'Pedir referidos al cliente ganado',
      tipo: 'whatsapp',
      categoria: 'referidos',
      cuerpo: 'Hola {nombre}, nos da mucho gusto que quedaste satisfecho/a con el proyecto. Te cuento que tenemos un programa de referidos: si nos recomiendas con alguien y cierran, te enviamos un detalle especial. ¿Conoces a alguien que necesite un techo o estructura metálica? 🤝',
      esSistema: true,
    },
    // Urgencia / escasez
    {
      nombre: 'Crear urgencia — Disponibilidad limitada',
      tipo: 'whatsapp',
      categoria: 'urgencia',
      cuerpo: 'Hola {nombre}, quería avisarte que tenemos solo 2 espacios en agenda para arrancar proyectos este mes antes de temporada de lluvias. Si quieres asegurar el tuyo, necesitamos definirlo esta semana. ¿Hablamos hoy o mañana? ⚡',
      esSistema: true,
    },
    // Mensaje de bienvenida inicial
    {
      nombre: 'Primer contacto — Bienvenida',
      tipo: 'whatsapp',
      categoria: 'bienvenida',
      cuerpo: 'Hola {nombre}, gracias por contactar a Techos y Cubiertas. Con gusto te ayudamos con tu proyecto. Para brindarte una cotización, ¿podrías compartirnos las medidas, ubicación y algunas fotografías del área a cubrir? 📐🏗️',
      esSistema: true,
    },
  ]

  for (const p of plantillas) {
    await prisma.plantilla.create({ data: p })
  }

  console.log('✅ Seed completado exitosamente.')
  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('  🔐 CREDENCIALES DE ACCESO')
  console.log('═══════════════════════════════════════════')
  console.log('  ADMIN:')
  console.log('    Correo:     admin@techosycubiertas.mx')
  console.log('    Contraseña: Admin2024!')
  console.log('')
  console.log('  VENDEDOR 1 (María):')
  console.log('    Correo:     maria@techosycubiertas.mx')
  console.log('    Contraseña: Vendedor123!')
  console.log('')
  console.log('  VENDEDOR 2 (Carlos):')
  console.log('    Correo:     carlos@techosycubiertas.mx')
  console.log('    Contraseña: Vendedor123!')
  console.log('═══════════════════════════════════════════')
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
