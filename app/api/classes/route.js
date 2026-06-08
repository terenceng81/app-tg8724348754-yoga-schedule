import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const instructor = searchParams.get('instructor')

  let query = `
    SELECT cs.*, ct.name as class_type, ct.duration_minutes as duration,
           i.name as instructor_name, l.name as location_name,
           (SELECT COUNT(*) FROM bookings b WHERE b.session_id = cs.id AND b.status = 'confirmed') as confirmed_count
    FROM class_sessions cs
    JOIN class_types ct ON ct.id = cs.class_type_id
    JOIN instructors i ON i.id = cs.instructor_id
    JOIN locations l ON l.id = cs.location_id
    WHERE cs.status = 'scheduled'
  `
  const params = []

  if (from && to) {
    query += ` AND cs.starts_at >= $1 AND cs.starts_at <= $2`
    params.push(from, to + 'T23:59:59')
  }
  if (instructor) {
    query += ` AND cs.instructor_id = $${params.length + 1}`
    params.push(instructor)
  }
  query += ` ORDER BY cs.starts_at ASC`

  try {
    const classes = await sql.unsafe(query, params)
    return NextResponse.json({ classes })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
