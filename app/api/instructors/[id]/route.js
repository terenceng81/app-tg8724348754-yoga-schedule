import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { id } = await params
  try {
    const [instructor] = await sql`SELECT * FROM instructors WHERE id = ${id}`
    if (!instructor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ instructor })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
