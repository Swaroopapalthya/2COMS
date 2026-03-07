const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function verify() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@2coms.com' } })
  if (!admin) {
    console.log('Admin not found')
    return
  }
  
  const matches = await bcrypt.compare('admin123', admin.password)
  console.log('Password "admin123" matches DB hash:', matches)
  
  const client = await prisma.user.findUnique({ where: { email: 'client@acme.com' } })
  if (client) {
    const matchesClient = await bcrypt.compare('client123', client.password)
    console.log('Password "client123" matches DB hash:', matchesClient)
  }
}

verify().catch(console.error).finally(() => prisma.$disconnect())
