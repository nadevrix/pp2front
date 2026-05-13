# pollar-web — Documentación

Dashboard para comercios. Corre en el **puerto 3002**. Tiene una sola pantalla: un formulario para crear proyectos y obtener una API key.

---

## Qué hace

El comercio llena nombre y motivo del proyecto, hace click en "Create Project", y la app llama a `POST /api/projects/create` en el backend. Si tiene éxito, muestra la `api_key` generada con un botón de copiar.

Esa `api_key` es lo que el comercio necesita para inicializar el SDK en su propia app.

---

## Lo que NO hace (por ahora)

- No tiene autenticación. El `merchant_id` que se envía al backend es un `crypto.randomUUID()` generado en el momento. Esto significa que cada vez que se crea un proyecto desde esta interfaz, se genera un merchant_id diferente — no hay sesión persistente de comercio.

⚠️ TODO: Conectar con el backend de auth externo que provee `token_secret` y `token_public`. Cuando esa integración esté lista, reemplazar el `crypto.randomUUID()` en `src/app/page.tsx` por el `merchant_id` real del usuario autenticado.

---

## Variables de entorno

```bash
cp .env.example .env.local
```

`.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

Si no se define `NEXT_PUBLIC_BACKEND_URL`, la app usa `http://localhost:3000` como fallback.

---

## Levantar en local

```bash
npm install
npm run dev   # http://localhost:3002
```

El backend (`pollar-backend`) debe estar corriendo en el puerto que apunta `NEXT_PUBLIC_BACKEND_URL`.

---

## Build para producción

```bash
npm run build
npm run start   # sirve en puerto 3002
```

---

## Estructura de archivos relevantes

```
pollar-web/
├── src/
│   └── app/
│       ├── page.tsx       Único componente de la app — formulario + resultado
│       ├── layout.tsx     Layout base de Next.js
│       └── globals.css    Estilos globales (Tailwind v4)
├── .env.example
└── next.config.ts
```

`page.tsx` es un Client Component (`"use client"`). No hay API routes en este proyecto — toda la lógica de negocio está en `pollar-backend`.

---

## Flujo del formulario

```
Usuario llena "Project Name" y "Purpose / Reason"
        │
        ▼
onClick "Create Project"
        │
        ▼
POST {{NEXT_PUBLIC_BACKEND_URL}}/api/projects/create
Body: { merchant_id: randomUUID(), name, reason }
        │
        ├── success → muestra api_key + project_id
        │             "Save your API key now — it will not be shown again."
        │
        └── error   → muestra mensaje de error del backend
```

La API key no se persiste en ningún estado de la app después de cerrar la página — por eso se muestra el aviso de guardarla.
