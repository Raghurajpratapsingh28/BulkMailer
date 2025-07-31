import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const days = parseInt(period)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get email activity over time
    const emailActivity = await prisma.emailLog.groupBy({
      by: ['sentAt'],
      where: {
        userId: user.id,
        sentAt: { gte: startDate }
      },
      _count: {
        id: true
      }
    })

    // Get daily email counts
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(sentAt) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM EmailLog 
      WHERE userId = ${user.id} 
        AND sentAt >= ${startDate}
      GROUP BY DATE(sentAt)
      ORDER BY date
    `

    // Get campaign performance over time
    const campaignPerformance = await prisma.campaign.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startDate }
      },
      select: {
        id: true,
        name: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get delivery rate trends
    const deliveryRates = campaignPerformance.map(campaign => ({
      date: campaign.createdAt,
      name: campaign.name,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      successRate: campaign.totalRecipients > 0 
        ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100) 
        : 0
    }))

    // Get top performing email templates (based on success rate)
    const templatePerformance = await prisma.campaign.groupBy({
      by: ['template'],
      where: {
        userId: user.id,
        createdAt: { gte: startDate }
      },
      _avg: {
        sentCount: true,
        failedCount: true,
        totalRecipients: true
      },
      _count: {
        id: true
      }
    })

    // Calculate overall statistics
    const totalEmails = await prisma.emailLog.count({
      where: {
        userId: user.id,
        sentAt: { gte: startDate }
      }
    })

    const totalSent = await prisma.emailLog.count({
      where: {
        userId: user.id,
        status: 'sent',
        sentAt: { gte: startDate }
      }
    })

    const totalFailed = await prisma.emailLog.count({
      where: {
        userId: user.id,
        status: 'failed',
        sentAt: { gte: startDate }
      }
    })

    const overallSuccessRate = totalEmails > 0 ? Math.round((totalSent / totalEmails) * 100) : 0

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivity = await prisma.emailLog.count({
      where: {
        userId: user.id,
        sentAt: { gte: sevenDaysAgo }
      }
    })

    // Get monthly comparison
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)

    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)

    const lastMonthEmails = await prisma.emailLog.count({
      where: {
        userId: user.id,
        sentAt: { gte: lastMonthStart, lte: lastMonthEnd }
      }
    })

    const thisMonthEmails = await prisma.emailLog.count({
      where: {
        userId: user.id,
        sentAt: { gte: thisMonthStart }
      }
    })

    const monthOverMonthGrowth = lastMonthEmails > 0 
      ? Math.round(((thisMonthEmails - lastMonthEmails) / lastMonthEmails) * 100) 
      : 0

    return NextResponse.json({
      period: days,
      overallStats: {
        totalEmails,
        totalSent,
        totalFailed,
        successRate: overallSuccessRate,
        recentActivity,
        monthOverMonthGrowth
      },
      dailyStats,
      deliveryRates,
      templatePerformance: templatePerformance.map(t => ({
        template: t.template,
        averageSent: Math.round(t._avg.sentCount || 0),
        averageFailed: Math.round(t._avg.failedCount || 0),
        averageRecipients: Math.round(t._avg.totalRecipients || 0),
        campaignCount: t._count.id,
        averageSuccessRate: t._avg.totalRecipients && t._avg.totalRecipients > 0
          ? Math.round(((t._avg.sentCount || 0) / t._avg.totalRecipients) * 100)
          : 0
      })),
      emailActivity: emailActivity.map(activity => ({
        date: activity.sentAt,
        count: activity._count.id
      }))
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 