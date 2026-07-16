import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ status: "success" });

  response.cookies.delete("athma_admin_token");
  response.cookies.delete("athma_admin_token_type");
  response.cookies.delete("athma_admin_user");

  return response;
}