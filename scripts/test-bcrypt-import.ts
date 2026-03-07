import bcrypt from 'bcryptjs'

async function test() {
  console.log('Bcrypt object:', Object.keys(bcrypt))
  const hash = await bcrypt.hash('test', 10)
  console.log('Hash:', hash)
  const matches = await bcrypt.compare('test', hash)
  console.log('Matches:', matches)
}

test().catch(console.error)
