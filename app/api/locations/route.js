import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const locations = await sql`SELECT * FROM studio_locations WHERE is_active = true ORDER BY name`
    return NextResponse.json({ locations })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
