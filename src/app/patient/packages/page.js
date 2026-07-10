import { Suspense } from "react";
import PackagesClient from "./PackagesClient";

export default async function Page({ searchParams }) {
  const params = await searchParams;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PackagesClient patientId={params.patientId ?? ""} />
    </Suspense>
  );
}