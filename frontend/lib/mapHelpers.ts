import L from "leaflet";
import type { PHC } from "./types";
import lgaCentroids from "../mocks/lga_centroids.json";

// Nigeria map bounds [Southwest, Northeast]
export const NIGERIA_BOUNDS: L.LatLngBoundsExpression = [
  [4.0, 2.5], // Southwest corner
  [14.0, 15.0], // Northeast corner
];

// Default center of Nigeria
export const NIGERIA_CENTER: [number, number] = [9.082, 8.6753];

// Default zoom level
export const DEFAULT_ZOOM = 6;

/**
 * Geocode PHCs by matching with LGA centroids or using existing coordinates
 */
export function geocodePHCs(phcs: PHC[]): PHC[] {
  return phcs.map((phc) => {
    // If PHC already has coordinates, use them
    if (phc.lat && phc.lon) {
      return phc;
    }

    if (phc.latitude && phc.longitude) {
      return {
        ...phc,
        lat: phc.latitude,
        lon: phc.longitude,
      };
    }

    // Otherwise, try to match with LGA centroid
    const lgaName = phc["PHC LGA"] || phc.lga || "";
    const centroid = findLGACentroid(lgaName);

    if (centroid) {
      return {
        ...phc,
        lat: centroid.lat,
        lon: centroid.lon,
      };
    }

    // If no match, return PHC with no coordinates
    // (it won't be displayed on the map)
    return phc;
  });
}

/**
 * Find LGA centroid from the centroids database
 */
function findLGACentroid(lgaName: string): { lat: number; lon: number } | null {
  if (!lgaName) return null;

  const normalized = lgaName.toLowerCase().trim();

  // Find exact match or partial match
  const match = (lgaCentroids as any[]).find((centroid) => {
    const centroidLGA = centroid.lga?.toLowerCase().trim() || "";
    return (
      centroidLGA === normalized ||
      centroidLGA.includes(normalized) ||
      normalized.includes(centroidLGA)
    );
  });

  if (match && match.lat && match.lon) {
    return {
      lat: parseFloat(match.lat),
      lon: parseFloat(match.lon),
    };
  }

  return null;
}

/**
 * Determine marker color based on alert level or score
 */
export function determineMarkerColor(phc: PHC): string {
  // Priority 1: Use alert_level if available
  if (phc.alert_level) {
    switch (phc.alert_level.toLowerCase()) {
      case "high":
      case "critical":
        return "#ef4444"; // red
      case "medium":
        return "#f59e0b"; // orange
      case "low":
        return "#10b981"; // green
      default:
        return "#6b7280"; // gray
    }
  }

  // Priority 2: Use shortage_score or underserved_index
  const score = phc.shortage_score || phc.underserved_index || 0;

  if (score >= 0.75) return "#ef4444"; // red (high risk)
  if (score >= 0.5) return "#f59e0b"; // orange (medium risk)
  if (score >= 0.25) return "#fbbf24"; // yellow (low risk)
  return "#10b981"; // green (minimal risk)
}

/**
 * Create HTML for custom marker
 */
export function createMarkerHTML(phc: PHC, color: string, size: number = 30): string {
  const name = phc.name || phc["Name of Primary Health Center"] || "Unknown PHC";
  const lga = phc["PHC LGA"] || phc.lga || "";
  const state = phc["State of PHC"] || phc.state || "";
  const alertLevel = phc.alert_level || "Unknown";
  
  // Create marker icon
  const iconSize = size;
  const pulseSize = iconSize + 10;

  return `
    <div class="custom-marker" style="position: relative; width: ${iconSize}px; height: ${iconSize}px;">
      <div style="
        position: absolute;
        width: ${pulseSize}px;
        height: ${pulseSize}px;
        left: -${(pulseSize - iconSize) / 2}px;
        top: -${(pulseSize - iconSize) / 2}px;
        background: ${color};
        opacity: 0.3;
        border-radius: 50%;
        animation: pulse 2s infinite;
      "></div>
      <div style="
        position: absolute;
        width: ${iconSize}px;
        height: ${iconSize}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.max(iconSize / 3, 10)}px;
      ">!</div>
    </div>
  `;
}

/**
 * Create popup content for a PHC marker
 */
export function createPopupContent(phc: PHC): string {
  const name = phc.name || phc["Name of Primary Health Center"] || "Unknown PHC";
  const lga = phc["PHC LGA"] || phc.lga || "";
  const state = phc["State of PHC"] || phc.state || "";
  const alertLevel = phc.alert_level || "Unknown";
  const score = phc.shortage_score || phc.underserved_index || 0;

  return `
    <div style="padding: 8px; min-width: 200px;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1f2937;">
        ${name}
      </h3>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
        <div><strong>LGA:</strong> ${lga}</div>
        <div><strong>State:</strong> ${state}</div>
        <div><strong>Alert Level:</strong> ${alertLevel}</div>
        <div><strong>Score:</strong> ${score.toFixed(2)}</div>
      </div>
      ${phc.malaria_cases ? `<div style="font-size: 12px; color: #6b7280;"><strong>Malaria Cases:</strong> ${phc.malaria_cases}</div>` : ""}
      ${phc.drug_stock_level !== undefined ? `<div style="font-size: 12px; color: #6b7280;"><strong>Drug Stock:</strong> ${phc.drug_stock_level}%</div>` : ""}
      ${phc.staff_count ? `<div style="font-size: 12px; color: #6b7280;"><strong>Staff:</strong> ${phc.staff_count}</div>` : ""}
      ${phc.population_served ? `<div style="font-size: 12px; color: #6b7280;"><strong>Population:</strong> ${phc.population_served.toLocaleString()}</div>` : ""}
    </div>
  `;
}

/**
 * Get bounds for a collection of PHCs
 */
export function getPHCBounds(phcs: PHC[]): L.LatLngBounds | null {
  const validPHCs = phcs.filter((phc) => phc.lat && phc.lon);

  if (validPHCs.length === 0) return null;

  const bounds = L.latLngBounds(
    validPHCs.map((phc) => [phc.lat!, phc.lon!] as [number, number])
  );

  return bounds;
}

/**
 * Calculate distance between two coordinates (in kilometers)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find nearest PHCs to a given coordinate
 */
export function findNearestPHCs(
  lat: number,
  lon: number,
  phcs: PHC[],
  count: number = 5
): PHC[] {
  const validPHCs = phcs.filter((phc) => phc.lat && phc.lon);

  const withDistances = validPHCs.map((phc) => ({
    phc,
    distance: calculateDistance(lat, lon, phc.lat!, phc.lon!),
  }));

  withDistances.sort((a, b) => a.distance - b.distance);

  return withDistances.slice(0, count).map((item) => item.phc);
}

/**
 * Create cluster icon HTML
 */
export function createClusterIcon(cluster: any): L.DivIcon {
  const childCount = cluster.getChildCount();
  let className = "marker-cluster-";

  if (childCount < 10) {
    className += "small";
  } else if (childCount < 100) {
    className += "medium";
  } else {
    className += "large";
  }

  return L.divIcon({
    html: `<div><span>${childCount}</span></div>`,
    className: `marker-cluster ${className}`,
    iconSize: L.point(40, 40),
  });
}
