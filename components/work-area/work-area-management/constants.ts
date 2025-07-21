export interface Event {
  id: string
  name: string
  date: string
  employeesNeeded: number
  employeesToAsk: number
  status?: string
}

export interface WorkArea {
  id: string
  name: string
  location: string
  maxCapacity: number
  currentAssigned: number
  roleRequirements: { [roleId: string]: number }
  isActive: boolean
  isFromDatabase?: boolean // Track if this came from database
}

export interface RoleRequirement {
  id: string
  label: string
  color: string
}

export interface Template {
  id: string
  name: string
  location: string
  workAreas: WorkArea[]
  createdAt: string
}

// Fixed order of roles to prevent reordering
export const availableRoles: RoleRequirement[] = [
  { id: "manager", label: "Manager", color: "bg-red-100 text-red-700 border-red-200" },
  { id: "allrounder", label: "Allrounder", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "versorger", label: "Versorger", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "verkauf", label: "Verkauf", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "essen", label: "Essen", color: "bg-gray-100 text-gray-700 border-gray-200" },
]

export const locations = [
  { id: "emslandarena", label: "Emslandarena", icon: "🏟️" },
  { id: "emslandhalle", label: "Emslandhalle", icon: "🏢" },
  { id: "emslandarena-outdoor", label: "Emslandarena draußen", icon: "🏕️" },
] 