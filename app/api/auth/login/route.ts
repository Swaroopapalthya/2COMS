import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'next-server.log')

function fileLog(msg: string) {
  const time = new Date().toISOString()
  try {
    fs.appendFileSync(LOG_FILE, `[${time}] [DUMMY] ${msg}\n`)
  } catch(e) {}
}

export async function POST(request: NextRequest) {
  try {
    fileLog('--- DUMMY LOGIN POST REACHED ---')
    const body = await request.json()
    fileLog(`Dummy Body Email: ${body?.email}`)
    
    return NextResponse.json({
      token: 'dummy-token',
      user: {
        id: 'dummy-id',
        email: body.email,
        name: 'Dummy User',
        role: 'ACCOUNT_MANAGER',
      }
    })
  } catch (e: any) {
    fileLog(`--- DUMMY LOGIN POST ERR --- ${e.message}`)
    console.error('--- DUMMY LOGIN POST ERR ---', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  fileLog('GET dummy reached')
  return NextResponse.json({ status: 'ok' })
}
