import type React from "react"
import type { Metadata } from "next"
import { Work_Sans, Open_Sans } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import { AIAssistant } from "@/components/ai-assistant"
import "./globals.css"

const workSans = Work_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-work-sans",
  weight: ["400", "600", "700"],
})

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "TraceTrade - B2B Trading Marketplace",
  description: "African B2B trading marketplace with blockchain tokenization, auctions, and AI-powered features",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${workSans.variable} ${openSans.variable} antialiased`}>
      <body className="font-sans">
        <AuthProvider>
          {children}
          <AIAssistant />
        </AuthProvider>
      </body>
    </html>
  )
}
