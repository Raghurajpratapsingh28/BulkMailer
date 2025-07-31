"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Shield, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"

export default function Setup() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [appPassword, setAppPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/setup/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, appPassword })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setError(data.error || "Setup failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while session is loading
  if (status === "loading" || !mounted) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </Layout>
    )
  }

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    if (mounted) {
      router.push("/auth/signin")
    }
    return null
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gmail Setup</h1>
          <p className="text-gray-300">
            Configure your Gmail credentials to start sending bulk emails
          </p>
        </div>

        {success ? (
          <Card className="bg-green-900/20 border-green-600/30">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <div>
                  <h3 className="text-green-400 font-semibold">Setup Complete!</h3>
                  <p className="text-gray-300">Redirecting to dashboard...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Instructions */}
            <Card className="bg-blue-900/20 border-blue-600/30 mb-6">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  How to Get Gmail App Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-gray-300">
                <p className="font-medium">Follow these steps to generate your Gmail app password:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to your Google Account settings</li>
                  <li>Navigate to Security → 2-Step Verification (enable if not already)</li>
                  <li>Go to Security → App passwords</li>
                  <li>Select "Mail" and choose your device</li>
                  <li>Copy the 16-character password generated</li>
                </ol>
                <Alert className="bg-yellow-900/20 border-yellow-600/30">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-200">
                    Never share your app password. It will be securely encrypted and stored.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Setup Form */}
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Gmail Configuration
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Enter your Gmail address and app password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Gmail Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@gmail.com"
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appPassword" className="text-white">App Password</Label>
                    <div className="relative">
                      <Input
                        id="appPassword"
                        type={showPassword ? "text" : "password"}
                        value={appPassword}
                        onChange={(e) => setAppPassword(e.target.value)}
                        placeholder="16-character app password"
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Must be exactly 16 characters with no spaces
                    </p>
                  </div>

                  {error && (
                    <Alert className="bg-red-900/20 border-red-600/30">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-200">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || !email || !appPassword}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all duration-300"
                  >
                    {isLoading ? "Validating..." : "Save Configuration"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  )
}