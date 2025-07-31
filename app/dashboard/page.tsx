"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Layout from "@/components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Settings, Send, BarChart3, Users, Clock, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalEmailsSent: number
  totalEmailsFailed: number
  successRate: number
  lastCampaign: {
    id: string
    name: string
    subject: string
    totalRecipients: number
    sentCount: number
    failedCount: number
    status: string
    createdAt: string
  } | null
  campaignStats: {
    totalCampaigns: number
    totalRecipients: number
    totalSent: number
    totalFailed: number
  }
  recentActivity: number
  monthlyActivity: number
  topCampaigns: Array<{
    id: string
    name: string
    subject: string
    totalRecipients: number
    sentCount: number
    failedCount: number
    createdAt: string
  }>
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    if (!session.user?.purpose) {
      router.push("/onboarding")
      return
    }
  }, [session, status, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          console.error('Failed to fetch dashboard stats:', response.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchStats()
    }
  }, [session])

  if (status === "loading" || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
        </div>
      </Layout>
    )
  }

  if (!session) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-300">
            Welcome back, {session.user?.name}! Manage your email campaigns from here.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30 hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-300">
            <CardHeader>
              <Settings className="h-8 w-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Setup Gmail</CardTitle>
              <CardDescription className="text-gray-300">
                Configure your Gmail credentials for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/setup">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  {session.user?.hasGmailConfig ? "Update Settings" : "Get Started"}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-teal-600/20 border-green-500/30 hover:from-green-600/30 hover:to-teal-600/30 transition-all duration-300">
            <CardHeader>
              <Send className="h-8 w-8 text-green-400 mb-2" />
              <CardTitle className="text-white">Send Emails</CardTitle>
              <CardDescription className="text-gray-300">
                Upload Excel file and send bulk personalized emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/send">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!session.user?.hasGmailConfig}
                >
                  Send Campaign
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-300">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Analytics</CardTitle>
              <CardDescription className="text-gray-300">
                View email delivery reports and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalEmailsSent || 0}</div>
              <p className="text-xs text-gray-400">
                {stats?.totalEmailsSent ? `${stats.totalEmailsSent} emails delivered` : "No campaigns sent yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Success Rate</CardTitle>
              <Users className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.successRate || 0}%</div>
              <p className="text-xs text-gray-400">
                {stats?.successRate ? `${stats.successRate}% delivery rate` : "Send your first campaign"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Last Campaign</CardTitle>
              <Clock className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.lastCampaign ? formatDate(stats.lastCampaign.createdAt) : "Never"}
              </div>
              <p className="text-xs text-gray-400">
                {stats?.lastCampaign ? stats.lastCampaign.name : "No campaigns sent"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Campaigns</CardTitle>
              <BarChart3 className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.campaignStats.totalCampaigns || 0}</div>
              <p className="text-xs text-gray-400">Campaigns created</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Recent Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.recentActivity || 0}</div>
              <p className="text-xs text-gray-400">Emails in last 7 days</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Monthly Activity</CardTitle>
              <Calendar className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.monthlyActivity || 0}</div>
              <p className="text-xs text-gray-400">Emails this month</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Recipients</CardTitle>
              <Users className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.campaignStats.totalRecipients || 0}</div>
              <p className="text-xs text-gray-400">Recipients across all campaigns</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Campaigns */}
        {stats?.topCampaigns && stats.topCampaigns.length > 0 && (
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white">Top Performing Campaigns</CardTitle>
              <CardDescription className="text-gray-300">
                Your most successful email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topCampaigns.map((campaign, index) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{campaign.name}</p>
                        <p className="text-gray-400 text-sm">{campaign.subject}</p>
                        <p className="text-gray-500 text-xs">{formatDate(campaign.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{campaign.sentCount}/{campaign.totalRecipients}</p>
                      <p className="text-gray-400 text-sm">
                        {Math.round((campaign.sentCount / campaign.totalRecipients) * 100)}% success
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Getting Started Guide */}
        <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Getting Started</CardTitle>
            <CardDescription className="text-gray-300">
              Follow these steps to send your first email campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  session.user?.hasGmailConfig 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  1
                </div>
                <div>
                  <p className="text-white font-medium">Setup Gmail Configuration</p>
                  <p className="text-gray-400 text-sm">Add your Gmail credentials and app password</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-600 text-gray-300 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="text-white font-medium">Prepare Excel File</p>
                  <p className="text-gray-400 text-sm">Create an Excel file with recipient data (name, email, etc.)</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-600 text-gray-300 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="text-white font-medium">Send Your Campaign</p>
                  <p className="text-gray-400 text-sm">Upload file, create template, and send bulk emails</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}