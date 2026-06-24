// src/lib/auditoria.ts
// Registro automático de auditoría para todas las acciones importantes

import { prisma } from './prisma'

export interface AuditoriaParams {
  usuarioId?: string
  accion: string
  tipoEntidad?: string
  entidadId?: string
  detalle: string
  datos?: object
  ip?: string
}

export async function registrarAuditoria(params: AuditoriaParams): Promise<void> {
  try {
    await prisma.registroAuditoria.create({
      data: {
        usuarioId: params.usuarioId,
        accion: params.accion,
        tipoEntidad: params.tipoEntidad,
        entidadId: params.entidadId,
        detalle: params.detalle,
        datos: params.datos ? JSON.stringify(params.datos) : null,
        ip: params.ip,
      }
    })
  } catch (error) {
    // La auditoría no debe romper el flujo principal
    console.error('[Auditoría] Error al registrar:', error)
  }
}

// Acciones comunes predefinidas
export const ACCIONES = {
  // Clientes
  CLIENTE_CREADO:    'cliente_creado',
  CLIENTE_EDITADO:   'cliente_editado',
  CLIENTE_BORRADO:   'cliente_borrado',
  CLIENTE_RESTAURADO:'cliente_restaurado',
  CLIENTE_ARCHIVADO: 'cliente_archivado',
  CLIENTE_GANADO:    'cliente_ganado',
  CLIENTE_PERDIDO:   'cliente_perdido',
  CLIENTE_REASIGNADO:'cliente_reasignado',
  ETAPA_CAMBIADA:    'etapa_cambiada',
  
  // Pagos
  PAGO_REGISTRADO:   'pago_registrado',
  PAGO_EDITADO:      'pago_editado',
  PAGO_BORRADO:      'pago_borrado',
  
  // Citas
  CITA_AGENDADA:     'cita_agendada',
  CITA_CANCELADA:    'cita_cancelada',
  
  // Usuarios
  USUARIO_CREADO:    'usuario_creado',
  USUARIO_EDITADO:   'usuario_editado',
  USUARIO_DESACTIVADO:'usuario_desactivado',
  ROL_CAMBIADO:      'rol_cambiado',
  
  // Sesión
  INICIO_SESION:     'inicio_sesion',
  CIERRE_SESION:     'cierre_sesion',
  
  // Datos
  EXPORTACION:       'exportacion',
  RESPALDO:          'respaldo',
  RESTAURACION:      'restauracion',
  PAPELERA_VACIADA:  'papelera_vaciada',
  
  // Archivos
  ARCHIVO_SUBIDO:    'archivo_subido',
  ARCHIVO_BORRADO:   'archivo_borrado',
}
