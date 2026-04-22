import { NextRequest, NextResponse } from 'next/server'
import { certificateStore, userStore } from '@/lib/db'
import { blockchainService } from '@/lib/blockchain'
import { decodeSession, generateId } from '@/lib/session'
import { Certificate } from '@/lib/types'

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = decodeSession(sessionCookie.value)
  
  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  let certificates: Certificate[]

  if (session.role === 'admin') {
    certificates = certificateStore.getAll()
  } else {
    certificates = certificateStore.getByPatientId(session.userId)
  }

  return NextResponse.json({ certificates })
}

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = decodeSession(sessionCookie.value)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { 
      patientId, 
      certificateType, 
      issuedBy, 
      issueDate, 
      expiryDate, 
      description,
      walletAddress,
      walletSignature,
      walletTransactionHash,
    } = body

    if (!patientId || !certificateType || !issuedBy || !issueDate || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Require wallet signature for certificate issuance
    if (!walletSignature || !walletAddress) {
      return NextResponse.json(
        { error: 'MetaMask wallet signature is required to issue certificates' },
        { status: 400 }
      )
    }

    // Get patient details
    const patient = userStore.getById(patientId)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const certId = generateId('cert')

    // Store on blockchain
    const blockchainResult = await blockchainService.storeCertificate({
      certificateId: certId,
      patientId,
      certificateType,
      issuedBy,
      issueDate: new Date(issueDate),
    })

    const certificate: Certificate = {
      id: certId,
      patientId,
      patientName: patient.name,
      patientEmail: patient.email,
      certificateType,
      issuedBy,
      issueDate: new Date(issueDate),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      description,
      blockchainHash: blockchainResult.hash,
      transactionId: walletTransactionHash || blockchainResult.transactionId,
      status: 'verified',
      createdAt: new Date(),
    }

    certificateStore.create(certificate)

    return NextResponse.json({
      message: 'Certificate created and stored on blockchain',
      certificate,
      blockchain: {
        ...blockchainResult,
        walletAddress,
        walletTransactionHash,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create certificate' },
      { status: 500 }
    )
  }
}
