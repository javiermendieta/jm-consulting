import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear categorías de cashflow
  const ingreso = await prisma.cashflowCategoria.upsert({
    where: { id: 'cat-ingreso' },
    update: {},
    create: {
      id: 'cat-ingreso',
      nombre: 'INGRESOS',
      tipo: 'ingreso',
      orden: 0
    }
  })

  const egreso = await prisma.cashflowCategoria.upsert({
    where: { id: 'cat-egreso' },
    update: {},
    create: {
      id: 'cat-egreso',
      nombre: 'EGRESOS',
      tipo: 'egreso',
      orden: 1
    }
  })

  console.log('Categorías creadas:', { ingreso, egreso })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
