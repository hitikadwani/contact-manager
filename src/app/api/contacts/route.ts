import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { cookies } from "next/headers";

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get("session")?.value;
}

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  // If no search query → return all contacts
  if (!q) {
    const contacts = await sql`
      SELECT id, name, phone, email, company, COALESCE(favorite, false) AS favorite
      FROM contacts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json(contacts);
  }

  
  const contacts = await sql`
    SELECT id, name, phone, email, company, COALESCE(favorite, false) AS favorite
    FROM contacts
    WHERE user_id = ${userId}
      AND (
        name ILIKE ${"%" + q + "%"}
        OR phone ILIKE ${"%" + q + "%"}
        OR email ILIKE ${"%" + q + "%"}
        OR company ILIKE ${"%" + q + "%"}
      )
    ORDER BY created_at DESC
  `;

  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { name, phone, email, company } = await req.json();

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and phone required" },
      { status: 400 }
    );
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }
  if (!company || typeof company !== "string" || !company.trim()) {
    return NextResponse.json(
      { error: "Company is required" },
      { status: 400 }
    );
  }

  const digitsOnly = String(phone).replace(/\D/g, "");
  if (digitsOnly.length !== 10) {
    return NextResponse.json(
      { error: "Phone number must be exactly 10 digits" },
      { status: 400 }
    );
  }

  await sql`
    INSERT INTO contacts (id, user_id, name, phone, email, company, favorite)
    VALUES (
      gen_random_uuid(),
      ${userId},
      ${name},
      ${digitsOnly},
      ${email.trim()},
      ${company.trim()},
      false
    )
  `;

  return NextResponse.json({ success: true });
}
