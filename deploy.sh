#!/bin/bash

# ================================================
# JM CONSULTING - Script de Deploy Automático
# ================================================

echo "🚀 JM CONSULTING - Deploy Automático"
echo "====================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paso 1: Verificar si hay cambios pendientes
echo "📦 Verificando cambios..."
git add .
git diff --staged --quiet || git commit -m "Update - preparando para deploy"

# Paso 2: Crear repositorio GitHub
echo ""
echo "🐙 CONFIGURACIÓN DE GITHUB"
echo "---------------------------"
echo ""
echo "Opciones:"
echo "  1. Ya tengo un repositorio (dame la URL)"
echo "  2. Crear nuevo repositorio público"
echo "  3. Crear nuevo repositorio privado"
echo ""
read -p "Selecciona opción (1/2/3): " github_option

if [ "$github_option" = "1" ]; then
    read -p "URL del repositorio (ej: https://github.com/usuario/jm-consulting.git): " repo_url
    git remote remove origin 2>/dev/null
    git remote add origin "$repo_url"
    git push -u origin master --force
    echo -e "${GREEN}✓ Código subido a GitHub${NC}"
    
elif [ "$github_option" = "2" ] || [ "$github_option" = "3" ]; then
    visibility="--public"
    [ "$github_option" = "3" ] && visibility="--private"
    
    # Verificar si gh está instalado
    if command -v gh &> /dev/null; then
        echo "Creando repositorio con GitHub CLI..."
        gh repo create jm-consulting $visibility --source=. --push --description "Sistema de gestión de consultoría para restaurantes"
        echo -e "${GREEN}✓ Repositorio creado y código subido${NC}"
    else
        echo -e "${YELLOW}GitHub CLI no está instalado. Instálalo con:${NC}"
        echo "  brew install gh    # macOS"
        echo "  sudo apt install gh  # Linux"
        echo ""
        echo "O crea el repo manualmente en: https://github.com/new"
        echo "Luego ejecuta:"
        echo "  git remote add origin https://github.com/TU_USUARIO/jm-consulting.git"
        echo "  git push -u origin master"
    fi
fi

# Paso 3: Configurar Supabase
echo ""
echo "🗄️ CONFIGURACIÓN DE SUPABASE"
echo "-----------------------------"
echo ""
echo "1. Ve a: https://supabase.com/dashboard/projects/new"
echo "2. Crea un proyecto nuevo (ej: jm-consulting)"
echo "3. Ve a Settings → Database"
echo "4. Copia las connection strings"
echo ""
read -p "DATABASE_URL (Session pooler - puerto 6543): " db_url
read -p "DIRECT_URL (Direct connection - puerto 5432): " direct_url

if [ -n "$db_url" ] && [ -n "$direct_url" ]; then
    # Guardar en .env
    cat > .env << EOF
DATABASE_URL="$db_url"
DIRECT_URL="$direct_url"
EOF
    
    # Actualizar schema para PostgreSQL
    cat prisma/schema.production.prisma > prisma/schema.prisma
    
    echo -e "${GREEN}✓ Credenciales guardadas en .env${NC}"
    
    # Generar cliente Prisma
    echo "Generando cliente Prisma..."
    npx prisma generate
    
    # Crear tablas
    echo "Creando tablas en Supabase..."
    npx prisma db push
    
    echo -e "${GREEN}✓ Base de datos configurada${NC}"
fi

# Paso 4: Deploy en Vercel
echo ""
echo "▲ DEPLOY EN VERCEL"
echo "-------------------"
echo ""
echo "1. Ve a: https://vercel.com/new"
echo "2. Importa tu repositorio de GitHub"
echo "3. Añade las variables de entorno:"
echo "   - DATABASE_URL: $db_url"
echo "   - DIRECT_URL: $direct_url"
echo "4. Click en Deploy"
echo ""
echo -e "${GREEN}🎉 ¡Listo! Tu app estará disponible en minutos${NC}"
echo ""
echo "📱 URL de tu app: https://jm-consulting.vercel.app (o similar)"
