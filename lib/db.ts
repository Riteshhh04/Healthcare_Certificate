/**
 * SQLite Database Implementation for Local Development
 * 
 * To use this instead of in-memory storage:
 * 1. Install better-sqlite3: npm install better-sqlite3 @types/better-sqlite3
 * 2. Rename this file to db.ts (backup the original first)
 * 3. Run: npm run dev
 * 
 * The database file (healthcare.db) will be created automatically in the project root.
 */

import Database from 'better-sqlite3'
import path from 'path'
import { User, Certificate } from './types'

// Database file will be stored in the project root
const dbPath = path.join(process.cwd(), 'healthcare.db')

// Create database connection (lazy initialization)
let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL') // Better performance for concurrent reads
    initializeDatabase()
  }
  return db
}

// Initialize database tables
function initializeDatabase() {
  const database = db!
  
  // Create users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('patient', 'admin')),
      is_verified INTEGER NOT NULL DEFAULT 0,
      verification_token TEXT,
      created_at TEXT NOT NULL
    )
  `)

  // Create certificates table
  database.exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      patient_email TEXT NOT NULL,
      certificate_type TEXT NOT NULL,
      issued_by TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiry_date TEXT,
      description TEXT NOT NULL,
      file_url TEXT,
      blockchain_hash TEXT,
      transaction_id TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'revoked')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `)

  // Create verification tokens table
  database.exec(`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // Create indexes for better query performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_certificates_patient_id ON certificates(patient_id);
    CREATE INDEX IF NOT EXISTS idx_certificates_blockchain_hash ON certificates(blockchain_hash);
  `)

  // Insert default admin user if not exists
  const adminExists = database.prepare('SELECT id FROM users WHERE email = ?').get('admin@healthcare.com')
  if (!adminExists) {
    database.prepare(`
      INSERT INTO users (id, email, name, password, role, is_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'admin-001',
      'admin@healthcare.com',
      'System Administrator',
      'admin123',
      'admin',
      1,
      new Date().toISOString()
    )
  }
}

// Helper functions to convert between DB and TypeScript types
function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    password: row.password as string,
    role: row.role as 'patient' | 'admin',
    isVerified: Boolean(row.is_verified),
    verificationToken: row.verification_token as string | undefined,
    createdAt: new Date(row.created_at as string),
  }
}

function rowToCertificate(row: Record<string, unknown>): Certificate {
  return {
    id: row.id as string,
    patientId: row.patient_id as string,
    patientName: row.patient_name as string,
    patientEmail: row.patient_email as string,
    certificateType: row.certificate_type as string,
    issuedBy: row.issued_by as string,
    issueDate: new Date(row.issue_date as string),
    expiryDate: row.expiry_date ? new Date(row.expiry_date as string) : undefined,
    description: row.description as string,
    fileUrl: row.file_url as string | undefined,
    blockchainHash: row.blockchain_hash as string | undefined,
    transactionId: row.transaction_id as string | undefined,
    status: row.status as 'pending' | 'verified' | 'revoked',
    createdAt: new Date(row.created_at as string),
  }
}

// User operations
export const userStore = {
  getAll: (): User[] => {
    const rows = getDb().prepare('SELECT * FROM users').all() as Record<string, unknown>[]
    return rows.map(rowToUser)
  },

  getById: (id: string): User | undefined => {
    const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined
    return row ? rowToUser(row) : undefined
  },

  getByEmail: (email: string): User | undefined => {
    const row = getDb().prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as Record<string, unknown> | undefined
    return row ? rowToUser(row) : undefined
  },

  create: (user: User): User => {
    getDb().prepare(`
      INSERT INTO users (id, email, name, password, role, is_verified, verification_token, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.email,
      user.name,
      user.password,
      user.role,
      user.isVerified ? 1 : 0,
      user.verificationToken || null,
      user.createdAt.toISOString()
    )
    return user
  },

  update: (id: string, updates: Partial<User>): User | undefined => {
    const existing = userStore.getById(id)
    if (!existing) return undefined

    const updated = { ...existing, ...updates }
    getDb().prepare(`
      UPDATE users SET
        email = ?,
        name = ?,
        password = ?,
        role = ?,
        is_verified = ?,
        verification_token = ?
      WHERE id = ?
    `).run(
      updated.email,
      updated.name,
      updated.password,
      updated.role,
      updated.isVerified ? 1 : 0,
      updated.verificationToken || null,
      id
    )
    return updated
  },

  delete: (id: string): boolean => {
    const result = getDb().prepare('DELETE FROM users WHERE id = ?').run(id)
    return result.changes > 0
  },
}

// Certificate operations
export const certificateStore = {
  getAll: (): Certificate[] => {
    const rows = getDb().prepare('SELECT * FROM certificates ORDER BY created_at DESC').all() as Record<string, unknown>[]
    return rows.map(rowToCertificate)
  },

  getById: (id: string): Certificate | undefined => {
    const row = getDb().prepare('SELECT * FROM certificates WHERE id = ?').get(id) as Record<string, unknown> | undefined
    return row ? rowToCertificate(row) : undefined
  },

  getByPatientId: (patientId: string): Certificate[] => {
    const rows = getDb().prepare('SELECT * FROM certificates WHERE patient_id = ? ORDER BY created_at DESC').all(patientId) as Record<string, unknown>[]
    return rows.map(rowToCertificate)
  },

  getByHash: (hash: string): Certificate | undefined => {
    const row = getDb().prepare('SELECT * FROM certificates WHERE blockchain_hash = ?').get(hash) as Record<string, unknown> | undefined
    return row ? rowToCertificate(row) : undefined
  },

  create: (certificate: Certificate): Certificate => {
    getDb().prepare(`
      INSERT INTO certificates (
        id, patient_id, patient_name, patient_email, certificate_type, 
        issued_by, issue_date, expiry_date, description, file_url,
        blockchain_hash, transaction_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      certificate.id,
      certificate.patientId,
      certificate.patientName,
      certificate.patientEmail,
      certificate.certificateType,
      certificate.issuedBy,
      certificate.issueDate.toISOString(),
      certificate.expiryDate?.toISOString() || null,
      certificate.description,
      certificate.fileUrl || null,
      certificate.blockchainHash || null,
      certificate.transactionId || null,
      certificate.status,
      certificate.createdAt.toISOString()
    )
    return certificate
  },

  update: (id: string, updates: Partial<Certificate>): Certificate | undefined => {
    const existing = certificateStore.getById(id)
    if (!existing) return undefined

    const updated = { ...existing, ...updates }
    getDb().prepare(`
      UPDATE certificates SET
        patient_name = ?,
        patient_email = ?,
        certificate_type = ?,
        issued_by = ?,
        issue_date = ?,
        expiry_date = ?,
        description = ?,
        file_url = ?,
        blockchain_hash = ?,
        transaction_id = ?,
        status = ?
      WHERE id = ?
    `).run(
      updated.patientName,
      updated.patientEmail,
      updated.certificateType,
      updated.issuedBy,
      updated.issueDate.toISOString(),
      updated.expiryDate?.toISOString() || null,
      updated.description,
      updated.fileUrl || null,
      updated.blockchainHash || null,
      updated.transactionId || null,
      updated.status,
      id
    )
    return updated
  },

  delete: (id: string): boolean => {
    const result = getDb().prepare('DELETE FROM certificates WHERE id = ?').run(id)
    return result.changes > 0
  },
}

// Verification token operations
export const tokenStore = {
  create: (token: string, userId: string): void => {
    getDb().prepare(`
      INSERT OR REPLACE INTO verification_tokens (token, user_id, created_at)
      VALUES (?, ?, ?)
    `).run(token, userId, new Date().toISOString())
  },

  get: (token: string): string | undefined => {
    const row = getDb().prepare('SELECT user_id FROM verification_tokens WHERE token = ?').get(token) as { user_id: string } | undefined
    return row?.user_id
  },

  delete: (token: string): boolean => {
    const result = getDb().prepare('DELETE FROM verification_tokens WHERE token = ?').run(token)
    return result.changes > 0
  },
}

// Export a function to close the database (useful for graceful shutdown)
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
