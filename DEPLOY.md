# 🚀 JM CONSULTING - Guía de Deploy Rápido

Sigue estos pasos en orden y tendrás tu app online en 10 minutos.

---

## Paso 1: GitHub (2 min)

### Opción A: Con GitHub CLI (recomendado)
```bash
cd /home/z/my-project
gh auth login
gh repo create jm-consulting --public --source=. --push
```

### Opción B: Manual
1. Ve a https://github.com/new
2. Crea repo llamado `jm-consulting` (público o privado)
3. En tu terminal:
```bash
cd /home/z/my-project
git remote add origin https://github.com/TU_USUARIO/jm-consulting.git
git push -u origin master
```

---

## Paso 2: Supabase (3 min)

1. **Crear proyecto**: https://supabase.com/dashboard/projects/new
   - Nombre: `jm-consulting`
   - Región: más cercana a ti
   - Password: genera una segura (guárdala)

2. **Esperar** ~2 minutos mientras se crea

3. **Obtener credenciales**: 
   - Ve a **Settings → Database**
   - Copia estos dos valores:

   | Tipo | Puerto | Variable |
   |------|--------|----------|
   | Session pooler | 6543 | `DATABASE_URL` |
   | Direct connection | 5432 | `DIRECT_URL` |

---

## Paso 3: Vercel (3 min)

1. **Importar proyecto**: https://vercel.com/new
   - Conecta tu GitHub
   - Selecciona el repo `jm-consulting`

2. **Añadir variables de entorno** (Environment Variables):
   ```
   DATABASE_URL = postgresql://postgres.[REF]:[PASS]@...pooler.supabase.com:6543/postgres
   DIRECT_URL = postgresql://postgres.[REF]:[PASS]@...pooler.supabase.com:5432/postgres
   ```

3. **Deploy** → Tu app estará lista en ~2 min

---

## Paso 4: Inicializar Base de Datos

**Opción A: Desde Vercel**
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Verifica que DATABASE_URL y DIRECT_URL estén correctas
4. Deployments → Redeploy

**Opción B: Desde tu terminal local**
```bash
cd /home/z/my-project

# Actualiza .env con tus credenciales de Supabase
# Luego:
npx prisma generate
npx prisma db push
```

---

## ✅ ¡Listo!

Tu app estará disponible en:
- `https://jm-consulting.vercel.app` (o similar)

Los datos se sincronizan automáticamente entre dispositivos vía Supabase.

---

## 🔧 Comandos útiles

```bash
# Desarrollo local
bun run dev

# Ver datos en Prisma Studio
npx prisma studio

# Actualizar base de datos
npx prisma db push

# Regenerar cliente
npx prisma generate
```
