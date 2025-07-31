const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

// Simple encryption for Gmail passwords (not using bcrypt)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!'

function encryptGmailPassword(password) {
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(password, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

async function migratePasswords() {
  try {
    console.log('Starting password migration...')
    
    // Get all users with Gmail passwords
    const users = await prisma.user.findMany({
      where: {
        gmailPassword: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        gmailEmail: true,
        gmailPassword: true
      }
    })

    console.log(`Found ${users.length} users with Gmail passwords`)

    for (const user of users) {
      // Check if password is already in new format (contains ':')
      if (user.gmailPassword && user.gmailPassword.includes(':')) {
        console.log(`User ${user.email}: Password already in new format`)
        continue
      }

      // For old bcrypt hashes, we can't decrypt them
      // We need to ask users to re-enter their passwords
      console.log(`User ${user.email}: Old password format detected`)
      
      // Clear the old password so user will be prompted to re-enter
      await prisma.user.update({
        where: { id: user.id },
        data: { gmailPassword: null }
      })
      
      console.log(`User ${user.email}: Password cleared, user will need to re-enter`)
    }

    console.log('Migration completed!')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migratePasswords() 