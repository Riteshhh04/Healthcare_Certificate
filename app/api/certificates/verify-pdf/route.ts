import { NextRequest, NextResponse } from 'next/server'
import { verifyUploadedPDF } from '@/lib/pdf-verifier'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Verify the PDF
    const result = await verifyUploadedPDF(arrayBuffer)

    return NextResponse.json(result)
  } catch (error) {
    console.error('PDF verification error:', error)
    return NextResponse.json(
      { 
        isValid: false,
        isTampered: false,
        message: 'Verification failed',
        details: ['Server error during verification'],
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
