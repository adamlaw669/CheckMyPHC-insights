"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import MetricCard from "./MetricCard"
import ChartCard from "./ChartCard"
import AlertsFeed from "./AlertsFeed"
import UnderservedTable from "./UnderservedTable"
import CapacityCard from "./CapacityCard"
import dynamic from "next/dynamic"
import { getDashboardMetrics } from "../../../lib/insightEngine"

const MapView = dynamic(() => import("./MapView"), { ssr: false })

export default function DashboardLayout() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [metrics, setMetrics] = useState(getDashboardMetrics())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const sessionUser = localStorage.getItem("sessionUser")
    if (sessionUser) {
      setUser(JSON.parse(sessionUser))
    }
    setMounted(true)

    const handleAlertsUpdated = () => {
      setMetrics(getDashboardMetrics())
    }

    window.addEventListener("alertsUpdated", handleAlertsUpdated)

    const interval = setInterval(() => {
      setMetrics(getDashboardMetrics())
    }, 8000)

    return () => {
      window.removeEventListener("alertsUpdated", handleAlertsUpdated)
      clearInterval(interval)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("sessionUser")
    router.push("/login")
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-surface border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            CheckMyPHC
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-text-primary font-medium">{user?.name || "User"}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Dashboard</h1>
          <p className="text-text-secondary">Real-time PHC intelligence and outbreak monitoring</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard label="Active PHCs" value={metrics.activePHCs} icon="🏥" />
          <MetricCard label="Weekly Visits" value={metrics.weeklyVisits} icon="👥" />
          <MetricCard label="Detected Anomalies" value={metrics.detectedAnomalies} icon="⚠️" />
          <MetricCard label="Outbreaks" value={metrics.predictedOutbreaks} icon="🔴" />
          <MetricCard label="Resource Alerts" value={metrics.resourceWarnings} icon="📦" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">PHC Status Map</h2>
              <MapView />
            </div>
          </div>
          <div className="bg-surface rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Recent Alerts</h2>
            <AlertsFeed isCompact />
          </div>
        </div>

        <div className="mb-8">
          <UnderservedTable />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard type="bar" />
          <ChartCard type="pie" />
        </div>

        <div className="mb-8">
          <CapacityCard />
        </div>

        <div className="flex justify-end">
          <Link
            href="/alerts"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium"
          >
            View All Alerts
          </Link>
        </div>
      </main>
    </div>
  )
}
