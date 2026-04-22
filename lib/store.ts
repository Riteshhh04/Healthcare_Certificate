import { User, Certificate } from './types'

// In-memory store (simulating MongoDB)
// In production, this would be replaced with actual MongoDB operations

const users: Map<string, User> = new Map()
const certificates: Map<string, Certificate> = new Map()
const verificationTokens: Map<string, string> = new Map() // token -> userId

// Initialize with admin user
const adminUser: User = {
  id: 'admin-001',
  email: 'admin@healthcare.com',
  name: 'System Administrator',
  password: 'admin123', // In production, this would be hashed
  role: 'admin',
  isVerified: true,
  createdAt: new Date(),
}
users.set(adminUser.id, adminUser)

// Sample patients for demo
const samplePatients: User[] = [
  {
    id: 'patient-001',
    email: 'john.doe@email.com',
    name: 'John Doe',
    password: 'password123',
    role: 'patient',
    isVerified: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'patient-002',
    email: 'jane.smith@email.com',
    name: 'Jane Smith',
    password: 'password123',
    role: 'patient',
    isVerified: true,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 'patient-003',
    email: 'mike.johnson@email.com',
    name: 'Mike Johnson',
    password: 'password123',
    role: 'patient',
    isVerified: false,
    createdAt: new Date('2024-03-10'),
  },
]

samplePatients.forEach((p) => users.set(p.id, p))

// Sample certificates with diverse types for testing
const sampleCertificates: Certificate[] = [
  {
    id: 'cert-001',
    patientId: 'patient-001',
    patientName: 'John Doe',
    patientEmail: 'john.doe@email.com',
    certificateType: 'COVID-19 Vaccination',
    issuedBy: 'City General Hospital',
    issueDate: new Date('2024-01-20'),
    description: 'Full vaccination course completed - Pfizer-BioNTech. Two doses administered as per WHO guidelines.',
    blockchainHash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    transactionId: '0xabc123def456789abc123def456789abc123def456789',
    status: 'verified',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'cert-002',
    patientId: 'patient-001',
    patientName: 'John Doe',
    patientEmail: 'john.doe@email.com',
    certificateType: 'Medical Fitness Certificate',
    issuedBy: 'HealthCare Plus Clinic',
    issueDate: new Date('2024-02-15'),
    expiryDate: new Date('2025-02-15'),
    description: 'Annual medical fitness examination - All parameters normal. Fit for employment and travel purposes.',
    blockchainHash: '0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    transactionId: '0xdef789ghi012345def789ghi012345def789ghi012345',
    status: 'verified',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'cert-003',
    patientId: 'patient-002',
    patientName: 'Jane Smith',
    patientEmail: 'jane.smith@email.com',
    certificateType: 'Blood Donation Certificate',
    issuedBy: 'Red Cross Blood Bank',
    issueDate: new Date('2024-03-01'),
    description: 'Voluntary blood donation - Type O+. 450ml whole blood collected successfully.',
    blockchainHash: '0x3fdba35f04dc8c462986c992bcf875546257113072a909c162f7e470e581e278',
    transactionId: '0xghi345jkl678901ghi345jkl678901ghi345jkl678901',
    status: 'verified',
    createdAt: new Date('2024-03-01'),
  },
  {
    id: 'cert-004',
    patientId: 'patient-001',
    patientName: 'John Doe',
    patientEmail: 'john.doe@email.com',
    certificateType: 'Hepatitis B Vaccination',
    issuedBy: 'Metro Health Center',
    issueDate: new Date('2024-04-10'),
    description: 'Hepatitis B vaccination series completed. Three-dose regimen administered over 6 months.',
    blockchainHash: '0x4a5c6d7e8f90a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
    transactionId: '0xjkl901mno234567jkl901mno234567jkl901mno234567',
    status: 'verified',
    createdAt: new Date('2024-04-10'),
  },
  {
    id: 'cert-005',
    patientId: 'patient-002',
    patientName: 'Jane Smith',
    patientEmail: 'jane.smith@email.com',
    certificateType: 'Allergy Test Report',
    issuedBy: 'Allergy & Immunology Specialists',
    issueDate: new Date('2024-05-22'),
    expiryDate: new Date('2026-05-22'),
    description: 'Comprehensive allergy panel test completed. Identified allergies: Peanuts, Dust Mites. No drug allergies detected.',
    blockchainHash: '0x5b6c7d8e9f01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7',
    transactionId: '0xmno567pqr890123mno567pqr890123mno567pqr890123',
    status: 'verified',
    createdAt: new Date('2024-05-22'),
  },
  {
    id: 'cert-006',
    patientId: 'patient-003',
    patientName: 'Mike Johnson',
    patientEmail: 'mike.johnson@email.com',
    certificateType: 'Eye Examination Certificate',
    issuedBy: 'Vision Care Eye Hospital',
    issueDate: new Date('2024-06-15'),
    expiryDate: new Date('2025-06-15'),
    description: 'Complete eye examination performed. Visual acuity: 20/20 both eyes. No signs of glaucoma or cataracts.',
    blockchainHash: '0x6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
    transactionId: '0xpqr123stu456789pqr123stu456789pqr123stu456789',
    status: 'verified',
    createdAt: new Date('2024-06-15'),
  },
  {
    id: 'cert-007',
    patientId: 'patient-001',
    patientName: 'John Doe',
    patientEmail: 'john.doe@email.com',
    certificateType: 'Mental Health Assessment',
    issuedBy: 'MindCare Psychiatric Center',
    issueDate: new Date('2024-07-08'),
    description: 'Psychological evaluation completed. No signs of depression or anxiety disorders. Mentally fit for work.',
    blockchainHash: '0x7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
    transactionId: '0xstu789vwx012345stu789vwx012345stu789vwx012345',
    status: 'verified',
    createdAt: new Date('2024-07-08'),
  },
  {
    id: 'cert-008',
    patientId: 'patient-002',
    patientName: 'Jane Smith',
    patientEmail: 'jane.smith@email.com',
    certificateType: 'Dental Clearance Certificate',
    issuedBy: 'SmileCare Dental Clinic',
    issueDate: new Date('2024-08-20'),
    description: 'Complete dental examination and cleaning performed. No cavities or gum disease detected. Oral hygiene: Excellent.',
    blockchainHash: '0x8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
    transactionId: '0xvwx345yza678901vwx345yza678901vwx345yza678901',
    status: 'verified',
    createdAt: new Date('2024-08-20'),
  },
]

sampleCertificates.forEach((c) => certificates.set(c.id, c))

// User operations
export const userStore = {
  getAll: (): User[] => Array.from(users.values()),
  getById: (id: string): User | undefined => users.get(id),
  getByEmail: (email: string): User | undefined => 
    Array.from(users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase()),
  create: (user: User): User => {
    users.set(user.id, user)
    return user
  },
  update: (id: string, updates: Partial<User>): User | undefined => {
    const user = users.get(id)
    if (user) {
      const updated = { ...user, ...updates }
      users.set(id, updated)
      return updated
    }
    return undefined
  },
  delete: (id: string): boolean => users.delete(id),
}

// Certificate operations
export const certificateStore = {
  getAll: (): Certificate[] => Array.from(certificates.values()),
  getById: (id: string): Certificate | undefined => certificates.get(id),
  getByPatientId: (patientId: string): Certificate[] =>
    Array.from(certificates.values()).filter((c) => c.patientId === patientId),
  getByHash: (hash: string): Certificate | undefined =>
    Array.from(certificates.values()).find((c) => c.blockchainHash === hash),
  create: (certificate: Certificate): Certificate => {
    certificates.set(certificate.id, certificate)
    return certificate
  },
  update: (id: string, updates: Partial<Certificate>): Certificate | undefined => {
    const cert = certificates.get(id)
    if (cert) {
      const updated = { ...cert, ...updates }
      certificates.set(id, updated)
      return updated
    }
    return undefined
  },
  delete: (id: string): boolean => certificates.delete(id),
}

// Verification token operations
export const tokenStore = {
  create: (token: string, userId: string): void => {
    verificationTokens.set(token, userId)
  },
  get: (token: string): string | undefined => verificationTokens.get(token),
  delete: (token: string): boolean => verificationTokens.delete(token),
}
