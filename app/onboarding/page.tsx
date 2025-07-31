"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { User, Building, Briefcase, ArrowRight } from "lucide-react"

const purposes = [
  {
    value: "Student",
    label: "Student",
    description: "Academic projects and research",
    icon: User
  },
  {
    value: "Company",
    label: "Company",
    description: "Corporate communications and marketing",
    icon: Building
  },
  {
    value: "Professional",
    label: "Professional",
    description: "Freelance and professional services",
    icon: Briefcase
  }
]

export default function Onboarding() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedPurpose, setSelectedPurpose] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async () => {
    if (!selectedPurpose) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/setup/purpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: selectedPurpose })
      })

      if (response.ok) {
        router.push("/setup")
      } else {
        console.error("Failed to save purpose")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while session is loading
  if (status === "loading" || !mounted) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading...</div>
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-2xl bg-gray-900/80 border-gray-700 backdrop-blur-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Welcome, {session?.user?.name}!
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Tell us about your primary use case to customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <RadioGroup value={selectedPurpose} onValueChange={setSelectedPurpose}>
              <div className="grid gap-4">
                {purposes.map((purpose) => {
                  const Icon = purpose.icon
                  return (
                    <div key={purpose.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={purpose.value} id={purpose.value} />
                      <Label 
                        htmlFor={purpose.value}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center p-4 rounded-lg border border-gray-600 hover:border-blue-400 hover:bg-gray-800/50 transition-all duration-200">
                          <Icon className="h-8 w-8 text-blue-400 mr-4" />
                          <div>
                            <h3 className="text-white font-semibold text-lg">{purpose.label}</h3>
                            <p className="text-gray-300 text-sm">{purpose.description}</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )
                })}
              </div>
            </RadioGroup>

            <Button
              onClick={handleSubmit}
              disabled={!selectedPurpose || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all duration-300"
            >
              {isLoading ? "Saving..." : "Continue"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}