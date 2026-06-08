import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const instructors = await sql`SELECT * FROM instructors WHERE is_active = true ORDER BY name`
    return NextResponse.json({ instructors })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
