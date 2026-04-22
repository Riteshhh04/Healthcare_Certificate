import { NextRequest, NextResponse } from 'next/server'
import { userStore, tokenStore } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find user by token
    const userId = tokenStore.get(token)
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Update user
    const user = userStore.update(userId, { isVerified: true, verificationToken: undefined })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete used token
    tokenStore.delete(token)

    return NextResponse.json({
      message: 'Email verified successfully. You can now log in.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
