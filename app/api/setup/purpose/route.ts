import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { purpose } = await request.json()

    if (!purpose || !["Student", "Company", "Professional"].includes(purpose)) {
      return NextResponse.json({ error: "Invalid purpose" }, { status: 400 })
    }

    await prisma.user.upsert({
      where: { email: session.user.email },
      update: { purpose },
      create: {
        email: session.user.email,
        name: session.user.name || null,
        purpose
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Purpose setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}