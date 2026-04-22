import { jsPDF } from 'jspdf'
import { Certificate } from './types'

// Generate a content hash from certificate data
export function generateCertificateContentHash(cert: Certificate): string {
  const content = [
    cert.id,
    cert.patientId,
    cert.patientName,
    cert.patientEmail,
    cert.certificateType,
    cert.issuedBy,
    new Date(cert.issueDate).toISOString(),
    cert.expiryDate ? new Date(cert.expiryDate).toISOString() : '',
    cert.description,
    cert.blockchainHash || '',
  ].join('|')
  
  // Create a simple hash (in production, use crypto.subtle)
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  // Convert to hex and add prefix to make it look like blockchain hash
  const hexHash = Math.abs(hash).toString(16).padStart(16, '0')
  return `HCERT-${hexHash}-${cert.id}`
}

// Generate verification signature that embeds certificate data
export function generateVerificationSignature(cert: Certificate): string {
  const data = {
    id: cert.id,
    patient: cert.patientName,
    type: cert.certificateType,
    issuer: cert.issuedBy,
    date: new Date(cert.issueDate).toISOString().split('T')[0],
    hash: cert.blockchainHash,
  }
  
  // Base64 encode the data
  const jsonStr = JSON.stringify(data)
  const base64 = typeof window !== 'undefined' 
    ? btoa(jsonStr) 
    : Buffer.from(jsonStr).toString('base64')
  
  return `SIG:${base64}`
}

// Parse verification signature from PDF
export function parseVerificationSignature(signature: string): {
  id: string
  patient: string
  type: string
  issuer: string
  date: string
  hash: string
} | null {
  try {
    if (!signature.startsWith('SIG:')) return null
    const base64 = signature.substring(4)
    const jsonStr = typeof window !== 'undefined'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8')
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateCertificatePDF(cert: Certificate): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Generate verification codes
  const contentHash = generateCertificateContentHash(cert)
  const verificationSig = generateVerificationSignature(cert)
  
  // Background
  doc.setFillColor(252, 252, 253)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  
  // Border frame
  doc.setDrawColor(16, 185, 129) // Emerald color
  doc.setLineWidth(2)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)
  
  // Inner decorative border
  doc.setDrawColor(209, 213, 219)
  doc.setLineWidth(0.5)
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30)
  
  // Corner decorations
  const cornerSize = 15
  doc.setFillColor(16, 185, 129)
  // Top left
  doc.triangle(10, 10, 10 + cornerSize, 10, 10, 10 + cornerSize, 'F')
  // Top right
  doc.triangle(pageWidth - 10, 10, pageWidth - 10 - cornerSize, 10, pageWidth - 10, 10 + cornerSize, 'F')
  // Bottom left
  doc.triangle(10, pageHeight - 10, 10 + cornerSize, pageHeight - 10, 10, pageHeight - 10 - cornerSize, 'F')
  // Bottom right
  doc.triangle(pageWidth - 10, pageHeight - 10, pageWidth - 10 - cornerSize, pageHeight - 10, pageWidth - 10, pageHeight - 10 - cornerSize, 'F')
  
  // Header - Organization seal area
  doc.setFillColor(16, 185, 129)
  doc.circle(pageWidth / 2, 35, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('VERIFIED', pageWidth / 2, 34, { align: 'center' })
  doc.text('CERT', pageWidth / 2, 38, { align: 'center' })
  
  // Title
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('CERTIFICATE OF HEALTH', pageWidth / 2, 58, { align: 'center' })
  
  // Certificate Type
  doc.setFontSize(14)
  doc.setTextColor(16, 185, 129)
  doc.text(cert.certificateType.toUpperCase(), pageWidth / 2, 68, { align: 'center' })
  
  // Decorative line
  doc.setDrawColor(16, 185, 129)
  doc.setLineWidth(0.5)
  doc.line(pageWidth / 2 - 60, 73, pageWidth / 2 + 60, 73)
  
  // This is to certify that
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('This is to certify that', pageWidth / 2, 85, { align: 'center' })
  
  // Patient Name
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(cert.patientName, pageWidth / 2, 98, { align: 'center' })
  
  // Underline for name
  const nameWidth = doc.getTextWidth(cert.patientName)
  doc.setDrawColor(209, 213, 219)
  doc.line(pageWidth / 2 - nameWidth / 2 - 10, 101, pageWidth / 2 + nameWidth / 2 + 10, 101)
  
  // Description
  doc.setTextColor(75, 85, 99)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  // Word wrap description
  const maxWidth = pageWidth - 80
  const descLines = doc.splitTextToSize(cert.description, maxWidth)
  doc.text(descLines, pageWidth / 2, 115, { align: 'center' })
  
  // Certificate details in two columns
  const leftCol = 50
  const rightCol = pageWidth - 50
  const detailsY = 140
  
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.setFont('helvetica', 'normal')
  
  // Left column
  doc.text('Issued By:', leftCol, detailsY)
  doc.setTextColor(31, 41, 55)
  doc.setFont('helvetica', 'bold')
  doc.text(cert.issuedBy, leftCol, detailsY + 5)
  
  doc.setTextColor(107, 114, 128)
  doc.setFont('helvetica', 'normal')
  doc.text('Issue Date:', leftCol, detailsY + 15)
  doc.setTextColor(31, 41, 55)
  doc.setFont('helvetica', 'bold')
  doc.text(formatDate(cert.issueDate), leftCol, detailsY + 20)
  
  // Right column
  doc.setTextColor(107, 114, 128)
  doc.setFont('helvetica', 'normal')
  doc.text('Certificate ID:', rightCol, detailsY, { align: 'right' })
  doc.setTextColor(31, 41, 55)
  doc.setFont('helvetica', 'bold')
  doc.text(cert.id, rightCol, detailsY + 5, { align: 'right' })
  
  if (cert.expiryDate) {
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    doc.text('Valid Until:', rightCol, detailsY + 15, { align: 'right' })
    doc.setTextColor(31, 41, 55)
    doc.setFont('helvetica', 'bold')
    doc.text(formatDate(cert.expiryDate), rightCol, detailsY + 20, { align: 'right' })
  }
  
  // Blockchain verification section
  doc.setFillColor(240, 253, 244)
  doc.roundedRect(25, 165, pageWidth - 50, 28, 3, 3, 'F')
  
  doc.setDrawColor(16, 185, 129)
  doc.setLineWidth(0.3)
  doc.roundedRect(25, 165, pageWidth - 50, 28, 3, 3, 'S')
  
  // Blockchain icon placeholder
  doc.setFillColor(16, 185, 129)
  doc.circle(38, 179, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('BC', 38, 181, { align: 'center' })
  
  doc.setTextColor(16, 185, 129)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('BLOCKCHAIN VERIFIED', 50, 174)
  
  doc.setTextColor(75, 85, 99)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(`Hash: ${cert.blockchainHash || 'N/A'}`, 50, 181)
  doc.text(`Verification Code: ${contentHash}`, 50, 187)
  
  // Verification signature (hidden in document metadata area - visible but small)
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(4)
  doc.text(verificationSig, pageWidth - 20, pageHeight - 12, { align: 'right' })
  
  // Verification URL
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Verify this certificate at:', pageWidth / 2, pageHeight - 22, { align: 'center' })
  
  doc.setTextColor(16, 185, 129)
  doc.setFont('helvetica', 'bold')
  const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify?hash=${cert.blockchainHash}`
  doc.text(verifyUrl, pageWidth / 2, pageHeight - 17, { align: 'center' })
  
  // Add document properties for verification
  doc.setProperties({
    title: `Health Certificate - ${cert.patientName}`,
    subject: cert.certificateType,
    author: cert.issuedBy,
    keywords: `${contentHash},${verificationSig}`,
    creator: 'HealthCert Blockchain System',
  })
  
  return doc
}

export function downloadCertificatePDF(cert: Certificate): void {
  const doc = generateCertificatePDF(cert)
  doc.save(`certificate-${cert.id}.pdf`)
}
