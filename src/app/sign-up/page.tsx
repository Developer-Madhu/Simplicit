import { Suspense } from "react";
import { SignUpPage } from "@/features/auth";

export default function SignUpRoute() {
  return (
    <Suspense fallback={null}>
      <SignUpPage />
    </Suspense>
  );
}
