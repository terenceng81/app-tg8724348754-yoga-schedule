import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const bookings = await sql`
      SELECT b.id as booking_id, b.payment_status, ct.name as class_type, cs.starts_at,
             ct.duration_minutes as duration, i.name as instructor_name, l.name as location_name
      FROM bookings b
      JOIN class_sessions cs ON cs.id = b.session_id
      JOIN class_types ct ON ct.id = cs.class_type_id
      JOIN instructors i ON i.id = cs.instructor_id
      JOIN locations l ON l.id = cs.location_id
      WHERE b.owner_id = ${session.user.id} AND b.status = 'confirmed' AND cs.starts_at > NOW()
      ORDER BY cs.starts_at ASC
    `
    return NextResponse.json({ bookings })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
