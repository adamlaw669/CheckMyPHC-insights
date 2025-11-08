interface MetricCardProps {
  label: string
  value: number
  icon?: string
}

export default function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-md p-6 border border-border hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-text-secondary text-sm font-medium mb-2">{label}</p>
      <p className="text-4xl font-bold text-primary">{value}</p>
    </div>
  )
}
