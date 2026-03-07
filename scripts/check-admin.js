const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@2coms.com' }
    })
    if (!user) {
      console.log('❌ User admin@2coms.com not found')
    } else {
      console.log('✅ User found')
      console.log('ID:', user.id)
      console.log('Email:', user.email)
      console.log('Role:', user.role)
      console.log('Password Hash starts with:', user.password.substring(0, 10))
    }
  } catch (err) {
    console.error('❌ Error checking user:', err)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
