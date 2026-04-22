import { NextRequest, NextResponse } from 'next/server'
import { userStore } from '@/lib/db'
import { decodeSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = decodeSession(sessionCookie.value)
  
  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
  
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const users = userStore.getAll()
    .filter(u => u.role === 'patient')
    .map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
    }))

  return NextResponse.json({ users })
}
