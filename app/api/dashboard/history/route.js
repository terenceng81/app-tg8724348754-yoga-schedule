import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const bookings = await sql`
      SELECT b.id, b.payment_status, c.class_type, c.start_time,
             i.name as instructor_name, a.attended
      FROM bookings b
      JOIN classes c ON c.id = b.class_id
      JOIN instructors i ON i.id = c.instructor_id
      LEFT JOIN attendance a ON a.booking_id = b.id
      WHERE b.user_id = ${session.user.id} AND c.start_time < NOW()
      ORDER BY c.start_time DESC LIMIT 50
    `
    return NextResponse.json({ bookings })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
