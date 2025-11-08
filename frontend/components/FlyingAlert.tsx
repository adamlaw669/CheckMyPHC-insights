"use client"

export default function FlyingAlert({ type }: { type: string }) {
  const getIcon = () => {
    switch (type) {
      case "outbreak":
        return "🔴"
      case "resource":
        return "📦"
      case "connectivity":
        return "📡"
      default:
        return "⚠️"
    }
  }

  const getColor = () => {
    switch (type) {
      case "outbreak":
        return "bg-danger"
      case "resource":
        return "bg-warning"
      case "connectivity":
        return "bg-blue-500"
      default:
        return "bg-primary"
    }
  }

  return (
    <div
      className={`${getColor()} text-white px-4 py-3 rounded-lg shadow-lg font-semibold flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300`}
      style={{
        animation: "flyingIn 3s ease-out forwards",
      }}
    >
      <span className="text-xl">{getIcon()}</span>
      <span>Alert Sent!</span>
      <style>{`
        @keyframes flyingIn {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          80% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px);
          }
        }
      `}</style>
    </div>
  )
}
