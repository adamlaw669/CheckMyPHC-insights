"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import { PHCS } from "@/lib/mockData"
import { detectOutbreaks, rankUnderserved } from "@/lib/insightEngine"

export default function MapBackground() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !mapContainer.current) return

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current, {
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        keyboard: false,
        zoomControl: false,
      }).setView([9.081999, 8.675277], 7)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "",
        maxZoom: 12,
      }).addTo(map.current)
    }

    const outbreaks = detectOutbreaks()
    const underserved = rankUnderserved()

    // Add markers
    PHCS.forEach((phc) => {
      let color = "#10B981" // green
      if (outbreaks.some((o) => o.phcId === phc.id)) {
        color = "#DC2626" // red
      } else if (underserved.some((u) => u.id === phc.id)) {
        color = "#F59E0B" // orange
      }

      const markerHtml = `
        <div style="
          background-color: ${color};
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        "></div>
      `

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "landing-marker",
        iconSize: [16, 16],
      })

      L.marker([phc.lat, phc.lon], { icon: customIcon }).addTo(map.current!)
    })
  }, [mounted])

  if (!mounted) {
    return <div className="absolute inset-0 bg-gradient-to-br from-background to-primary/5" />
  }

  return <div ref={mapContainer} className="absolute inset-0 opacity-60" style={{ pointerEvents: "none" }} />
}
