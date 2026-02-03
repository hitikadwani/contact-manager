import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    company TEXT,
    favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  );
  `;

  await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT false`;

  return NextResponse.json({ success: true });
}
