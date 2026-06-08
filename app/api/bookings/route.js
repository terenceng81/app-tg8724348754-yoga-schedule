import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { class_id } = await request.json()
  if (!class_id) return NextResponse.json({ error: 'class_id required' }, { status: 400 })

  try {
    const [cls] = await sql`SELECT * FROM class_sessions WHERE id = ${class_id} AND status = 'scheduled'`
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    const [existing] = await sql`SELECT id FROM bookings WHERE owner_id = ${session.user.id} AND session_id = ${class_id} AND status != 'cancelled'`
    if (existing) return NextResponse.json({ error: 'Already booked or waitlisted' }, { status: 409 })

    // Count confirmed bookings
    const [{ count }] = await sql`SELECT COUNT(*)::int as count FROM bookings WHERE session_id = ${class_id} AND status = 'confirmed'`

    if (count < cls.capacity) {
      await sql`INSERT INTO bookings (owner_id, session_id, status, payment_status) VALUES (${session.user.id}, ${class_id}, 'confirmed', 'pending')`
      return NextResponse.json({ booked: true })
    } else {
      const [{ wc }] = await sql`SELECT COUNT(*)::int as wc FROM bookings WHERE session_id = ${class_id} AND status = 'waitlisted'`
      const pos = wc + 1
      await sql`INSERT INTO bookings (owner_id, session_id, status, waitlist_position, payment_status) VALUES (${session.user.id}, ${class_id}, 'waitlisted', ${pos}, 'pending')`
      return NextResponse.json({ waitlisted: true, position: pos })
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
