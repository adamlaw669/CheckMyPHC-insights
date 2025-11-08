"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayoutNew from "./components/DashboardLayoutNew"

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const sessionUser = localStorage.getItem("sessionUser")
    if (!sessionUser) {
      router.push("/login")
    } else {
      setIsLoading(false)
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return <DashboardLayoutNew />
}
