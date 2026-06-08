import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const entries = await sql`
      SELECT b.id, b.waitlist_position as position, b.status,
             ct.name as class_type, cs.starts_at, i.name as instructor_name
      FROM bookings b
      JOIN class_sessions cs ON cs.id = b.session_id
      JOIN class_types ct ON ct.id = cs.class_type_id
      JOIN instructors i ON i.id = cs.instructor_id
      WHERE b.owner_id = ${session.user.id} AND b.status = 'waitlisted'
      ORDER BY b.waitlist_position ASC
    `
    return NextResponse.json({ entries })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
