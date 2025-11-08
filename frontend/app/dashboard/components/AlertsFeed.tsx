"use client"

import { useEffect, useState } from "react"
import { getAlerts } from "@/lib/insightEngine"
import type { AlertItem } from "@/lib/mockData"

interface AlertsFeedProps {
  isCompact?: boolean
}

export default function AlertsFeed({ isCompact = false }: AlertsFeedProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAlerts = () => {
      setAlerts(
        getAlerts()
          .filter((a) => !a.resolved)
          .reverse(),
      )
      setIsLoading(false)
    }

    loadAlerts()

    const interval = setInterval(loadAlerts, 10000)
    return () => clearInterval(interval)
  }, [])

  const getAlertColor = (type: string) => {
    switch (type) {
      case "outbreak":
        return "bg-danger/10 text-danger"
      case "resource":
        return "bg-warning/10 text-warning"
      case "connectivity":
        return "bg-blue-100 text-blue-700"
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
      case "connectivity":
        return "📡"
      default:
        return "ℹ️"
    }
  }

  const displayAlerts = isCompact ? alerts.slice(0, 5) : alerts

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-border rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${isCompact ? "max-h-64 overflow-y-auto" : ""}`}>
      {displayAlerts.length === 0 ? (
        <p className="text-text-secondary text-sm py-4 text-center">No active alerts</p>
      ) : (
        displayAlerts.map((alert) => (
          <div key={alert.id} className={`p-3 rounded-lg ${getAlertColor(alert.type)} text-sm`}>
            <div className="flex items-start gap-2">
              <span className="text-lg">{getAlertIcon(alert.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{alert.message}</p>
                <p className="text-xs opacity-75">{new Date(alert.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
