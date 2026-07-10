import { Suspense } from "react";
import AssessmentClient from "./AssessmentClient";

export default function AssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <AssessmentClient />
    </Suspense>
  );
}