"use client";

import { useState } from "react";
import { useAlertContext } from "../../../contexts/AlertContext";
import { normalizePHCName, normalizePHCLGA, normalizePHCState, formatTimestamp } from "../../../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Separator } from "../../../components/ui/separator";
import { MessageSquare, Phone, Mail, Megaphone, Trash2, Activity } from "lucide-react";
import { toast } from "sonner";
import type { PHC } from "../../../lib/types";

export default function SmartActionPanel() {
  const { selectedAlert, simulatedAlerts, clearAlerts } = useAlertContext();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAlerts = () => {
    setIsClearing(true);
    setTimeout(() => {
      clearAlerts();
      toast.success("Alert log cleared");
      setIsClearing(false);
    }, 300);
  };

  const getSuggestedActions = (alertType?: string) => {
    switch (alertType) {
      case "outbreak":
        return [
          { icon: MessageSquare, label: "Send SMS Alert", description: "Immediate notification to PHC staff", color: "text-blue-600" },
          { icon: Phone, label: "WhatsApp Broadcast", description: "Send to LGA health team", color: "text-green-600" },
          { icon: Megaphone, label: "Escalate to LGA", description: "Notify LGA health coordinator", color: "text-red-600" },
          { icon: Mail, label: "Email Report", description: "Send detailed report to state office", color: "text-gray-600" },
        ];
      case "resource":
        return [
          { icon: MessageSquare, label: "SMS to Warehouse", description: "Request urgent resupply", color: "text-blue-600" },
          { icon: Phone, label: "Call Supply Chain", description: "Expedite delivery", color: "text-green-600" },
          { icon: Megaphone, label: "Alert LGA Coordinator", description: "Coordinate emergency supply", color: "text-orange-600" },
        ];
      case "underserved":
        return [
          { icon: MessageSquare, label: "Schedule Intervention", description: "Mobile health team deployment", color: "text-blue-600" },
          { icon: Mail, label: "Resource Assessment", description: "Request detailed needs analysis", color: "text-gray-600" },
          { icon: Megaphone, label: "Advocacy Alert", description: "Flag for priority funding", color: "text-purple-600" },
        ];
      default:
        return [
          { icon: MessageSquare, label: "Send SMS", description: "Quick notification", color: "text-blue-600" },
          { icon: Phone, label: "WhatsApp", description: "Rich media message", color: "text-green-600" },
          { icon: Mail, label: "Email", description: "Formal communication", color: "text-gray-600" },
        ];
    }
  };

  const actions = getSuggestedActions(selectedAlert?.type);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Smart Actions
            </CardTitle>
            <CardDescription>Telecom-aware alert management</CardDescription>
          </div>
          {simulatedAlerts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAlerts}
              disabled={isClearing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Log
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {selectedAlert ? (
          <div className="space-y-4">
            {/* Selected Alert Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Selected Alert</h4>
              <p className="text-sm text-blue-800 font-medium">{selectedAlert.phc || selectedAlert.phcName}</p>
              <p className="text-xs text-blue-700 mt-1">
                {selectedAlert.lga && selectedAlert.state && `${selectedAlert.lga}, ${selectedAlert.state}`}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedAlert.type}
                </Badge>
                <Badge variant={selectedAlert.level === "High" ? "destructive" : "secondary"} className="text-xs">
                  {selectedAlert.level}
                </Badge>
              </div>
            </div>

            {/* Suggested Actions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Suggested Actions</h4>
              <div className="grid gap-2">
                {actions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="justify-start h-auto py-3 px-4 text-left"
                    onClick={() => toast.info(`Action "${action.label}" would be executed in production`)}
                  >
                    <action.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${action.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{action.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No alert selected</p>
            <p className="text-sm mt-1">Click an alert to see suggested actions</p>
          </div>
        )}

        {/* Alert Log */}
        {simulatedAlerts.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm">Alert Log</h4>
              <Badge variant="secondary">{simulatedAlerts.length}</Badge>
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {simulatedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 bg-white border border-gray-200 rounded-lg text-xs"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-gray-900">{alert.phc_name}</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {alert.channel}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2 line-clamp-2">{alert.message}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {alert.type}
                      </Badge>
                      <span className="text-gray-500">{formatTimestamp(alert.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
