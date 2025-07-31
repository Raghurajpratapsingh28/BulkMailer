"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { Upload, FileText, Send, AlertCircle, CheckCircle, Eye, Palette, Type } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Recipient {
  [key: string]: string
}

export default function SendEmails() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)
  const [emailTemplate, setEmailTemplate] = useState("modern")
  const [campaignName, setCampaignName] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFile(file)
      setError("")
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const XLSX = await import('xlsx')
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
          
          if (jsonData.length < 2) {
            setError("Excel file must contain at least a header row and one data row")
            return
          }
          
          const headers = jsonData[0]
          const dataRows = jsonData.slice(1)
          
          if (!headers.includes('email')) {
            setError("Excel file must contain an 'email' column")
            return
          }
          
          const recipientData: Recipient[] = dataRows.map(row => {
            const recipient: Recipient = {}
            headers.forEach((header, index) => {
              recipient[header] = row[index] || ""
            })
            return recipient
          }).filter(recipient => recipient.email) // Filter out rows without email
          
          setColumns(headers)
          setRecipients(recipientData)
        } catch (error) {
          setError("Failed to parse Excel file. Please check the format.")
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  })

  const handleSend = async () => {
    if (!subject || !body || recipients.length === 0) {
      setError("Please fill in all fields and upload a valid Excel file")
      return
    }

    setIsSending(true)
    setProgress(0)
    setError("")

    try {
      const response = await fetch("/api/send-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: { subject, body },
          recipients,
          emailTemplate,
          campaignName: campaignName || `Campaign ${new Date().toLocaleDateString()}`
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data)
      } else {
        setError(data.error || "Failed to send emails")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const replacePlaceholders = (template: string, data: Recipient): string => {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match
    })
  }

  const generateHTMLTemplate = (content: string, recipient: Recipient): string => {
    const processedContent = replacePlaceholders(content, recipient)
    
    if (emailTemplate === "modern") {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email</title>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8f9fa;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
              background-color: #ffffff;
            }
            .content p {
              margin: 0 0 20px 0;
              font-size: 16px;
              color: #4a5568;
            }
            .footer {
              background-color: #f7fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin: 0;
              color: #718096;
              font-size: 14px;
            }
            @media (max-width: 600px) {
              .email-container {
                margin: 10px;
                border-radius: 8px;
              }
              .header, .content, .footer {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>Your Message</h1>
            </div>
            <div class="content">
              ${processedContent.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
            <div class="footer">
              <p>Sent with ❤️ from your email campaign</p>
            </div>
          </div>
        </body>
        </html>
      `
    } else if (emailTemplate === "minimal") {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #2d3748;
              background-color: #ffffff;
            }
            .email-content {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .email-content p {
              margin: 0 0 16px 0;
              font-size: 16px;
            }
            @media (max-width: 600px) {
              body { padding: 10px; }
              .email-content { padding: 20px 10px; }
            }
          </style>
        </head>
        <body>
          <div class="email-content">
            ${processedContent.split('\n').map(line => `<p>${line}</p>`).join('')}
          </div>
        </body>
        </html>
      `
    } else {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email</title>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: Georgia, serif;
              line-height: 1.8;
              color: #2c3e50;
              background-color: #ecf0f1;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border: 2px solid #34495e;
            }
            .header {
              background-color: #34495e;
              color: white;
              padding: 30px;
              text-align: center;
              border-bottom: 3px solid #e74c3c;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: normal;
            }
            .content {
              padding: 40px 30px;
              background-color: #ffffff;
            }
            .content p {
              margin: 0 0 20px 0;
              font-size: 16px;
              text-align: justify;
            }
            .footer {
              background-color: #34495e;
              color: white;
              padding: 20px;
              text-align: center;
              font-size: 14px;
            }
            @media (max-width: 600px) {
              .email-container {
                margin: 10px;
              }
              .header, .content, .footer {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>Professional Communication</h1>
            </div>
            <div class="content">
              ${processedContent.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
            <div class="footer">
              <p>Best regards,<br>Your Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  const previewRecipient = recipients[previewIndex] || {}

  // Show loading state while session is loading
  if (status === "loading" || !mounted) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
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

  if (!session?.user?.hasGmailConfig) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <Card className="bg-yellow-900/20 border-yellow-600/30">
            <CardContent className="pt-6">
              <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-yellow-400 font-semibold text-lg mb-2">Gmail Setup Required</h3>
              <p className="text-gray-300 mb-4">
                You need to configure your Gmail credentials before sending emails.
              </p>
              <Button 
                onClick={() => router.push("/setup")}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Setup Gmail
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Send Bulk Emails</h1>
          <p className="text-gray-300">
            Upload Excel file and create personalized email campaigns with beautiful templates
          </p>
        </div>

        {results ? (
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                Campaign Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{results.campaignStats?.sentCount || 0}</div>
                  <div className="text-green-300">Emails Sent</div>
                </div>
                <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-400">{results.campaignStats?.failedCount || 0}</div>
                  <div className="text-red-300">Failed</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{results.campaignStats?.totalRecipients || recipients.length}</div>
                  <div className="text-blue-300">Total Recipients</div>
                </div>
              </div>
              
              {results.results && results.results.some((r: any) => r.status === 'failed') && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Failed Emails:</h4>
                  <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                    {results.results.filter((r: any) => r.status === 'failed').map((result: any, index: number) => (
                      <div key={index} className="text-red-300 text-sm">
                        {result.email}: {result.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button onClick={() => {
                setResults(null)
                setFile(null)
                setRecipients([])
                setSubject("")
                setBody("")
                setCampaignName("")
              }}>
                Send Another Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* File Upload */}
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Excel File
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Upload an Excel file (.xlsx or .xls) with recipient data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-400 bg-blue-900/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  {file ? (
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-green-400 text-sm">{recipients.length} recipients found</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white mb-2">
                        {isDragActive ? 'Drop the file here' : 'Drag & drop Excel file here'}
                      </p>
                      <p className="text-gray-400 text-sm">or click to browse</p>
                    </div>
                  )}
                </div>
                
                {columns.length > 0 && (
                  <div className="mt-4">
                    <p className="text-white font-medium mb-2">Available columns:</p>
                    <div className="flex flex-wrap gap-2">
                      {columns.map(column => (
                        <span key={column} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-sm">
                          {`{${column}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Template */}
            {recipients.length > 0 && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white flex items-center">
                            <Type className="h-5 w-5 mr-2" />
                            Email Template
                          </CardTitle>
                          <CardDescription className="text-gray-300">
                            Use {`{column_name}`} for placeholders
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="template" className="text-white text-sm">Template:</Label>
                          <select
                            id="template"
                            value={emailTemplate}
                            onChange={(e) => setEmailTemplate(e.target.value)}
                            className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-1 text-sm"
                          >
                            <option value="modern">Modern</option>
                            <option value="minimal">Minimal</option>
                            <option value="professional">Professional</option>
                          </select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="campaignName" className="text-white">Campaign Name</Label>
                        <Input
                          id="campaignName"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          placeholder="My Email Campaign"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="subject" className="text-white">Subject</Label>
                        <Input
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Hello {name}!"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="body" className="text-white">Email Body</Label>
                        <Textarea
                          id="body"
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder="Dear {name},&#10;&#10;Thank you for joining {company}..."
                          rows={12}
                          className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Eye className="h-5 w-5 mr-2" />
                        Preview
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Preview for recipient {previewIndex + 1} of {recipients.length}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {recipients.length > 1 && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                            disabled={previewIndex === 0}
                          >
                            Previous
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewIndex(Math.min(recipients.length - 1, previewIndex + 1))}
                            disabled={previewIndex === recipients.length - 1}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-white">Subject Preview</Label>
                        <div className="bg-gray-800 border border-gray-600 rounded p-3 text-white">
                          {subject ? replacePlaceholders(subject, previewRecipient) : "Enter subject..."}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-white">HTML Preview</Label>
                        <div className="bg-gray-800 border border-gray-600 rounded p-3 max-h-96 overflow-y-auto">
                          <div 
                            className="text-xs text-gray-300"
                            dangerouslySetInnerHTML={{ 
                              __html: body ? generateHTMLTemplate(body, previewRecipient) : "Enter email body..." 
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        <strong>To:</strong> {previewRecipient.email || "No email"}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Send Button */}
            {recipients.length > 0 && subject && body && (
              <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="pt-6">
                  {error && (
                    <Alert className="bg-red-900/20 border-red-600/30 mb-4">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-200">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {isSending && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Sending emails...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleSend}
                    disabled={isSending}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    {isSending ? "Sending..." : `Send to ${recipients.length} Recipients`}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}