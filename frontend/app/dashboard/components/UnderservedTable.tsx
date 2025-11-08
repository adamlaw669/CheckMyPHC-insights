"use client"

import { rankUnderserved } from "@/lib/insightEngine"

export default function UnderservedTable() {
  const underserved = rankUnderserved()

  return (
    <div className="bg-surface rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4">Top Underserved PHCs</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-text-primary">PHC Name</th>
              <th className="text-left py-3 px-4 font-semibold text-text-primary">LGA</th>
              <th className="text-left py-3 px-4 font-semibold text-text-primary">Underserved Index</th>
              <th className="text-left py-3 px-4 font-semibold text-text-primary">Status</th>
            </tr>
          </thead>
          <tbody>
            {underserved.slice(0, 10).map((phc, idx) => (
              <tr key={phc.id} className="border-b border-border hover:bg-background/50">
                <td className="py-3 px-4 text-text-primary font-medium">{phc.name}</td>
                <td className="py-3 px-4 text-text-secondary">{phc.lga}</td>
                <td className="py-3 px-4">
                  <span className="bg-warning/20 text-warning-dark px-2 py-1 rounded text-xs font-semibold">
                    {phc.index.toFixed(2)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold">
                    Targeted for intervention
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
