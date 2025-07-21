"use client"

import { Users, UserCheck, UserX } from "lucide-react"

interface StatsOverviewProps {
  stats: {
    total: number
    available: number
    selected: number
    unavailable: number
    alwaysNeeded: number
  }
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const cards = [
    {
      title: "Total Employees",
      value: stats.total,
      icon: Users,
      gradient: "from-gray-500 to-gray-600",
      bg: "bg-gray-50/50",
    },
    {
      title: "Available",
      value: stats.available,
      icon: UserCheck,
      gradient: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50/50",
    },
    {
      title: "Selected",
      value: stats.selected,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50/50",
    },
    {
      title: "Unavailable",
      value: stats.unavailable,
      icon: UserX,
      gradient: "from-red-500 to-red-600",
      bg: "bg-red-50/50",
    },
  ]

  return (
    <div className="flex flex-row gap-4 overflow-x-auto pb-2">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="group relative flex-1 min-w-[180px] overflow-hidden rounded-xl border border-gray-100/80 bg-white/80 p-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:shadow-gray-200/50"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg} transition-transform duration-300 group-hover:scale-110`}
            >
              <card.icon className={`h-5 w-5 bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">{card.title}</p>
              <p className="text-xl font-bold text-gray-900 transition-transform duration-300 group-hover:scale-105">
                {card.value}
              </p>
            </div>
          </div>

          {/* Subtle hover effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      ))}
    </div>
  )
}
