"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useOutbreakAlerts } from "../../../hooks/useApi";
import { useAlertContext } from "../../../contexts/AlertContext";
import {
  geocodePHCs,
  NIGERIA_BOUNDS,
  determineMarkerColor,
  createMarkerHTML,
} from "../../../lib/mapHelpers";
import { normalizePHCName, normalizePHCLGA, normalizePHCState, calculateMarkerSize } from "../../../lib/utils";
import type { PHC } from "../../../lib/types";
import { toast } from "sonner";

export default function MapOverview() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [mounted, setMounted] = useState(false);

  const { data: phcs, usingMockData } = useOutbreakAlerts();
  const { sendAlert } = useAlertContext();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView(
        [NIGERIA_BOUNDS.center.lat, NIGERIA_BOUNDS.center.lon],
        7
      );

      L.tileLayer(
        process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 18,
        }
      ).addTo(map.current);
    }

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      const phcList = Array.isArray(phcs) ? (phcs as PHC[]) : [];

      if (phcList.length === 0) return;

      // Geocode PHCs
      const geocodedPHCs = geocodePHCs(phcList);

      // Add markers
      geocodedPHCs.forEach((phc) => {
        if (typeof phc.lat !== "number" || typeof phc.lon !== "number") {
          return;
        }

        const color = determineMarkerColor(phc);
        const shortageScore =
          typeof phc.shortage_score === "number" ? phc.shortage_score : 0;
        const underservedIndex =
          typeof phc.underserved_index === "number" ? phc.underserved_index : 0;
        const markerScore = shortageScore > 0 ? shortageScore : underservedIndex;
        const maxScore = shortageScore > 0 ? 3 : 1;
        const size = calculateMarkerSize(markerScore, 0, maxScore || 1);

        const customIcon = L.divIcon({
          html: createMarkerHTML(phc, color, size),
          className: "custom-marker",
          iconSize: [size, size],
        });

        const marker = L.marker([phc.lat, phc.lon], { icon: customIcon }).addTo(
          map.current!
        );

        const phcName = normalizePHCName(phc);
        const lga = normalizePHCLGA(phc);
        const state = normalizePHCState(phc);

        const popupContent = `
        <div style="min-width: 280px; font-family: system-ui, -apple-system, sans-serif; padding: 4px;">
          <h3 style="margin: 0 0 12px 0; font-weight: 700; font-size: 16px; color: #111827;">${phcName}</h3>
          <div style="margin: 8px 0; padding: 8px; background: #F3F4F6; border-radius: 6px; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>LGA:</strong> ${lga}</p>
            <p style="margin: 4px 0;"><strong>State:</strong> ${state}</p>
            ${phc.malaria_cases ? `<p style="margin: 4px 0;"><strong>Malaria Cases:</strong> ${phc.malaria_cases}${phc.previous_cases ? ` (prev: ${phc.previous_cases})` : ""}</p>` : ""}
            ${phc.maternal_visits ? `<p style="margin: 4px 0;"><strong>Maternal Visits:</strong> ${phc.maternal_visits}</p>` : ""}
            ${phc.underserved_index ? `<p style="margin: 4px 0;"><strong>Underserved Index:</strong> ${phc.underserved_index.toFixed(2)}</p>` : ""}
            ${phc.shortage_score ? `<p style="margin: 4px 0;"><strong>Shortage Score:</strong> ${phc.shortage_score.toFixed(2)}</p>` : ""}
            ${phc.drug_stock_level !== undefined ? `<p style="margin: 4px 0;"><strong>Drug Stock:</strong> ${phc.drug_stock_level}%</p>` : ""}
            ${phc.alert_level ? `<p style="margin: 4px 0;"><strong>Alert Level:</strong> <span style="color: ${determineMarkerColor(phc)}; font-weight: 600;">${phc.alert_level}</span></p>` : ""}
          </div>
          <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px;">
            ${phc.alert_level === "High" ? `<button class="map-btn map-btn-danger" data-phc='${JSON.stringify(phc)}' data-type="outbreak">⚠️ Send Outbreak Alert</button>` : ""}
            ${phc.drug_stock_level !== undefined && phc.drug_stock_level < 30 ? `<button class="map-btn map-btn-warning" data-phc='${JSON.stringify(phc)}' data-type="resource">📦 Send Resource Alert</button>` : ""}
            <button class="map-btn map-btn-primary" data-phc='${JSON.stringify(phc)}' data-type="underserved">🎯 Send Intervention Alert</button>
          </div>
        </div>
      `;

        marker.bindPopup(popupContent, { maxWidth: 320 });

        // Handle button clicks in popup
        marker.on("popupopen", () => {
          const buttons = document.querySelectorAll(".map-btn");
          buttons.forEach((btn) => {
            btn.addEventListener("click", async (e) => {
              const target = e.target as HTMLElement;
              const phcData = target.getAttribute("data-phc");
              const alertType = target.getAttribute("data-type") as
                | "outbreak"
                | "resource"
                | "underserved";

              if (phcData && alertType) {
                const phcObj: PHC = JSON.parse(phcData);
                try {
                  await sendAlert(phcObj, alertType);
                  toast.success(
                    `Simulated ${alertType} alert sent to ${normalizePHCName(phcObj)}`
                  );
                } catch (error) {
                  toast.error("Failed to send alert");
                }
              }
            });
          });
        });

        markersRef.current.set(phc.id || phcName.toLowerCase(), marker);
    });

    // Fit bounds to markers
    if (geocodedPHCs.length > 0) {
      const bounds = L.latLngBounds(geocodedPHCs.map((p) => [p.lat, p.lon]));
      map.current?.fitBounds(bounds, { padding: [50, 50] });
    }
    }, [mounted, phcs, sendAlert]);

  if (!mounted) {
    return (
      <div className="w-full h-[500px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {usingMockData && (
        <div className="absolute top-2 right-2 z-[1000] bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1 rounded-md text-xs font-medium">
          Using Mock Data
        </div>
      )}
      <div
        ref={mapContainer}
        className="w-full h-[500px] rounded-lg border border-gray-200 shadow-sm"
        style={{ minHeight: "500px" }}
      />
      <style jsx global>{`
        .map-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
        }
        .map-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .map-btn-danger {
          background-color: #DC2626;
          color: white;
        }
        .map-btn-danger:hover {
          background-color: #B91C1C;
        }
        .map-btn-warning {
          background-color: #EAB308;
          color: #1F2937;
        }
        .map-btn-warning:hover {
          background-color: #CA8A04;
        }
        .map-btn-primary {
          background-color: #0A6C6D;
          color: white;
        }
        .map-btn-primary:hover {
          background-color: #085456;
        }
        .custom-marker {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .leaflet-popup-content {
          margin: 12px;
        }
      `}</style>
    </div>
  );
}
