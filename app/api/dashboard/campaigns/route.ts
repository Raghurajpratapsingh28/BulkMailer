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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get campaigns with pagination
    const campaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        subject: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        recipients: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            sentAt: true,
            error: true
          }
        }
      }
    })

    // Get total count for pagination
    const totalCampaigns = await prisma.campaign.count({
      where: { userId: user.id }
    })

    // Calculate success rates for each campaign
    const campaignsWithStats = campaigns.map(campaign => {
      const successRate = campaign.totalRecipients > 0 
        ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100) 
        : 0

      return {
        ...campaign,
        successRate,
        pendingCount: campaign.totalRecipients - campaign.sentCount - campaign.failedCount
      }
    })

    return NextResponse.json({
      campaigns: campaignsWithStats,
      pagination: {
        page,
        limit,
        total: totalCampaigns,
        totalPages: Math.ceil(totalCampaigns / limit)
      }
    })
  } catch (error) {
    console.error("Campaigns error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 