import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      // Create user if they don't exist (this can happen after database reset)
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || null
        },
        select: { id: true }
      })
    }

    // Get total emails sent
    const totalEmailsSent = await prisma.emailLog.count({
      where: { userId: user.id, status: "sent" }
    })

    // Get total emails failed
    const totalEmailsFailed = await prisma.emailLog.count({
      where: { userId: user.id, status: "failed" }
    })

    // Calculate success rate
    const totalEmails = totalEmailsSent + totalEmailsFailed
    const successRate = totalEmails > 0 ? Math.round((totalEmailsSent / totalEmails) * 100) : 0

    // Get last campaign
    const lastCampaign = await prisma.campaign.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        subject: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
        status: true,
        createdAt: true
      }
    })

    // Get campaign statistics
    const campaignStats = await prisma.campaign.aggregate({
      where: { userId: user.id },
      _count: { id: true },
      _sum: { 
        totalRecipients: true,
        sentCount: true,
        failedCount: true
      }
    })

    // Get recent email activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivity = await prisma.emailLog.count({
      where: {
        userId: user.id,
        sentAt: { gte: sevenDaysAgo }
      }
    })

    // Get monthly email activity
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const monthlyActivity = await prisma.emailLog.count({
      where: {
        userId: user.id,
        sentAt: { gte: thirtyDaysAgo }
      }
    })

    // Get top performing campaigns
    const topCampaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      orderBy: { sentCount: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        subject: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      totalEmailsSent,
      totalEmailsFailed,
      successRate,
      lastCampaign,
      campaignStats: {
        totalCampaigns: campaignStats._count.id || 0,
        totalRecipients: campaignStats._sum.totalRecipients || 0,
        totalSent: campaignStats._sum.sentCount || 0,
        totalFailed: campaignStats._sum.failedCount || 0
      },
      recentActivity,
      monthlyActivity,
      topCampaigns
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 