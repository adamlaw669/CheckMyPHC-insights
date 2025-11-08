"use client";

import { useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useOutbreakAlerts } from "@/hooks/useApi";
import { normalizePHCName } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TrendsPanel() {
  const { data: phcs, isLoading } = useOutbreakAlerts();

  // Prepare data for top 5 PHCs by risk score
  const topRiskData = useMemo(() => {
    if (!phcs) return [];

    return phcs
      .filter((p) => p.shortage_score || p.resource_risk_score)
      .sort((a, b) => {
        const scoreA = a.shortage_score || a.resource_risk_score || 0;
        const scoreB = b.shortage_score || b.resource_risk_score || 0;
        return scoreB - scoreA;
      })
      .slice(0, 5)
      .map((p) => ({
        name: normalizePHCName(p).substring(0, 20),
        riskScore: ((p.shortage_score || p.resource_risk_score || 0) * 100).toFixed(1),
        drugStock: p.drug_stock_level || 0,
        cases: p.malaria_cases || 0,
      }));
  }, [phcs]);

  // Prepare data for alert level distribution
  const alertLevelData = useMemo(() => {
    if (!phcs) return [];

    const distribution = phcs.reduce(
      (acc, phc) => {
        const level = phc.alert_level || "Unknown";
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(distribution).map(([level, count]) => ({
      level,
      count,
    }));
  }, [phcs]);

  // Prepare time series mock data for demonstration
  const timeSeriesData = useMemo(() => {
    // In a real scenario, this would come from API with historical data
    return [
      { week: "Week 1", outbreaks: 3, resources: 5, underserved: 8 },
      { week: "Week 2", outbreaks: 5, resources: 7, underserved: 9 },
      { week: "Week 3", outbreaks: 4, resources: 6, underserved: 7 },
      { week: "Week 4", outbreaks: 7, resources: 9, underserved: 10 },
      { week: "Current", outbreaks: phcs?.filter((p) => p.alert_level === "High").length || 8, resources: phcs?.filter((p) => p.drug_stock_level && p.drug_stock_level < 30).length || 11, underserved: phcs?.filter((p) => p.underserved_flag).length || 12 },
    ];
  }, [phcs]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trends & Analytics</CardTitle>
        <CardDescription>PHC performance metrics and alert trends</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="risk" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="risk">Risk Scores</TabsTrigger>
            <TabsTrigger value="trends">Alert Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="risk" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRiskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} fontSize={11} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="riskScore" fill="#DC2626" name="Risk Score (%)" />
                <Bar dataKey="drugStock" fill="#10B981" name="Drug Stock (%)" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Top 5 PHCs by resource risk score
            </p>
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="outbreaks" stroke="#DC2626" strokeWidth={2} name="Outbreak Alerts" />
                <Line type="monotone" dataKey="resources" stroke="#EAB308" strokeWidth={2} name="Resource Alerts" />
                <Line type="monotone" dataKey="underserved" stroke="#F59E0B" strokeWidth={2} name="Underserved Alerts" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Alert trends over the past 4 weeks
            </p>
          </TabsContent>

          <TabsContent value="distribution" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={alertLevelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="level" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" name="PHC Count" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Distribution of PHCs by alert level
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
