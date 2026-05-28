import { Suspense } from "react";
import { ForgotPasswordPage } from "@/features/auth";

export default function ForgotPasswordRoute() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
