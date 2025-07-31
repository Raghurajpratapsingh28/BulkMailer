import * as nodemailer from 'nodemailer'
import { prisma } from './prisma'

export interface EmailConfig {
  email: string
  password: string
}

export interface EmailTemplate {
  subject: string
  body: string
}

export interface Recipient {
  [key: string]: string
}

export async function createTransporter(config: EmailConfig) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.email,
      pass: config.password,
    },
  })
}

export async function testEmailConnection(config: EmailConfig): Promise<boolean> {
  try {
    const transporter = await createTransporter(config)
    await transporter.verify()
    return true
  } catch (error) {
    console.error('Email connection test failed:', error)
    return false
  }
}

export function replacePlaceholders(template: string, data: Recipient): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] || match
  })
}

export function generateHTMLTemplate(content: string, recipient: Recipient, template: string = "modern"): string {
  const processedContent = replacePlaceholders(content, recipient)
  
  if (template === "modern") {
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
  } else if (template === "minimal") {
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

export async function sendBulkEmails(
  userId: string,
  config: EmailConfig,
  template: EmailTemplate,
  recipients: Recipient[],
  emailTemplate: string = "modern",
  campaignId?: string
): Promise<Array<{ email: string; status: 'sent' | 'failed'; error?: string }>> {
  const transporter = await createTransporter(config)
  const results: Array<{ email: string; status: 'sent' | 'failed'; error?: string }> = []

  for (const recipient of recipients) {
    try {
      const subject = replacePlaceholders(template.subject, recipient)
      const html = generateHTMLTemplate(template.body, recipient, emailTemplate)

      await transporter.sendMail({
        from: config.email,
        to: recipient.email,
        subject,
        html,
      })

      await prisma.emailLog.create({
        data: {
          userId,
          campaignId,
          subject,
          recipientEmail: recipient.email,
          status: 'sent',
        },
      })

      results.push({ email: recipient.email, status: 'sent' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await prisma.emailLog.create({
        data: {
          userId,
          campaignId,
          subject: template.subject,
          recipientEmail: recipient.email,
          status: 'failed',
          error: errorMessage,
        },
      })

      results.push({ email: recipient.email, status: 'failed', error: errorMessage })
    }
  }

  return results
}