const bcrypt = require('bcryptjs')

async function test() {
  console.log('Bcrypt type:', typeof bcrypt)
  console.log('Bcrypt keys:', Object.keys(bcrypt))
  const hash = await bcrypt.hash('admin123', 12)
  console.log('Hash generated successfully')
  const matches = await bcrypt.compare('admin123', hash)
  console.log('Matches:', matches)
}

test().catch(console.error)
