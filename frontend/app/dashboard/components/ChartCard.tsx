"use client"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { PHCS, DRUG_STOCKS } from "@/lib/mockData"

interface ChartCardProps {
  type: "bar" | "line" | "pie"
}

export default function ChartCard({ type }: ChartCardProps) {
  const barData = PHCS.slice(0, 6).map((phc) => ({
    name: phc.name.split(" ")[0],
    cases: phc.malaria_cases,
  }))

  const lineData = PHCS.slice(0, 6).map((phc) => ({
    name: phc.name.split(" ")[0],
    visits: phc.maternal_visits || 0,
  }))

  const chartColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"]

  return (
    <div className="bg-surface rounded-2xl shadow-md p-6 border border-border">
      <h3 className="text-lg font-bold text-text-primary mb-4">
        {type === "bar"
          ? "Malaria Cases by PHC"
          : type === "line"
            ? "Maternal Visits Trend"
            : "Drug Stock Distribution"}
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        {type === "bar" && (
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cases" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
          </BarChart>
        )}

        {type === "line" && (
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="visits"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={{ fill: "var(--color-primary)" }}
            />
          </LineChart>
        )}

        {type === "pie" && (
          <PieChart>
            <Pie
              data={DRUG_STOCKS}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {DRUG_STOCKS.map((_, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
