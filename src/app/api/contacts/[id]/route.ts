import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { cookies } from "next/headers";

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get("session")?.value;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await sql`
    SELECT id, name, phone, email, company, COALESCE(favorite, false) AS favorite
    FROM contacts
    WHERE id = ${id}
      AND user_id = ${userId}
  `;

  if (contacts.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(contacts[0]);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, phone, email, company, favorite } = body;

  if (name == null || phone == null) {
    return NextResponse.json(
      { error: "Name and phone required" },
      { status: 400 }
    );
  }
  if (email == null || typeof email !== "string" || !email.trim()) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }
  if (company == null || typeof company !== "string" || !company.trim()) {
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
    UPDATE contacts
    SET
      name = ${name},
      phone = ${digitsOnly},
      email = ${email.trim()},
      company = ${company.trim()}
    WHERE id = ${id}
      AND user_id = ${userId}
  `;
  if (typeof favorite === "boolean") {
    await sql`
      UPDATE contacts SET favorite = ${favorite}
      WHERE id = ${id} AND user_id = ${userId}
    `;
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sql`
    DELETE FROM contacts
    WHERE id = ${id}
      AND user_id = ${userId}
  `;

  return NextResponse.json({ success: true });
}
