import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-svh place-items-center px-4 py-10">
      <LoginForm />
    </main>
  );
}
