import type { Metadata } from 'next'
import './globals.css'
import './dashboard-fix.css'
import { LifecycleProvider } from '@/components/lifecycle-provider'
import { AuthProvider } from '@/components/auth/auth-provider'

import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Employee Dashboard',
  description: 'Employee management system with event scheduling',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LifecycleProvider>
            {children}
            <Toaster />
          </LifecycleProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
