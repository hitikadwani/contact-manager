import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const users =
    await sql`SELECT * FROM users WHERE email = ${email}`;

  if (users.length === 0) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const user = users[0];
  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ success: true });

  res.cookies.set("session", user.id, {
    httpOnly: true,
    path: "/",
  });

  return res;
}
