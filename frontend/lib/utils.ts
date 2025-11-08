import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  AlertCircle,
  TrendingUp,
  PackageX,
  MapPin,
  AlertTriangle,
  Activity,
} from "lucide-react";
import type { PHC, SimulatedAlert } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simulated Alerts Management
export function loadSimulatedAlerts(): SimulatedAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("simulatedAlerts");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading simulated alerts:", error);
    return [];
  }
}

export async function sendSimulatedAlert(
  phc: PHC,
  type: "outbreak" | "resource" | "underserved"
): Promise<void> {
  if (typeof window === "undefined") return;

  const alert: SimulatedAlert = {
    id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    phc_id: phc.id,
    phc_name: phc.name || phc["Name of Primary Health Center"] || "Unknown PHC",
    phc_lga: phc["PHC LGA"] || "",
    phc_state: phc["State of PHC"] || "",
    alert_type: type,
    timestamp: new Date().toISOString(),
    severity:
      type === "outbreak" ? "high" : type === "resource" ? "medium" : "low",
    message: generateAlertMessage(phc, type),
  };

  const alerts = loadSimulatedAlerts();
  alerts.unshift(alert);

  // Keep only last 100 alerts
  const trimmed = alerts.slice(0, 100);
  localStorage.setItem("simulatedAlerts", JSON.stringify(trimmed));

  // Dispatch event for listeners
  window.dispatchEvent(new Event("alertSimulated"));
}

function generateAlertMessage(
  phc: PHC,
  type: "outbreak" | "resource" | "underserved"
): string {
  const name = phc.name || phc["Name of Primary Health Center"] || "Unknown PHC";

  switch (type) {
    case "outbreak":
      return `Malaria outbreak detected at ${name}. Cases increased significantly.`;
    case "resource":
      return `Resource shortage at ${name}. Critical drug stock levels reported.`;
    case "underserved":
      return `${name} flagged as underserved. Requires immediate attention.`;
    default:
      return `Alert generated for ${name}.`;
  }
}

// PHC Data Normalization
export function normalizePHCName(phc: PHC): string {
  return (
    phc.name ||
    phc["Name of Primary Health Center"] ||
    phc["PHC Name"] ||
    "Unknown PHC"
  );
}

export function normalizePHCLGA(phc: PHC): string {
  return phc["PHC LGA"] || phc.lga || "Unknown LGA";
}

export function normalizePHCState(phc: PHC): string {
  return phc["State of PHC"] || phc.state || "Unknown State";
}

// Alert Type Utilities
export function getAlertTypeIcon(type: string) {
  switch (type?.toLowerCase()) {
    case "outbreak":
      return AlertCircle;
    case "resource":
      return PackageX;
    case "underserved":
      return MapPin;
    case "warning":
      return AlertTriangle;
    case "trend":
      return TrendingUp;
    default:
      return Activity;
  }
}

export function getAlertTypeColor(type: string): string {
  switch (type?.toLowerCase()) {
    case "outbreak":
      return "destructive";
    case "resource":
      return "warning";
    case "underserved":
      return "default";
    case "warning":
      return "warning";
    default:
      return "secondary";
  }
}

// Timestamp Formatting
export function formatTimestamp(timestamp: string | Date): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch (error) {
    return "Unknown";
  }
}

// Debounce Utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Map Marker Size Calculation
export function calculateMarkerSize(
  value: number,
  min: number,
  max: number
): number {
  // Scale from 20 to 60 pixels
  const minSize = 20;
  const maxSize = 60;
  const normalized = (value - min) / (max - min);
  return minSize + normalized * (maxSize - minSize);
}

// Format Number with Commas
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

// Calculate Percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Truncate Text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Export to CSV
export function exportToCSV(data: any[], filename: string = "export.csv"): void {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(","),
    // Data rows
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? "");
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
