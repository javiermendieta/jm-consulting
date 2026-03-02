# JM CONSULTING

Sistema de gestión de consultoría para restaurantes con módulos de Consultoría, Forecast, P&L y Comparativos.

## 🚀 Deployment en Vercel + Supabase

### Paso 1: Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a **Settings > Database**
4. Copia las connection strings:
   - **Session pooler** (puerto 6543) → para `DATABASE_URL`
   - **Direct connection** (puerto 5432) → para `DIRECT_URL`

### Paso 2: Crear repositorio en GitHub

```bash
# Inicializar Git
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "Initial commit - JM CONSULTING"

# Crear repo en GitHub y subir
gh repo create jm-consulting --private --source=. --push
# O si ya tienes el repo creado:
git remote add origin https://github.com/TU_USUARIO/jm-consulting.git
git push -u origin main
```

### Paso 3: Deploy en Vercel

1. Ve a [vercel.com](https://vercel.com) y conecta tu cuenta de GitHub
2. Importa el repositorio `jm-consulting`
3. Configura las variables de entorno:
   - `DATABASE_URL`: Connection string Session pooler de Supabase
   - `DIRECT_URL`: Connection string Direct de Supabase

4. Deploy!

### Paso 4: Inicializar la base de datos

Después del deploy, ejecuta los comandos de Prisma para crear las tablas:

```bash
# Generar cliente Prisma
npx prisma generate

# Crear tablas en Supabase
npx prisma db push
```

O usa la consola de Vercel para ejecutar:
```
npx prisma db push
```

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
bun install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# Generar cliente Prisma
npx prisma generate

# Crear tablas
npx prisma db push

# Iniciar servidor de desarrollo
bun run dev
```

## 📦 Módulos

- **Dashboard** - KPIs y vista general
- **Consultoría** - Gestión de proyectos con timeline y entregables
- **Forecast** - Proyección de ventas jerárquica
- **P&L** - Estado de resultados editable
- **Comparativos** - Análisis cruzado con filtros
- **Configuración** - Parámetros del sistema

## 🔧 Tecnologías

- Next.js 15 + TypeScript
- Prisma + PostgreSQL (Supabase)
- Zustand (estado)
- Tailwind CSS
- Lucide React

---

© 2024 JM Consulting
