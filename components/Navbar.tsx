"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, LogOut, User, Settings } from "lucide-react"
import Link from "next/link"

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">BulkMailer</span>
            </Link>
          </div>

          {session && (
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Dashboard
                </Button>
              </Link>
              <Link href="/setup">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Setup
                </Button>
              </Link>
              <Link href="/send">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Send Emails
                </Button>
              </Link>
              
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user?.image || ""} />
                  <AvatarFallback className="bg-gray-700 text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-300">{session.user?.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-gray-300 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}