"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Shield, Zap, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/dashboard")
    }
  }, [session, router])

  if (status === "loading") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
            BulkMailer Pro
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Professional bulk email platform with Excel integration, secure Gmail authentication, and advanced tracking
          </p>
          <Link href="/auth/signin">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300">
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-400 mb-4" />
              <CardTitle className="text-white">Secure Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Google OAuth 2.0 with encrypted Gmail app password storage for maximum security
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300">
            <CardHeader>
              <Mail className="h-12 w-12 text-green-400 mb-4" />
              <CardTitle className="text-white">Excel Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Upload Excel files and automatically map data to personalized email templates
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300">
            <CardHeader>
              <Zap className="h-12 w-12 text-yellow-400 mb-4" />
              <CardTitle className="text-white">Bulk Sending</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Send thousands of personalized emails with real-time progress tracking and error reporting
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-400 mb-4" />
              <CardTitle className="text-white">Professional Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Advanced templates, delivery analytics, and compliance features for professionals
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-2xl p-12 backdrop-blur-sm border border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to scale your email campaigns?
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            Join thousands of professionals using BulkMailer for their email marketing needs
          </p>
          <Link href="/auth/signin">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  )
}