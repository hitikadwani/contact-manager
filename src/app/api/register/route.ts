import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  // Password: min 8 chars, at least one uppercase, one lowercase, one number
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json(
      { error: "Password must contain at least one uppercase letter" },
      { status: 400 }
    );
  }
  if (!/[a-z]/.test(password)) {
    return NextResponse.json(
      { error: "Password must contain at least one lowercase letter" },
      { status: 400 }
    );
  }
  if (!/[0-9]/.test(password)) {
    return NextResponse.json(
      { error: "Password must contain at least one number" },
      { status: 400 }
    );
  }

  const existing =
    await sql`SELECT id FROM users WHERE email = ${email}`;

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  await sql`
    INSERT INTO users (id, email, password)
    VALUES (${randomUUID()}, ${email}, ${hashed})
  `;

  return NextResponse.json({ success: true });
}
