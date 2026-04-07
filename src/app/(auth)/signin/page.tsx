import { redirect } from "next/navigation"

import { SignInForm } from "./signin-form"
import { getCurrentUser } from "@/lib/auth"

export default async function SignInPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/channels")
  }

  return <SignInForm />
}
