"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAlertsFeed } from "@/hooks/useApi"
import type { AlertFeedItem } from "@/lib/types"

export default function AlertsPage() {
  const router = useRouter()
  const { data: alerts = [], isLoading } = useAlertsFeed()
  const [filter, setFilter] = useState<"all" | "active">("active")
  const [resolvedAlerts, setResolvedAlerts] = useState<Set<string>>(new Set())

  useEffect(() => {
    const sessionUser = localStorage.getItem("sessionUser")
    if (!sessionUser) {
      router.push("/login")
      return
    }

    // Load resolved alerts from localStorage
    const stored = localStorage.getItem("resolvedAlerts")
    if (stored) {
      try {
        setResolvedAlerts(new Set(JSON.parse(stored)))
      } catch (e) {
        console.error("Failed to load resolved alerts", e)
      }
    }
  }, [router])

  const handleMarkResolved = (alertId: string) => {
    const newResolved = new Set(resolvedAlerts)
    newResolved.add(alertId)
    setResolvedAlerts(newResolved)
    localStorage.setItem("resolvedAlerts", JSON.stringify(Array.from(newResolved)))
  }

  const getFilteredAlerts = () => {
    switch (filter) {
      case "active":
        return alerts.filter((a) => !resolvedAlerts.has(a.id || ""))
      default:
        return alerts
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "outbreak":
        return "border-danger bg-danger/5"
      case "resource":
        return "border-warning bg-warning/5"
      case "underserved":
        return "border-primary bg-primary/5"
      default:
        return "border-border bg-surface"
    }
  }

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case "outbreak":
        return "bg-danger text-white"
      case "resource":
        return "bg-warning text-text-primary"
      case "underserved":
        return "bg-primary text-white"
      default:
        return "bg-border text-text-secondary"
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "outbreak":
        return "🔴"
      case "resource":
        return "📦"
      case "underserved":
        return "🎯"
      default:
        return "ℹ️"
    }
  }

  const filteredAlerts = getFilteredAlerts().sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-surface border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            CheckMyPHC
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Alerts Center</h1>
          <p className="text-text-secondary">
            Monitor and manage all PHC alerts including outbreaks, resources, and interventions
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {(["all", "active"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                filter === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}{" "}
              <span className="text-xs ml-1">
                (
                {filter === "all"
                  ? alerts.length
                  : alerts.filter((a) => !resolvedAlerts.has(a.id || "")).length}
                )
              </span>
            </button>
          ))}
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-border rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-2xl border border-border">
            <p className="text-text-secondary text-lg mb-2">No alerts found</p>
            <p className="text-text-secondary text-sm">
              {filter === "resolved" ? "You have no resolved alerts" : "Great news! No active alerts at this time."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const isResolved = resolvedAlerts.has(alert.id || "")
              return (
                <div key={alert.id} className={`border rounded-2xl p-4 ${getAlertColor(alert.type || "")}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <span className="text-3xl">{getAlertIcon(alert.type || "")}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${getAlertBadgeColor(alert.type || "")}`}>
                            {(alert.type || "").toUpperCase()}
                          </span>
                          {isResolved && (
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-success text-white">
                              RESOLVED
                            </span>
                          )}
                          {alert.simulated && (
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-500 text-white">
                              SIMULATED
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-text-primary mb-1">{alert.message || `Alert from ${alert.phc || alert.phcName}`}</p>
                        <p className="text-sm text-text-secondary">
                          {alert.phc || alert.phcName} • {alert.lga} • {alert.state}
                        </p>
                        <p className="text-xs text-text-secondary mt-2">{alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "N/A"}</p>
                      </div>
                    </div>

                    {!isResolved && (
                      <button
                        onClick={() => handleMarkResolved(alert.id || "")}
                        className="px-4 py-2 bg-success text-white rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap text-sm"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
