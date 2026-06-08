import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE(request, { params }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id} AND owner_id = ${session.user.id}`
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    await sql`UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = ${id}`

    // Promote first waitlisted
    const [next] = await sql`SELECT * FROM bookings WHERE session_id = ${booking.session_id} AND status = 'waitlisted' ORDER BY waitlist_position ASC LIMIT 1`
    if (next) {
      await sql`UPDATE bookings SET status = 'confirmed', waitlist_position = NULL WHERE id = ${next.id}`
      // Reorder remaining waitlist
      await sql`UPDATE bookings SET waitlist_position = waitlist_position - 1 WHERE session_id = ${booking.session_id} AND status = 'waitlisted' AND waitlist_position > 1`
    }

    return NextResponse.json({ cancelled: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
