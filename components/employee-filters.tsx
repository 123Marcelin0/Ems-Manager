"use client"

import { Button } from "@/components/ui/button"

interface EmployeeFiltersProps {
  activeFilter: string
  setActiveFilter: (filter: string) => void
  stats: {
    total: number
    available: number
    selected: number
    unavailable: number
  }
}

export function EmployeeFilters({ activeFilter, setActiveFilter, stats }: EmployeeFiltersProps) {
  const filters = [
    { key: "all", label: "All", count: stats.total },
    { key: "available", label: "Available", count: stats.available },
    { key: "selected", label: "Selected", count: stats.selected },
    { key: "unavailable", label: "Unavailable", count: stats.unavailable },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.key}
          variant={activeFilter === filter.key ? "default" : "outline"}
          onClick={() => setActiveFilter(filter.key)}
          className={`h-10 gap-2 rounded-xl px-4 font-medium transition-all duration-200 ${
            activeFilter === filter.key
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm hover:from-blue-600 hover:to-blue-700"
              : "border-gray-200 bg-white/50 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
          aria-pressed={activeFilter === filter.key}
        >
          {filter.label}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              activeFilter === filter.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {filter.count}
          </span>
        </Button>
      ))}
    </div>
  )
}
