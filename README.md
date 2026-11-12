# Grocery Tracker

## 📌 Objetivo del proyecto
Este proyecto fue desarrollado como un **experimento de prompting y desarrollo asistido con IA** (ChatGPT y v0) para crear una **aplicación web que permita llevar un registro de los ítems en casa**, como alimentos, productos de limpieza y otros insumos.

La idea es:
- Practicar **desarrollo web full-stack** con **Next.js, Supabase y React**.
- Probar cómo la **IA puede asistir en el desarrollo** de aplicaciones reales.
- Obtener una herramienta útil para **gestionar inventario doméstico**.

---

## 🚀 Requerimientos para usarlo

### ✅ Prerrequisitos
- Tener instalado **Node.js (>=18)** y **npm** o **yarn**.
- Tener una cuenta en **Supabase** y configurar un proyecto.

### 📦 Dependencias principales
- **Next.js**
- **React**
- **Supabase JS SDK**
- **Supabase Auth** con proveedor **Google** (login)
- **shadcn/ui** (para los componentes de la UI)

Instalación de dependencias:

```bash
npm install
# o
yarn install
```

---

## 🗄️ Base de datos: local (desarrollo) y producción

En desarrollo se usa una **DB local** levantada con el Supabase CLI (Postgres + Auth + Studio en Docker).
El esquema vive en [`supabase/migrations/`](supabase/migrations/) y los datos de prueba en [`supabase/seed.sql`](supabase/seed.sql).

| Entorno | Archivo de env | Usado por |
|---|---|---|
| Local | `.env.development.local` (ver `.env.development.local.example`) | `npm run dev` |
| Producción | `.env.local` / variables en el hosting | `npm run build` / `npm start` |
| Google OAuth local | `supabase/.env` (ver `supabase/.env.example`) | `npm run db:start` |
| Migraciones a prod | `.env.supabase` (ver `.env.supabase.example`) | `npm run db:*:prod` |

### Setup (una sola vez)
1. Requiere Docker en ejecución.
2. `npm run db:start` — levanta el stack y aplica migraciones + seed. La access key local es `GROCERY-LOCALDEV`.
3. Copiar `.env.development.local.example` a `.env.development.local` (ya trae URL y key locales).
4. Login con Google: completar `supabase/.env` con el Client ID/Secret de Google y en Google Cloud Console
   agregar `http://127.0.0.1:54321/auth/v1/callback` como *Authorized redirect URI*. Luego `npm run db:stop && npm run db:start`.
5. Prod ya tenía el esquema: marcar la migración inicial como aplicada (una sola vez):
   `scripts/db.sh prod repair --status applied 20250101000000`

### Uso diario
```bash
npm run db:start     # levantar DB local (http://127.0.0.1:54321, Studio en :54323)
npm run dev          # la app apunta a la DB local
npm run db:reset     # borrar todo y re-aplicar migraciones + seed
npm run db:stop      # apagar (los datos se conservan)
```

### Cambios de esquema
```bash
npm run db:new nombre_del_cambio   # crea supabase/migrations/<timestamp>_nombre_del_cambio.sql
npm run db:reset                   # probar en local
npm run db:push:prod               # aplicar en prod
npm run db:status:prod             # ver qué migraciones están aplicadas en prod
```

---
✍️ Incluso este README fue redactado por una herramienta de IA (ChatGPT).