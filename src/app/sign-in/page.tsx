import { Suspense } from "react";
import { SignInPage } from "@/features/auth";

export default function SignInRoute() {
  return (
    <Suspense fallback={null}>
      <SignInPage />
    </Suspense>
  );
}
