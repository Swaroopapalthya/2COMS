const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function testConnection() {
  console.log('--- DB CONNECTION TEST ---')
  console.log('URL:', process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':****@')) // Log partially masked URL
  
  try {
    const start = Date.now()
    const usersCount = await prisma.user.count()
    console.log(`✅ Connection successful!`)
    console.log(`⏱️ Query time: ${Date.now() - start}ms`)
    console.log(`📊 Users in database: ${usersCount}`)
  } catch (err) {
    console.error('❌ Connection failed!')
    console.error('Error Details:', err)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
