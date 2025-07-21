interface EmployeeListEmptyProps {
  hasSelection: boolean
}

export function EmployeeListEmpty({ hasSelection }: EmployeeListEmptyProps) {
  if (!hasSelection) return null

  return (
    <div className="text-center py-8 text-sm text-gray-500">
      No employees selected yet. Use the search above to find and select employees.
    </div>
  )
} 