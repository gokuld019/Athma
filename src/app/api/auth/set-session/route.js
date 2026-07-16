import { NextResponse } from "next/server";

export async function POST(request) {
  const { access_token, token_type, user, remember } = await request.json();

  if (!access_token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const response = NextResponse.json({ status: "success" });

  const maxAge = remember ? 60 * 60 * 24 * 30 : undefined; // 30 days or session cookie

  response.cookies.set("athma_admin_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  });

  response.cookies.set("athma_admin_token_type", token_type || "Bearer", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  });

  // Non-sensitive display info can stay JS-readable if you need it client-side
  response.cookies.set("athma_admin_user", JSON.stringify(user || {}), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  });

  return response;
}