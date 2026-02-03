import { cookies } from "next/headers";
import { sql } from "./db";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;

  const users =
    await sql`SELECT id, email FROM users WHERE id = ${session}`;

  return users[0] ?? null;
}
