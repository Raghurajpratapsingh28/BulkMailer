import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// For user passwords (one-way hash)
export async function encryptPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// For Gmail app passwords (two-way encryption)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!'

export function encryptGmailPassword(password: string): string {
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv('aes-256-cbc', key as any, iv)
  let encrypted = cipher.update(password, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export function decryptGmailPassword(encryptedPassword: string): string {
  try {
    // Check if this is a new AES encrypted password (contains ':')
    if (encryptedPassword.includes(':')) {
      const textParts = encryptedPassword.split(':')
      const iv = Buffer.from(textParts.shift()!, 'hex')
      const encryptedText = textParts.join(':')
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
      const decipher = crypto.createDecipheriv('aes-256-cbc', key as any, iv)
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } else {
      // This is an old bcrypt hash, we can't decrypt it
      throw new Error('Old password format detected. Please re-enter your Gmail app password.')
    }
  } catch (error) {
    throw new Error('Failed to decrypt password. Please re-enter your Gmail app password.')
  }
}