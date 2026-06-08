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
    const bookings = await sql`
      SELECT b.id, b.id as booking_id, b.status, b.payment_status,
             u.email as user_email, c.class_type, c.start_time,
             i.name as instructor_name
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      JOIN classes c ON c.id = b.class_id
      JOIN instructors i ON i.id = c.instructor_id
      ORDER BY c.start_time DESC LIMIT 200
    `
    return NextResponse.json({ bookings })
  } catch (e) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (e.message === 'Forbidden') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
