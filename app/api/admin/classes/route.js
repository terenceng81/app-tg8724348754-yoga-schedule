import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role !== 'admin') throw new Error('Forbidden')
  return session.user
}

export async function GET() {
  try {
    await requireAdmin()
    const classes = await sql`
      SELECT c.*, ct.name as class_type, i.name as instructor_name, sl.name as location_name
      FROM classes c
      JOIN class_types ct ON ct.id = c.class_type_id
      JOIN instructors i ON i.id = c.instructor_id
      JOIN studio_locations sl ON sl.id = c.location_id
      ORDER BY c.start_time DESC LIMIT 100
    `
    return NextResponse.json({ classes })
  } catch (e) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'Forbidden') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
