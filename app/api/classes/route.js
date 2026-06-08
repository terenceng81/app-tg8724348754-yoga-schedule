import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const instructor = searchParams.get('instructor')

  try {
    let classes
    if (instructor) {
      classes = await sql`SELECT cs.*, ct.name as class_type, ct.duration_minutes as duration, i.name as instructor_name, l.name as location_name, (SELECT COUNT(*) FROM bookings b WHERE b.session_id = cs.id AND b.status = 'confirmed')::int as confirmed_count FROM class_sessions cs JOIN class_types ct ON ct.id = cs.class_type_id JOIN instructors i ON i.id = cs.instructor_id JOIN locations l ON l.id = cs.location_id WHERE cs.status = 'scheduled' AND cs.instructor_id = ${instructor} ORDER BY cs.starts_at ASC`
    } else if (from && to) {
      classes = await sql`SELECT cs.*, ct.name as class_type, ct.duration_minutes as duration, i.name as instructor_name, l.name as location_name, (SELECT COUNT(*) FROM bookings b WHERE b.session_id = cs.id AND b.status = 'confirmed')::int as confirmed_count FROM class_sessions cs JOIN class_types ct ON ct.id = cs.class_type_id JOIN instructors i ON i.id = cs.instructor_id JOIN locations l ON l.id = cs.location_id WHERE cs.status = 'scheduled' AND cs.starts_at >= ${from} AND cs.starts_at <= ${to + 'T23:59:59'} ORDER BY cs.starts_at ASC`
    } else {
      classes = await sql`SELECT cs.*, ct.name as class_type, ct.duration_minutes as duration, i.name as instructor_name, l.name as location_name, (SELECT COUNT(*) FROM bookings b WHERE b.session_id = cs.id AND b.status = 'confirmed')::int as confirmed_count FROM class_sessions cs JOIN class_types ct ON ct.id = cs.class_type_id JOIN instructors i ON i.id = cs.instructor_id JOIN locations l ON l.id = cs.location_id WHERE cs.status = 'scheduled' ORDER BY cs.starts_at ASC`
    }
    return NextResponse.json({ classes })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
