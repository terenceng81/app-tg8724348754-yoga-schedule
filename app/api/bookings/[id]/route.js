import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE(request, { params }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id} AND user_id = ${session.user.id}`
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Cancel booking
    await sql`UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = ${id}`
    await sql`UPDATE classes SET confirmed_count = confirmed_count - 1 WHERE id = ${booking.class_id}`

    // Promote first waitlisted
    const [next] = await sql`SELECT * FROM waitlist WHERE class_id = ${booking.class_id} AND status = 'waiting' ORDER BY position ASC LIMIT 1`
    if (next) {
      await sql`UPDATE waitlist SET status = 'offered', offered_at = NOW(), expires_at = NOW() + INTERVAL '2 hours' WHERE id = ${next.id}`
    }

    return NextResponse.json({ cancelled: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
