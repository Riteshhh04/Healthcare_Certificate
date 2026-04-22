/**
 * SQLite Database Implementation using better-sqlite3
 * 
 * All data is persisted in the healthcare.db file in the project root.
 * Data survives server restarts.
 */

import Database from 'better-sqlite3'
import path from 'path'
import { User, Certificate } from './types'

// Create database file in project root
const dbPath = path.join(process.cwd(), 'healthcare.db')
const db = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('patient', 'admin')),
    isVerified INTEGER NOT NULL DEFAULT 0,
    verificationToken TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    patientId TEXT NOT NULL,
    patientName TEXT NOT NULL,
    patientEmail TEXT NOT NULL,
    certificateType TEXT NOT NULL,
    issuedBy TEXT NOT NULL,
    issueDate TEXT NOT NULL,
    expiryDate TEXT,
    description TEXT NOT NULL,
    fileUrl TEXT,
    blockchainHash TEXT,
    transactionId TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'verified', 'revoked')),
    createdAt TEXT NOT NULL,
    FOREIGN KEY (patientId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS verification_tokens (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_certificates_patientId ON certificates(patientId);
  CREATE INDEX IF NOT EXISTS idx_certificates_blockchainHash ON certificates(blockchainHash);
`)

// Check if admin user exists, if not create it
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@healthcare.com')
if (!adminExists) {
  db.prepare(`
    INSERT INTO users (id, email, name, password, role, isVerified, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('admin-001', 'admin@healthcare.com', 'System Administrator', 'admin123', 'admin', 1, new Date().toISOString())
  
  console.log('[DB] Created default admin user: admin@healthcare.com / admin123')
}

// Helper to convert DB row to User object
function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    password: row.password as string,
    role: row.role as 'patient' | 'admin',
    isVerified: Boolean(row.isVerified),
    verificationToken: row.verificationToken as string | undefined,
    createdAt: new Date(row.createdAt as string),
  }
}

// Helper to convert DB row to Certificate object
function rowToCertificate(row: Record<string, unknown>): Certificate {
  return {
    id: row.id as string,
    patientId: row.patientId as string,
    patientName: row.patientName as string,
    patientEmail: row.patientEmail as string,
    certificateType: row.certificateType as string,
    issuedBy: row.issuedBy as string,
    issueDate: new Date(row.issueDate as string),
    expiryDate: row.expiryDate ? new Date(row.expiryDate as string) : undefined,
    description: row.description as string,
    fileUrl: row.fileUrl as string | undefined,
    blockchainHash: row.blockchainHash as string | undefined,
    transactionId: row.transactionId as string | undefined,
    status: row.status as 'pending' | 'verified' | 'revoked',
    createdAt: new Date(row.createdAt as string),
  }
}

// User operations
export const userStore = {
  getAll: (): User[] => {
    const rows = db.prepare('SELECT * FROM users ORDER BY createdAt DESC').all() as Record<string, unknown>[]
    return rows.map(rowToUser)
  },

  getById: (id: string): User | undefined => {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined
    return row ? rowToUser(row) : undefined
  },

  getByEmail: (email: string): User | undefined => {
    const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as Record<string, unknown> | undefined
    return row ? rowToUser(row) : undefined
  },

  create: (user: User): User => {
    db.prepare(`
      INSERT INTO users (id, email, name, password, role, isVerified, verificationToken, createdAt)
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
    const current = userStore.getById(id)
    if (!current) return undefined

    const updated = { ...current, ...updates }
    db.prepare(`
      UPDATE users SET 
        email = ?, name = ?, password = ?, role = ?, 
        isVerified = ?, verificationToken = ?
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
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id)
    return result.changes > 0
  },
}

// Certificate operations
export const certificateStore = {
  getAll: (): Certificate[] => {
    const rows = db.prepare('SELECT * FROM certificates ORDER BY createdAt DESC').all() as Record<string, unknown>[]
    return rows.map(rowToCertificate)
  },

  getById: (id: string): Certificate | undefined => {
    const row = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id) as Record<string, unknown> | undefined
    return row ? rowToCertificate(row) : undefined
  },

  getByPatientId: (patientId: string): Certificate[] => {
    const rows = db.prepare('SELECT * FROM certificates WHERE patientId = ? ORDER BY createdAt DESC').all(patientId) as Record<string, unknown>[]
    return rows.map(rowToCertificate)
  },

  getByHash: (hash: string): Certificate | undefined => {
    const row = db.prepare('SELECT * FROM certificates WHERE blockchainHash = ?').get(hash) as Record<string, unknown> | undefined
    return row ? rowToCertificate(row) : undefined
  },

  create: (certificate: Certificate): Certificate => {
    db.prepare(`
      INSERT INTO certificates (
        id, patientId, patientName, patientEmail, certificateType, 
        issuedBy, issueDate, expiryDate, description, fileUrl,
        blockchainHash, transactionId, status, createdAt
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
    const current = certificateStore.getById(id)
    if (!current) return undefined

    const updated = { ...current, ...updates }
    db.prepare(`
      UPDATE certificates SET 
        patientName = ?, patientEmail = ?, certificateType = ?,
        issuedBy = ?, issueDate = ?, expiryDate = ?, description = ?,
        fileUrl = ?, blockchainHash = ?, transactionId = ?, status = ?
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
    const result = db.prepare('DELETE FROM certificates WHERE id = ?').run(id)
    return result.changes > 0
  },
}

// Verification token operations
export const tokenStore = {
  create: (token: string, userId: string): void => {
    db.prepare(`
      INSERT OR REPLACE INTO verification_tokens (token, userId, createdAt)
      VALUES (?, ?, ?)
    `).run(token, userId, new Date().toISOString())
  },

  get: (token: string): string | undefined => {
    const row = db.prepare('SELECT userId FROM verification_tokens WHERE token = ?').get(token) as { userId: string } | undefined
    return row?.userId
  },

  delete: (token: string): boolean => {
    const result = db.prepare('DELETE FROM verification_tokens WHERE token = ?').run(token)
    return result.changes > 0
  },
}

// Export database instance for advanced operations if needed
export { db }
