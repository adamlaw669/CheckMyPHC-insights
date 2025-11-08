"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import { PHCS } from "@/lib/mockData"
import type { PHC } from "@/lib/types" // Declare PHC type
import {
  detectOutbreaks,
  rankUnderserved,
  detectResourceWarnings,
  getTelecomAdvice,
  sendAlert,
  underservedIndex,
} from "@/lib/insightEngine"

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const [mounted, setMounted] = useState(false)
  const [alertSent, setAlertSent] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSendAlert = (phcId: string, phcName: string, alertType: "outbreak" | "resource" | "underserved") => {
    sendAlert(phcId, alertType)

    window.dispatchEvent(
      new CustomEvent("alertCreated", {
        detail: { type: alertType },
      }),
    )

    setAlertSent(!alertSent)
    window.dispatchEvent(new Event("alertsUpdated"))
  }

  const getMarkerColor = (phc: PHC, outbreaks: any[], underserved: any[], resourceWarnings: any[]): string => {
    // Check outbreak first (highest priority)
    if (outbreaks.some((o) => o.phcId === phc.id)) {
      return "#DC2626" // red
    }
    // Check resource warning (medium priority)
    if (resourceWarnings.some((r) => r.phcId === phc.id)) {
      return "#EAB308" // yellow
    }
    // Check underserved (lower priority)
    if (underserved.some((u) => u.id === phc.id)) {
      return "#F59E0B" // orange
    }
    // Default: green
    return "#10B981"
  }

  useEffect(() => {
    if (!mounted || !mapContainer.current) return

    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([9.081999, 8.675277], 7)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 12,
      }).addTo(map.current)
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    const outbreaks = detectOutbreaks()
    const underserved = rankUnderserved()
    const resourceWarnings = detectResourceWarnings()
    const telecomAdvice = getTelecomAdvice()

    PHCS.forEach((phc) => {
      const color = getMarkerColor(phc, outbreaks, underserved, resourceWarnings)

      const markerHtml = `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        "></div>
      `

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-marker",
        iconSize: [24, 24],
      })

      const marker = L.marker([phc.lat, phc.lon], { icon: customIcon }).addTo(map.current!)

      const telecomRec = telecomAdvice.find((t) => t.phcId === phc.id)
      const underservedIdx = underservedIndex(phc)
      const isOutbreak = outbreaks.some((o) => o.phcId === phc.id)
      const hasResourceWarning = resourceWarnings.some((r) => r.phcId === phc.id)

      const popupContent = `
        <div style="min-width: 250px; font-family: Poppins, sans-serif;">
          <h3 style="margin: 0 0 12px 0; font-weight: 700; font-size: 14px;">${phc.name}</h3>
          <p style="margin: 4px 0; font-size: 12px;"><strong>LGA:</strong> ${phc.lga}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Malaria Cases:</strong> ${phc.malaria_cases} (was ${phc.previous_cases})</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Maternal Visits:</strong> ${phc.maternal_visits}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Underserved Index:</strong> ${underservedIdx}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Drug Stock:</strong> ${phc.drug_stock_level}%</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Telecom Channel:</strong> ${telecomRec?.recommended_channel}</p>
          <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
            ${isOutbreak ? `<button onclick="window.sendAlertForPHC('${phc.id}', '${phc.name}', 'outbreak')" style="padding: 6px 12px; background-color: #DC2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">Send Outbreak Alert</button>` : ""}
            ${hasResourceWarning ? `<button onclick="window.sendAlertForPHC('${phc.id}', '${phc.name}', 'resource')" style="padding: 6px 12px; background-color: #EAB308; color: #1f2937; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">Send Resource Alert</button>` : ""}
            <button onclick="window.sendAlertForPHC('${phc.id}', '${phc.name}', 'underserved')" style="padding: 6px 12px; background-color: #0A6C6D; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">Send Intervention Alert</button>
          </div>
        </div>
      `

      marker.bindPopup(popupContent)
      markersRef.current.set(phc.id, marker)
    })
    ;(window as any).sendAlertForPHC = (
      phcId: string,
      phcName: string,
      alertType: "outbreak" | "resource" | "underserved",
    ) => {
      handleSendAlert(phcId, phcName, alertType)
    }
  }, [mounted, alertSent])

  if (!mounted) {
    return <div className="w-full h-96 bg-border rounded-lg animate-pulse"></div>
  }

  return (
    <div
      ref={mapContainer}
      className="w-full h-96 bg-background rounded-lg border border-border"
      style={{ minHeight: "400px" }}
    />
  )
}
