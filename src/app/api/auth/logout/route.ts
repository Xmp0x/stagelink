import { apiSuccess } from "@/lib/utils/api";
import { SESSION_COOKIE_NAME } from "@/lib/auth/tokens";

export async function POST() {
  const response = apiSuccess({ message: "Successfully logged out." });

  // Clear session cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
