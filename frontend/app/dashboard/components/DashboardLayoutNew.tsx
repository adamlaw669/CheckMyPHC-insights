"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AlertProvider } from "../../../contexts/AlertContext";
import { useOutbreakAlerts, useUnderserved, refetchAllData } from "../../../hooks/useApi";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Toaster } from "../../../components/ui/sonner";
import { RefreshCw, LogOut } from "lucide-react";
import TrendsPanel from "./TrendsPanel";
import RankingsPanel from "./RankingsPanel";
import SmartActionPanel from "./SmartActionPanel";
import AlertsFeedNew from "./AlertsFeedNew";

// Dynamic imports for client-side only components
const MapOverview = dynamic(() => import("./MapOverview"), { ssr: false });

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: string;
  trend?: "up" | "down";
}

function MetricCard({ label, value, icon, trend }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      {trend && (
        <div className={`text-xs mt-2 ${trend === "up" ? "text-red-600" : "text-green-600"}`}>
          {trend === "up" ? "↑" : "↓"} vs last week
        </div>
      )}
    </div>
  );
}

function DashboardLayoutContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: outbreakData } = useOutbreakAlerts();
  const { data: underservedData } = useUnderserved();

  useEffect(() => {
    const sessionUser = localStorage.getItem("sessionUser");
    if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sessionUser");
    router.push("/login");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refetchAllData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Calculate metrics
  const metrics = {
    totalPHCs: outbreakData?.length || 0,
    highAlerts: outbreakData?.filter((p) => p.alert_level === "High").length || 0,
    resourceWarnings: outbreakData?.filter((p) => p.drug_stock_level && p.drug_stock_level < 30).length || 0,
    underservedCount: underservedData?.data?.length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-2xl font-bold text-primary">
                CheckMyPHC
              </Link>
              <Badge variant="outline" className="text-xs">
                Dashboard v2.0
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <span className="text-sm text-gray-700 font-medium">{user?.name || "User"}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PHC Intelligence Dashboard</h1>
          <p className="text-gray-600">
            Real-time monitoring and outbreak detection across Nigeria's Primary Health Centers
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Tracked PHCs" value={metrics.totalPHCs} icon="🏥" />
          <MetricCard label="High Alerts" value={metrics.highAlerts} icon="🔴" trend="up" />
          <MetricCard label="Resource Warnings" value={metrics.resourceWarnings} icon="📦" trend="up" />
          <MetricCard label="Underserved PHCs" value={metrics.underservedCount} icon="⚠️" />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Map - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">PHC Status Map</h2>
              <MapOverview />
            </div>
          </div>

          {/* Alerts Feed - 1/3 width */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <AlertsFeedNew isCompact />
          </div>
        </div>

        {/* Rankings */}
        <div className="mb-8">
          <RankingsPanel />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Trends - 2/3 width */}
          <div className="lg:col-span-2">
            <TrendsPanel />
          </div>

          {/* Smart Actions - 1/3 width */}
          <div>
            <SmartActionPanel />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>© 2025 CheckMyPHC Insights. Built for Nigeria PHC Intelligence.</p>
          <p className="mt-1">Powered by AI-driven outbreak detection and resource optimization</p>
        </div>
      </main>

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}

export default function DashboardLayoutNew() {
  return (
    <AlertProvider>
      <DashboardLayoutContent />
    </AlertProvider>
  );
}
