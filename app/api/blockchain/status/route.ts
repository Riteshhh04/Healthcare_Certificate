import { NextResponse } from 'next/server'
import { blockchainService } from '@/lib/blockchain'

export async function GET() {
  try {
    const status = await blockchainService.getStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('[v0] Blockchain status error:', error)
    return NextResponse.json({
      connected: false,
      network: 'Error',
      blockNumber: 0,
      contractAddress: 'Unknown',
    })
  }
}
