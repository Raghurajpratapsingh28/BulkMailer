import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encryptGmailPassword } from "@/lib/encryption"
import { testEmailConnection } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, appPassword } = await request.json()

    // Validate email format
    const emailRegex = /^[^\s@]+@gmail\.com$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid Gmail address" }, { status: 400 })
    }

    // Validate app password format (16 characters, no spaces)
    if (!appPassword || appPassword.length !== 16 || /\s/.test(appPassword)) {
      return NextResponse.json({ 
        error: "App password must be exactly 16 characters with no spaces" 
      }, { status: 400 })
    }

    // Test the email connection
    const isValid = await testEmailConnection({ email, password: appPassword })
    if (!isValid) {
      return NextResponse.json({ 
        error: "Failed to authenticate with Gmail. Please check your email and app password." 
      }, { status: 400 })
    }

    // Encrypt the app password
    const encryptedPassword = encryptGmailPassword(appPassword)

    // Save to database
    await prisma.user.upsert({
      where: { email: session.user.email },
      update: { 
        gmailEmail: email,
        gmailPassword: encryptedPassword
      },
      create: {
        email: session.user.email,
        name: session.user.name || null,
        gmailEmail: email,
        gmailPassword: encryptedPassword
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Gmail setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}