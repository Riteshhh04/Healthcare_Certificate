import { NextRequest, NextResponse } from 'next/server'
import { certificateStore } from '@/lib/db'
import { blockchainService } from '@/lib/blockchain'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hash, certificateId } = body

    if (!hash && !certificateId) {
      return NextResponse.json(
        { error: 'Certificate hash or ID is required' },
        { status: 400 }
      )
    }

    let certificate = null
    let searchHash = hash

    // First, try to find by certificate ID
    if (certificateId) {
      certificate = certificateStore.getById(certificateId)
      if (certificate) {
        searchHash = certificate.blockchainHash
      }
    } 
    // Then try to find by blockchain hash
    else if (hash) {
      certificate = certificateStore.getByHash(hash)
      
      // If not found by hash, also try as certificate ID (in case user entered wrong format)
      if (!certificate && hash.includes('-')) {
        certificate = certificateStore.getById(hash)
      }
    }

    // If no certificate found in database, return not found
    if (!certificate) {
      return NextResponse.json({
        isValid: false,
        message: 'Certificate not found in database. Please check the hash or ID and try again.',
      })
    }

    // Certificate found in database - this is the source of truth
    // Try to verify on blockchain (if available), but database is authoritative
    let blockchainResult = null
    try {
      blockchainResult = await blockchainService.verifyCertificate(searchHash || certificate.blockchainHash || '')
    } catch {
      // Blockchain verification failed, but we still have database record
    }

    // Return valid result since certificate exists in our database
    return NextResponse.json({
      isValid: true,
      certificate: {
        id: certificate.id,
        patientName: certificate.patientName,
        certificateType: certificate.certificateType,
        issuedBy: certificate.issuedBy,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        description: certificate.description,
        status: certificate.status,
      },
      blockchain: {
        hash: certificate.blockchainHash,
        transactionId: certificate.transactionId || blockchainResult?.transaction?.transactionId,
        blockNumber: blockchainResult?.transaction?.blockNumber,
        timestamp: blockchainResult?.transaction?.timestamp || certificate.createdAt,
        verified: blockchainResult?.isValid || false,
      },
      message: blockchainResult?.isValid 
        ? 'Certificate is valid and verified on blockchain' 
        : 'Certificate is valid (verified in database)',
    })
  } catch {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
