import type { WorkArea } from "./constants"
import { availableRoles } from "./constants"

export function useDefaultAreas() {
  // Initialize role requirements with consistent structure and fixed order
  const initializeRoleRequirements = (): { [roleId: string]: number } => {
    const requirements: { [roleId: string]: number } = {}
    availableRoles.forEach(role => {
      requirements[role.id] = 0
    })
    return requirements
  }

  // Default work areas for Emslandarena
  const getEmslandarenaDefaults = (): WorkArea[] => [
    // Gastro 1-4
    {
      id: "default-gastro-1",
      name: "Gastro 1",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 4,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 1 }
    },
    {
      id: "default-gastro-2",
      name: "Gastro 2",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 4,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 1 }
    },
    {
      id: "default-gastro-3",
      name: "Gastro 3",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 4,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 1 }
    },
    {
      id: "default-gastro-4",
      name: "Gastro 4",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 4,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 1 }
    },
    // Erlebbar
    {
      id: "default-erlebbar",
      name: "Erlebbar",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 1, allrounder: 1, versorger: 0, verkauf: 1, essen: 0 }
    },
    // VIP-Bereich
    {
      id: "default-vip",
      name: "VIP-Bereich",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 1, allrounder: 1, versorger: 1, verkauf: 0, essen: 0 }
    },
    // Mobile Theken 1-4
    {
      id: "default-mobile-1",
      name: "Mobile Theken 1",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-mobile-2",
      name: "Mobile Theken 2",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-mobile-3",
      name: "Mobile Theken 3",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-mobile-4",
      name: "Mobile Theken 4",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    }
  ]

  // Default work areas for Emslandhalle
  const getEmslandhalleDefaults = (): WorkArea[] => [
    // Große Theke
    {
      id: "default-grosse-theke",
      name: "Große Theke",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 5,
      currentAssigned: 0,
      roleRequirements: { manager: 1, allrounder: 2, versorger: 1, verkauf: 1, essen: 0 }
    },
    // Küche (Hilfe)
    {
      id: "default-kueche-hilfe",
      name: "Küche (Hilfe)",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 0, essen: 1 }
    },
    // Mobile Theke 1-4
    {
      id: "default-emslandhalle-mobile-1",
      name: "Mobile Theke 1",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-emslandhalle-mobile-2",
      name: "Mobile Theke 2",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-emslandhalle-mobile-3",
      name: "Mobile Theke 3",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-emslandhalle-mobile-4",
      name: "Mobile Theke 4",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    }
  ]

  // Get default work areas based on location
  const getLocationDefaults = (location: string): WorkArea[] => {
    switch (location) {
      case "emslandarena":
        return getEmslandarenaDefaults()
      case "emslandhalle":
        return getEmslandhalleDefaults()
      default:
        return []
    }
  }

  return {
    initializeRoleRequirements,
    getLocationDefaults
  }
} 