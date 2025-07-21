"use client";
import { LoginForm } from "@/components/auth/login-form";
import { redirect } from "next/navigation";

export function LoginPageClient() {
  const handleLoginSuccess = () => {
    redirect("/");
  };

  return (
    <LoginForm onLoginSuccess={handleLoginSuccess} />
  );
} 