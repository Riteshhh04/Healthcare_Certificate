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

    if (certificateId) {
      certificate = certificateStore.getById(certificateId)
      if (certificate) {
        searchHash = certificate.blockchainHash
      }
    } else if (hash) {
      certificate = certificateStore.getByHash(hash)
    }

    if (!searchHash) {
      return NextResponse.json({
        isValid: false,
        message: 'Certificate not found in database',
      })
    }

    // Verify on blockchain
    const blockchainResult = await blockchainService.verifyCertificate(searchHash)

    if (blockchainResult.isValid && certificate) {
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
          hash: searchHash,
          transactionId: blockchainResult.transaction?.transactionId,
          blockNumber: blockchainResult.transaction?.blockNumber,
          timestamp: blockchainResult.transaction?.timestamp,
        },
        message: 'Certificate is valid and verified on blockchain',
      })
    }

    return NextResponse.json({
      isValid: false,
      message: blockchainResult.message || 'Certificate verification failed',
    })
  } catch {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
