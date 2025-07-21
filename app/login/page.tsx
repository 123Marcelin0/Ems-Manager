"use client";
export const dynamic = "force-dynamic";
import { LoginForm } from "@/components/auth/login-form"
import { redirect } from "next/navigation"

export default function LoginPage() {
  const handleLoginSuccess = () => {
    redirect("/")
  }

  return (
    <LoginForm onLoginSuccess={handleLoginSuccess} />
  )
} 