export const roleConfig = {
  allrounder: { label: "Allrounder", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  versorger: { label: "Versorger", color: "bg-blue-100 text-blue-700 border-blue-200" },
  verkauf: { label: "Verkauf", color: "bg-amber-100 text-amber-700 border-amber-200" },
  manager: { label: "Manager", color: "bg-red-100 text-red-700 border-red-200" },
  essen: { label: "Essen", color: "bg-gray-100 text-gray-700 border-gray-200" },
} as const

export type RoleType = keyof typeof roleConfig 