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
    // Start transaction
    const [cls] = await sql`SELECT * FROM classes WHERE id = ${class_id} AND status = 'scheduled'`
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    // Check existing booking
    const [existing] = await sql`SELECT id FROM bookings WHERE user_id = ${session.user.id} AND class_id = ${class_id} AND status != 'cancelled'`
    if (existing) return NextResponse.json({ error: 'Already booked or waitlisted' }, { status: 409 })

    if (cls.confirmed_count < cls.capacity) {
      // Book
      await sql`INSERT INTO bookings (user_id, class_id, status) VALUES (${session.user.id}, ${class_id}, 'confirmed')`
      await sql`UPDATE classes SET confirmed_count = confirmed_count + 1 WHERE id = ${class_id}`
      return NextResponse.json({ booked: true })
    } else {
      // Waitlist
      const [{ count }] = await sql`SELECT COUNT(*)::int as count FROM waitlist WHERE class_id = ${class_id} AND status = 'waiting'`
      const position = count + 1
      await sql`INSERT INTO waitlist (user_id, class_id, position) VALUES (${session.user.id}, ${class_id}, ${position})`
      return NextResponse.json({ waitlisted: true, position })
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
