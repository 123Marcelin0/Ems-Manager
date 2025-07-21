"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Shuffle, Plus, MoreHorizontal, Edit, Trash2, UserCheck, Settings } from "lucide-react"

interface Employee {
  id: string
  name: string
  userId: string
  registrationTime: string
  role: "allrounder" | "versorger" | "verkauf" | "manager" | "essen"
  status: "active" | "inactive" | "on-break"
  department: string
  lastActivity: string
}

const roleConfig = {
  allrounder: {
    label: "Allrounder",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  versorger: { label: "Versorger", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  verkauf: { label: "Verkauf", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  manager: { label: "Manager", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  essen: { label: "Essen", color: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-500" },
}

const mockEmployeeData: Employee[] = [
  {
    id: "EMP001",
    name: "Anna Schmidt",
    userId: "a.schmidt",
    registrationTime: "2024-01-16 08:30",
    role: "allrounder",
    status: "active",
    department: "Production",
    lastActivity: "2024-01-16 14:45",
  },
  {
    id: "EMP002",
    name: "Max Müller",
    userId: "m.mueller",
    registrationTime: "2024-01-16 09:15",
    role: "manager",
    status: "active",
    department: "Operations",
    lastActivity: "2024-01-16 15:20",
  },
  {
    id: "EMP003",
    name: "Lisa Weber",
    userId: "l.weber",
    registrationTime: "2024-01-16 07:45",
    role: "versorger",
    status: "on-break",
    department: "Logistics",
    lastActivity: "2024-01-16 12:30",
  },
  {
    id: "EMP004",
    name: "Tom Fischer",
    userId: "t.fischer",
    registrationTime: "2024-01-16 08:00",
    role: "verkauf",
    status: "active",
    department: "Sales",
    lastActivity: "2024-01-16 15:10",
  },
  {
    id: "EMP005",
    name: "Sarah Klein",
    userId: "s.klein",
    registrationTime: "2024-01-16 10:30",
    role: "essen",
    status: "inactive",
    department: "Catering",
    lastActivity: "2024-01-16 11:15",
  },
]

export function EmployeeRoleManagement() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployeeData)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [showSignOutTable, setShowSignOutTable] = useState(false)

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || employee.role === roleFilter

    return matchesSearch && matchesRole
  })

  const handleRoleChange = (employeeId: string, newRole: keyof typeof roleConfig) => {
    setEmployees((prev) => prev.map((emp) => (emp.id === employeeId ? { ...emp, role: newRole } : emp)))
  }

  const handleRedistributeRoles = () => {
    const roles = Object.keys(roleConfig) as (keyof typeof roleConfig)[]
    setEmployees((prev) =>
      prev.map((emp) => ({
        ...emp,
        role: roles[Math.floor(Math.random() * roles.length)],
      })),
    )
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const roleStats = Object.keys(roleConfig).reduce(
    (acc, role) => {
      acc[role] = employees.filter((emp) => emp.role === role).length
      return acc
    },
    {} as Record<string, number>,
  )

  if (showSignOutTable) {
    // This would normally be a separate route, but for demo purposes we'll toggle
    return (
      <div className="space-y-6">
        <Button onClick={() => setShowSignOutTable(false)} variant="outline" className="gap-2 rounded-xl">
          ← Back to Role Management
        </Button>
        {/* Sign-out table would be rendered here */}
        <div className="rounded-2xl border border-gray-100/80 bg-white/80 p-12 shadow-sm backdrop-blur-sm text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign-out Table</h3>
          <p className="text-gray-500">This would show the sign-out table functionality.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Role Management</h1>
          <p className="mt-1 text-gray-600">Manage employee roles and assignments</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowSignOutTable(true)}
            variant="outline"
            className="gap-2 rounded-xl border-gray-200 bg-white/50 font-medium transition-all duration-200 hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Sign-out Table
          </Button>
          <Button className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Role Legend */}
      <div className="rounded-2xl border border-gray-100/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Role Legend</h2>
          <Button
            onClick={handleRedistributeRoles}
            className="gap-2 rounded-xl bg-gray-900 font-medium transition-all duration-200 hover:bg-gray-800"
          >
            <Shuffle className="h-4 w-4" />
            Redistribute Roles
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(roleConfig).map(([role, config]) => (
            <div
              key={role}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 transition-colors hover:bg-gray-100/50"
            >
              <div className={`h-3 w-3 rounded-full ${config.dot}`} />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{config.label}</div>
                <div className="text-sm text-gray-500">{roleStats[role]} employees</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-gray-100/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search employees, departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-xl border-gray-200 bg-white/50 pl-10 transition-all duration-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={roleFilter === "all" ? "default" : "outline"}
              onClick={() => setRoleFilter("all")}
              className={`h-10 rounded-xl px-4 font-medium transition-all duration-200 ${
                roleFilter === "all"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                  : "border-gray-200 bg-white/50 text-gray-700 hover:bg-gray-50"
              }`}
            >
              All Roles
            </Button>
            {Object.entries(roleConfig).map(([role, config]) => (
              <Button
                key={role}
                variant={roleFilter === role ? "default" : "outline"}
                onClick={() => setRoleFilter(role)}
                className={`h-10 rounded-xl px-4 font-medium transition-all duration-200 gap-2 ${
                  roleFilter === role
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                    : "border-gray-200 bg-white/50 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${config.dot}`} />
                {config.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="border-b border-gray-100/80 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">Employee List</h2>
          <p className="mt-1 text-sm text-gray-600">
            {filteredEmployees.length} of {employees.length} employees
          </p>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <UserCheck className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">No employees found</h3>
              <p className="text-gray-500">No employees match your current filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100/80 hover:bg-transparent">
                  <TableHead className="h-12 px-6 font-semibold text-gray-900">Name</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Registration Time</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Role</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee, index) => (
                  <TableRow
                    key={employee.id}
                    className="group border-gray-100/80 transition-colors duration-200 hover:bg-gray-50/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">
                          {employee.userId} • {employee.department}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="text-gray-900">{formatDateTime(employee.registrationTime)}</div>
                        <div className="text-sm text-gray-500">
                          Last active: {formatDateTime(employee.lastActivity)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 rounded-lg p-2 transition-all duration-200 hover:bg-gray-100"
                          >
                            <div className={`h-2 w-2 rounded-full ${roleConfig[employee.role].dot}`} />
                            <Badge className={`border font-medium ${roleConfig[employee.role].color}`}>
                              {roleConfig[employee.role].label}
                            </Badge>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {Object.entries(roleConfig).map(([role, config]) => (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => handleRoleChange(employee.id, role as keyof typeof roleConfig)}
                              className="gap-2 cursor-pointer"
                            >
                              <div className={`h-2 w-2 rounded-full ${config.dot}`} />
                              {config.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        className={`border font-medium ${
                          employee.status === "active"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : employee.status === "on-break"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {employee.status === "active"
                          ? "Active"
                          : employee.status === "on-break"
                            ? "On Break"
                            : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-lg p-0 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-gray-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                            <Edit className="h-4 w-4" />
                            Edit Employee
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                            <UserCheck className="h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-red-600 cursor-pointer focus:text-red-600">
                            <Trash2 className="h-4 w-4" />
                            Remove Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
