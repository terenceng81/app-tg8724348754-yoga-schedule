import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const bookings = await sql`
      SELECT b.id as booking_id, b.payment_status, c.class_type, c.start_time,
             ct.typical_duration_mins as duration, i.name as instructor_name, sl.name as location_name
      FROM bookings b
      JOIN classes c ON c.id = b.class_id
      JOIN class_types ct ON ct.id = c.class_type_id
      JOIN instructors i ON i.id = c.instructor_id
      JOIN studio_locations sl ON sl.id = c.location_id
      WHERE b.user_id = ${session.user.id} AND b.status = 'confirmed' AND c.start_time > NOW()
      ORDER BY c.start_time ASC
    `
    return NextResponse.json({ bookings })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
