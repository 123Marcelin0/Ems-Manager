"use client"

import { Users, UserCheck, UserX } from "lucide-react"

interface StatsCardsProps {
  stats: {
    total: number
    available: number
    selected: number
    unavailable: number
    alwaysNeeded: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Employees",
      value: stats.total,
      icon: Users,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "Available",
      value: stats.available,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Selected",
      value: stats.selected,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Unavailable",
      value: stats.unavailable,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl border border-gray-200/60 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
