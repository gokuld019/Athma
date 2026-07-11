import { Suspense } from "react";
import AssessmentClient from "./AssessmentClient";

export default async function Page({ searchParams }) {
  const params = await searchParams;

  return (
    <Suspense fallback={<div></div>}>
      <AssessmentClient packageId={params.package || "executive"} />
    </Suspense>
  );
}