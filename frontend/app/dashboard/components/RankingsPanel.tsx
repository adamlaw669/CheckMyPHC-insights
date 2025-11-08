"use client";

import { useUnderserved } from "@/hooks/useApi";
import { normalizePHCName, normalizePHCLGA, normalizePHCState, exportToCSV } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingUp } from "lucide-react";

export default function RankingsPanel() {
  const { data, isLoading, usingMockData } = useUnderserved({ top_n: 10 });

  const handleExportCSV = () => {
    if (!data?.data) return;

    const exportData = data.data.map((phc, idx) => ({
      Rank: idx + 1,
      PHC: normalizePHCName(phc),
      LGA: normalizePHCLGA(phc),
      State: normalizePHCState(phc),
      "Underserved Index": phc.underserved_index?.toFixed(3) || "N/A",
      "Resource Risk": phc.resource_risk_score?.toFixed(3) || "N/A",
      "Drug Stock %": phc.drug_stock_level || "N/A",
      "Staff Count": phc.staff_count || "N/A",
      "Population Served": phc.population_served || "N/A",
    }));

    exportToCSV(exportData, `underserved_phcs_${new Date().toISOString().split("T")[0]}.csv`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  const underservedPHCs = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              Top Underserved PHCs
            </CardTitle>
            <CardDescription>
              Priority intervention list - {underservedPHCs.length} PHCs requiring immediate attention
            </CardDescription>
          </div>
          <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={underservedPHCs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {usingMockData && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-sm">
            ⚠️ Using mock data - API unavailable
          </div>
        )}

        {underservedPHCs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium">No underserved PHCs data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>PHC Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Underserved Index</TableHead>
                  <TableHead className="text-right">Risk Score</TableHead>
                  <TableHead className="text-right">Drug Stock</TableHead>
                  <TableHead className="text-right">Population</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {underservedPHCs.map((phc, idx) => {
                  const underservedIndex = phc.underserved_index || 0;
                  const riskScore = phc.resource_risk_score || 0;
                  const isTopTen = idx < 10;

                  return (
                    <TableRow key={phc.id || idx} className={isTopTen && idx === 0 ? "bg-red-50" : ""}>
                      <TableCell className="font-bold">
                        {idx === 0 && <Badge variant="destructive" className="w-8">🏆 {idx + 1}</Badge>}
                        {idx > 0 && <span className={idx < 3 ? "text-red-600" : ""}>{idx + 1}</span>}
                      </TableCell>
                      <TableCell className="font-medium">{normalizePHCName(phc)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {normalizePHCLGA(phc)}, {normalizePHCState(phc)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={underservedIndex > 0.7 ? "destructive" : "secondary"}
                          className="font-mono"
                        >
                          {underservedIndex.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={riskScore > 0.7 ? "destructive" : "secondary"}
                          className="font-mono"
                        >
                          {riskScore.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={phc.drug_stock_level !== undefined && phc.drug_stock_level < 30 ? "text-red-600 font-semibold" : ""}>
                          {phc.drug_stock_level !== undefined ? `${phc.drug_stock_level}%` : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {phc.population_served?.toLocaleString() || "N/A"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {data?.summary && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 flex justify-between">
            <span>Total PHCs: {data.summary.total_phcs || "N/A"}</span>
            {data.summary.state_filter && <span>Filtered by: {data.summary.state_filter}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
