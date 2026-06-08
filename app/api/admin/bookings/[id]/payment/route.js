import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { id } = await params
  const { payment_status } = await request.json()

  if (!['pending', 'paid', 'comped'].includes(payment_status)) {
    return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
  }

  try {
    await sql`UPDATE bookings SET payment_status = ${payment_status} WHERE id = ${id}`
    return NextResponse.json({ updated: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
