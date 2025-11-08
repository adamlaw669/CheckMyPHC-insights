"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import FlyingAlert from "@/components/FlyingAlert"

const MapBackground = dynamic(() => import("@/components/MapBackground"), { ssr: false })

export default function LandingPage() {
  const [flyingAlerts, setFlyingAlerts] = useState<{ id: string; type: string }[]>([])

  useEffect(() => {
    const handleAlertCreated = ((event: CustomEvent) => {
      const newAlert = {
        id: `flying-${Date.now()}`,
        type: event.detail.type || "outbreak",
      }
      setFlyingAlerts((prev) => [...prev, newAlert])
      setTimeout(() => {
        setFlyingAlerts((prev) => prev.filter((a) => a.id !== newAlert.id))
      }, 3000)
    }) as EventListener

    window.addEventListener("alertCreated", handleAlertCreated)
    return () => window.removeEventListener("alertCreated", handleAlertCreated)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Flying Alerts */}
      <div className="fixed top-20 right-4 pointer-events-none z-50 space-y-2">
        {flyingAlerts.map((alert) => (
          <FlyingAlert key={alert.id} type={alert.type} />
        ))}
      </div>

      {/* Map Background */}
      <MapBackground />

      {/* Hero Section with overlay */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 relative z-10">
        <div className="max-w-2xl text-center bg-white/95 backdrop-blur-sm p-12 rounded-2xl shadow-2xl">
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6">
            PHC <span className="text-primary">Intelligence</span> at Your Fingertips
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            Real-time monitoring, outbreak detection, and resource optimization for Primary Health Centers across
            Nigeria.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors shadow-lg"
          >
            Try Demo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 bg-white/90 relative z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-sm text-text-secondary">
          <p>© 2025 CheckMyPHC Insights. All rights reserved.</p>
          <p>Hackathon Demo</p>
        </div>
      </footer>
    </div>
  )
}
