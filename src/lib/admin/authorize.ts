import { NextRequest } from "next/server";
import { getAdminSession, verifySessionToken, ADMIN_COOKIE } from "./auth";

/** Accept admin cookie session OR x-admin-secret / ?secret= */
export async function authorizeAdmin(req: NextRequest): Promise<boolean> {
  const session = await getAdminSession();
  if (session) return true;

  const cookieToken = req.cookies.get(ADMIN_COOKIE)?.value;
  if (verifySessionToken(cookieToken)) return true;

  const secret = process.env.ADMIN_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  const header = req.headers.get("x-admin-secret") || "";
  const query = req.nextUrl.searchParams.get("secret") || "";
  return header === secret || query === secret;
}
