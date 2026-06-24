# CRM Techos y Cubiertas — Guía de despliegue

## Stack
- **Frontend/Backend**: Next.js 14 App Router + TypeScript
- **Base de datos**: Neon Postgres (serverless)
- **Auth**: NextAuth v5 con JWT
- **IA**: Anthropic claude-sonnet-4-6 (opcional)
- **Despliegue**: Vercel

---

## 1. Preparar base de datos en Neon

1. Entra a [neon.tech](https://neon.tech) y crea un proyecto
2. Copia la **Connection string** (formato: `postgresql://...`)
3. Guárdala — la necesitas en el siguiente paso

---

## 2. Variables de entorno

Crea un archivo `.env.local` (local) o agrégalas en Vercel:

```
# Base de datos (Neon)
DATABASE_URL="postgresql://usuario:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Auth (genera con: openssl rand -base64 32)
NEXTAUTH_SECRET="tu-secreto-super-seguro-aqui"
NEXTAUTH_URL="https://tu-dominio.vercel.app"

# IA (opcional — sin esto el CRM funciona con plantillas locales)
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## 3. Instalar dependencias

```bash
cd crm-techos
npm install
```

---

## 4. Inicializar base de datos

```bash
# Generar cliente Prisma
npx prisma generate

# Crear tablas en Neon
npx prisma db push

# Cargar datos iniciales (usuarios + 12 clientes de ejemplo)
npx prisma db seed
```

Usuarios creados por el seed:
| Correo | Contraseña | Rol |
|--------|-----------|-----|
| admin@techosycubiertas.mx | Admin2024! | ADMIN |
| maria@techosycubiertas.mx | Vendedor123! | VENDEDOR |
| carlos@techosycubiertas.mx | Vendedor123! | VENDEDOR |

---

## 5. Probar localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e inicia sesión con cualquier usuario del seed.

---

## 6. Desplegar en Vercel

### Opción A — Desde GitHub (recomendado)
1. Sube el proyecto a GitHub
2. En [vercel.com](https://vercel.com) → "Import Project" → selecciona el repo
3. Agrega las variables de entorno en la sección "Environment Variables"
4. Haz clic en "Deploy"

### Opción B — Desde CLI
```bash
npm install -g vercel
vercel
# Sigue las instrucciones del wizard
```

### Post-deploy en Vercel
Después del primer deploy:
1. Ve a **Settings → Environment Variables** en tu proyecto de Vercel
2. Asegúrate de que `NEXTAUTH_URL` tenga tu URL de Vercel (ej. `https://crm-techos.vercel.app`)
3. Ejecuta el seed en Neon directamente si no lo hiciste localmente:
   ```bash
   DATABASE_URL="tu-connection-string" npx prisma db seed
   ```

---

## 7. Personalizar para producción

### Cambiar datos del negocio
Edita estos archivos con los datos reales:
- `src/app/landing/LandingCliente.tsx` — número de WhatsApp real
- `src/app/agenda/[slug]/AgendaPublica.tsx` — número de WhatsApp real
- `src/app/layout.tsx` — metadatos (título, descripción, OG)
- `public/manifest.json` — nombre de la app en PWA

### Cambiar el número de WhatsApp
Busca `7712345678` en el proyecto y reemplaza por el número real del negocio.

### Agregar Google Analytics (opcional)
Agrega tu `GA_MEASUREMENT_ID` en `.env` y descomenta el script en `layout.tsx`.

---

## 8. Dominio personalizado

En Vercel → Settings → Domains, agrega tu dominio:
- Ejemplo: `crm.techosycubiertas.mx`
- Actualiza `NEXTAUTH_URL` con el dominio final

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/           # Endpoints REST
│   ├── dashboard/     # Tablero principal
│   ├── clientes/      # Lista + expediente
│   ├── embudo/        # Kanban drag & drop
│   ├── seguimiento/   # "Hoy te toca"
│   ├── agenda/        # Calendario + agenda pública
│   ├── pagos/         # Gestión de cobros
│   ├── asistente/     # Chat IA
│   ├── admin/         # Panel de administración
│   ├── landing/       # Landing pública de captación
│   └── login/         # Autenticación
├── components/        # Componentes React
├── lib/               # Utilidades compartidas
└── middleware.ts      # Protección de rutas
```

---

## Roles del sistema

| Rol | Qué puede hacer |
|-----|----------------|
| `ADMIN` | Todo — usuarios, reportes, exportar, papelera |
| `VENDEDOR` | Sus propios clientes, citas, pagos |
| `SOLO_LECTURA` | Solo consultar, no modificar |

---

## Soporte técnico

Para dudas sobre el código, revisa:
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de NextAuth v5](https://authjs.dev)
- [Documentación de Neon](https://neon.tech/docs)
