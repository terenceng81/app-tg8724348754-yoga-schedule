import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const entries = await sql`
      SELECT w.id, w.position, w.status, c.class_type, c.start_time, i.name as instructor_name
      FROM waitlist w
      JOIN classes c ON c.id = w.class_id
      JOIN instructors i ON i.id = c.instructor_id
      WHERE w.user_id = ${session.user.id} AND w.status IN ('waiting', 'offered')
      ORDER BY w.joined_at DESC
    `
    return NextResponse.json({ entries })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
