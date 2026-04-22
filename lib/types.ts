export interface User {
  id: string
  email: string
  name: string
  password: string
  role: 'patient' | 'admin'
  isVerified: boolean
  verificationToken?: string
  createdAt: Date
}

export interface Certificate {
  id: string
  patientId: string
  patientName: string
  patientEmail: string
  certificateType: string
  issuedBy: string
  issueDate: Date
  expiryDate?: Date
  description: string
  fileUrl?: string
  blockchainHash?: string
  transactionId?: string
  status: 'pending' | 'verified' | 'revoked'
  createdAt: Date
}

export interface VerificationResult {
  isValid: boolean
  certificate?: Certificate
  blockchainData?: {
    hash: string
    transactionId: string
    timestamp: number
    blockNumber: number
  }
  message: string
}

export interface SessionData {
  userId: string
  email: string
  name: string
  role: 'patient' | 'admin'
}
