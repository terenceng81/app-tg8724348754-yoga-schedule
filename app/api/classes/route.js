import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const instructor = searchParams.get('instructor')

  let query = `
    SELECT c.*, ct.name as class_type, ct.difficulty, ct.typical_duration_mins as duration,
           i.name as instructor_name, sl.name as location_name
    FROM classes c
    JOIN class_types ct ON ct.id = c.class_type_id
    JOIN instructors i ON i.id = c.instructor_id
    JOIN studio_locations sl ON sl.id = c.location_id
    WHERE c.status = 'scheduled'
  `
  const params = []

  if (from && to) {
    query += ` AND c.start_time >= $1 AND c.start_time <= $2`
    params.push(from, to + 'T23:59:59')
  }
  if (instructor) {
    query += ` AND c.instructor_id = $${params.length + 1}`
    params.push(instructor)
  }
  query += ` ORDER BY c.start_time ASC`

  try {
    const classes = await sql.unsafe(query, params)
    return NextResponse.json({ classes })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
