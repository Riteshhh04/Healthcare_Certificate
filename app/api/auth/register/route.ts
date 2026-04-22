import { NextRequest, NextResponse } from 'next/server'
import { userStore, tokenStore } from '@/lib/db'
import { generateVerificationToken, generateId } from '@/lib/session'
import { User } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = userStore.getByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Generate verification token
    const verificationToken = generateVerificationToken()

    // Create new user
    const newUser: User = {
      id: generateId('patient'),
      email: email.toLowerCase(),
      name,
      password, // In production, hash this with bcrypt
      role: 'patient',
      isVerified: false,
      verificationToken,
      createdAt: new Date(),
    }

    userStore.create(newUser)
    tokenStore.create(verificationToken, newUser.id)

    // In production, send verification email via Nodemailer
    // For demo, we'll auto-verify after a delay
    console.log(`Verification link: /verify?token=${verificationToken}`)

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      verificationToken, // Only for demo - remove in production
    })
  } catch {
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
