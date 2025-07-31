"use client"

import { ReactNode } from "react"
import ParticleBackground from "./ParticleBackground"
import Navbar from "./Navbar"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative">
      <ParticleBackground />
      <Navbar />
      <main className="relative z-10">
        {children}
      </main>
    </div>
  )
}