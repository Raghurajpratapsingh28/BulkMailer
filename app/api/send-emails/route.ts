import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decryptGmailPassword } from "@/lib/encryption"
import { sendBulkEmails } from "@/lib/email"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { template, recipients, emailTemplate = "modern", campaignName } = await request.json()

    // Get user's Gmail config
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, gmailEmail: true, gmailPassword: true }
    })

    if (!user) {
      // Create user if they don't exist (this can happen after database reset)
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || null
        },
        select: { id: true, gmailEmail: true, gmailPassword: true }
      })
    }

    if (!user?.gmailEmail || !user?.gmailPassword) {
      return NextResponse.json({ 
        error: "Gmail configuration not found or needs to be updated. Please set up your Gmail credentials first." 
      }, { status: 400 })
    }

    // Validate recipients
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "No recipients provided" }, { status: 400 })
    }

    // Validate email addresses in recipients
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter(r => !emailRegex.test(r.email))
    if (invalidEmails.length > 0) {
      return NextResponse.json({ 
        error: `Invalid email addresses found: ${invalidEmails.map(r => r.email).join(', ')}` 
      }, { status: 400 })
    }

    // Create campaign record
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: campaignName || `Campaign ${new Date().toLocaleDateString()}`,
        subject: template.subject,
        template: JSON.stringify(template),
        totalRecipients: recipients.length,
        status: "sending"
      }
    })

    // Create campaign recipients
    const campaignRecipients = await Promise.all(
      recipients.map(recipient => 
        prisma.campaignRecipient.create({
          data: {
            campaignId: campaign.id,
            email: recipient.email,
            name: recipient.name,
            customData: JSON.stringify(recipient),
            status: "pending"
          }
        })
      )
    )

    // Decrypt the stored Gmail password
    const decryptedPassword = decryptGmailPassword(user.gmailPassword)
    
    const results = await sendBulkEmails(
      user.id,
      { email: user.gmailEmail, password: decryptedPassword },
      template,
      recipients,
      emailTemplate,
      campaign.id
    )

    // Update campaign with results
    const sentCount = results.filter(r => r.status === "sent").length
    const failedCount = results.filter(r => r.status === "failed").length

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        sentCount,
        failedCount,
        status: "completed"
      }
    })

    // Update campaign recipients with results
    for (const result of results) {
      await prisma.campaignRecipient.updateMany({
        where: {
          campaignId: campaign.id,
          email: result.email
        },
        data: {
          status: result.status,
          sentAt: result.status === "sent" ? new Date() : null,
          error: result.error || null
        }
      })
    }

    return NextResponse.json({
      results,
      campaignId: campaign.id,
      campaignStats: {
        totalRecipients: recipients.length,
        sentCount,
        failedCount
      }
    })
  } catch (error) {
    console.error("Send emails error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}