#!/bin/bash

# JM CONSULTING - Script de Build para Vercel
# Este script se ejecuta automáticamente durante el deploy

echo "🚀 Building JM CONSULTING..."

# Generar cliente Prisma
echo "📦 Generating Prisma Client..."
npx prisma generate

# Construir Next.js
echo "🔨 Building Next.js..."
next build

echo "✅ Build complete!"
