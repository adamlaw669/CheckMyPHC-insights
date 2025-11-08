"use client";

import { useState, useMemo } from "react";
import { useAlertsFeed } from "../../../hooks/useApi";
import { useAlertContext } from "../../../contexts/AlertContext";
import {
  getAlertTypeIcon,
  getAlertTypeColor,
  formatTimestamp,
  normalizePHCName,
  debounce,
} from "../../../lib/utils";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { ScrollArea } from "../../../components/ui/scroll-area";

interface AlertsFeedNewProps {
  isCompact?: boolean;
}

export default function AlertsFeedNew({ isCompact = false }: AlertsFeedNewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  const { data: alerts, isLoading, usingMockData, hasSimulatedAlerts } = useAlertsFeed();
  const { selectedAlert, setSelectedAlert } = useAlertContext();

  // Filter alerts based on search and filters
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];

    return alerts.filter((alert) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const phcName = (alert.phc || alert.phcName || "").toLowerCase();
        const lga = (alert.lga || "").toLowerCase();
        const state = (alert.state || "").toLowerCase();
        const message = (alert.message || "").toLowerCase();

        if (
          !phcName.includes(query) &&
          !lga.includes(query) &&
          !state.includes(query) &&
          !message.includes(query)
        ) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== "all" && alert.type !== typeFilter) {
        return false;
      }

      // State filter
      if (stateFilter !== "all" && alert.state !== stateFilter) {
        return false;
      }

      return true;
    });
  }, [alerts, searchQuery, typeFilter, stateFilter]);

  // Get unique states for filter
  const states = useMemo(() => {
    if (!alerts) return [];
    const uniqueStates = new Set(alerts.map((a) => a.state).filter(Boolean));
    return Array.from(uniqueStates).sort();
  }, [alerts]);

  // Limit display in compact mode
  const displayAlerts = isCompact ? filteredAlerts.slice(0, 5) : filteredAlerts;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header and Filters */}
      {!isCompact && (
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Alerts Feed</h2>
            {hasSimulatedAlerts && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {alerts?.filter((a) => a.simulated).length} Simulated
              </Badge>
            )}
          </div>

          {usingMockData && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-sm">
              ⚠️ Using mock data - API unavailable
            </div>
          )}

          {/* Search */}
          <Input
            type="text"
            placeholder="Search PHC, LGA, or State..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="outbreak">🔴 Outbreak</SelectItem>
                <SelectItem value="resource">📦 Resource</SelectItem>
                <SelectItem value="underserved">⚠️ Underserved</SelectItem>
                <SelectItem value="connectivity">📡 Connectivity</SelectItem>
              </SelectContent>
            </Select>

            {states.length > 0 && (
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state!}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(searchQuery || typeFilter !== "all" || stateFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                  setStateFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Alerts List */}
      <ScrollArea className={isCompact ? "h-[400px]" : "flex-1"}>
        <div className="space-y-2">
          {displayAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium">No alerts found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            displayAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              const bgColor = getAlertTypeColor(alert.type);

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(isSelected ? null : alert)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${isSelected ? "border-blue-500 bg-blue-50" : "border-transparent bg-white hover:bg-gray-50"}
                    shadow-sm hover:shadow-md
                  `}
                  style={!isSelected ? { borderLeftColor: bgColor, borderLeftWidth: 4 } : {}}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" role="img" aria-label={alert.type}>
                      {getAlertTypeIcon(alert.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {alert.phc || alert.phcName || "Unknown PHC"}
                        </h4>
                        {alert.simulated && (
                          <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                            Simulated
                          </Badge>
                        )}
                      </div>

                      {(alert.lga || alert.state) && (
                        <p className="text-xs text-gray-600 mb-2">
                          {[alert.lga, alert.state].filter(Boolean).join(", ")}
                        </p>
                      )}

                      {alert.message && (
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{alert.message}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: bgColor + "20", color: bgColor }}
                          >
                            {alert.type}
                          </Badge>
                          {alert.level && (
                            <Badge
                              variant={alert.level === "High" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {alert.level}
                            </Badge>
                          )}
                          {alert.channel && (
                            <Badge variant="outline" className="text-xs">
                              {alert.channel}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{formatTimestamp(alert.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer info */}
      {!isCompact && filteredAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
          Showing {displayAlerts.length} of {alerts?.length || 0} total alerts
        </div>
      )}
    </div>
  );
}
