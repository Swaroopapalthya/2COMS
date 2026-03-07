const { SignJWT } = require('jose')
require('dotenv').config()

async function testSign() {
  const secret = process.env.JWT_SECRET || 'your-fallback-secret-at-least-thirty-two-characters'
  const key = new TextEncoder().encode(secret)
  
  const payload = {
    userId: "cmmfyno700000tt2ktwpj5p30",
    email: "admin@2coms.com",
    role: "ACCOUNT_MANAGER",
    clientId: null
  }
  
  try {
    console.log('--- JWT SIGNING TEST ---')
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(key)
    console.log('✅ JWT signed successfully!')
    console.log('Token starts with:', token.substring(0, 10))
  } catch (err) {
    console.error('❌ JWT signing failed!')
    console.error(err)
  }
}

testSign()
