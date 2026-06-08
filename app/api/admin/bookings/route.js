import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role !== 'admin') throw new Error('Forbidden')
}

export async function GET() {
  try {
    await requireAdmin()
    const bookings = await sql`
      SELECT b.id, b.id as booking_id, b.status, b.payment_status, b.waitlist_position,
             u.email as user_email, ct.name as class_type, cs.starts_at,
             i.name as instructor_name, l.name as location_name
      FROM bookings b
      JOIN "user" u ON u.id = b.owner_id
      JOIN class_sessions cs ON cs.id = b.session_id
      JOIN class_types ct ON ct.id = cs.class_type_id
      JOIN instructors i ON i.id = cs.instructor_id
      JOIN locations l ON l.id = cs.location_id
      ORDER BY cs.starts_at DESC LIMIT 200
    `
    return NextResponse.json({ bookings })
  } catch (e) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'Forbidden') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
