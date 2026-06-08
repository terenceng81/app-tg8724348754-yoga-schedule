1|'use client'
2|import { useState, useEffect } from 'react'
3|import { useParams } from 'next/navigation'
4|import Link from 'next/link'
5|import { authClient } from '@/lib/auth-client'
6|import { format, parseISO } from 'date-fns'
7|
8|export default function InstructorDetail() {
9|  const { id } = useParams()
10|  const { data: session } = authClient.useSession()
11|  const [instructor, setInstructor] = useState(null)
12|  const [classes, setClasses] = useState([])
13|  const [loading, setLoading] = useState(true)
14|
15|  useEffect(() => { loadData() }, [id])
16|
17|  async function loadData() {
18|    try {
19|      const [iRes, cRes] = await Promise.all([
20|        fetch(`/api/instructors/${id}`).then(r => r.json()),
21|        fetch(`/api/classes?instructor=${id}`).then(r => r.json()),
22|      ])
23|      setInstructor(iRes.instructor)
24|      setClasses(cRes.classes || [])
25|    } catch (e) { console.error(e) }
26|    finally { setLoading(false) }
27|  }
28|
29|  if (loading) return <Shell session={session}><div className="spinner" /></Shell>
30|  if (!instructor) return <Shell session={session}><div className="empty-state"><div className="empty-state-icon">🧘</div><div className="empty-state-text">Instructor not found</div></div></Shell>
31|
32|  return (
33|    <Shell session={session}>
34|      <Link href="/instructors" style={{ color: 'var(--primary)', fontSize: 14 }}>← Back to Instructors</Link>
35|      <h1 style={{ fontFamily: "'DM Serif Display', serif", marginTop: 16 }}>{instructor.name}</h1>
36|      {instructor.specialties && (
37|        <div className="specialty-tags" style={{ marginTop: 8 }}>
38|          {instructor.specialties.map(s => <span key={s} className="chip chip-primary">{s}</span>)}
39|        </div>
40|      )}
41|      {instructor.bio && <p style={{ marginTop: 16, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{instructor.bio}</p>}
42|
43|      <h2 style={{ marginTop: 32, marginBottom: 16, fontFamily: "'DM Serif Display', serif" }}>Upcoming Classes</h2>
44|      {classes.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No upcoming classes scheduled.</p> : (
45|        <div style={{ display: 'grid', gap: 8 }}>
46|          {classes.map(cls => (
47|            <div key={cls.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
48|              <div>
49|                <div style={{ fontWeight: 600 }}>{cls.class_type}</div>
50|                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
51|                  {format(parseISO(cls.starts_at), 'EEE, MMM d · h:mm a')} · {cls.duration}min · {cls.location_name}
52|                </div>
53|              </div>
54|              <span className={`chip ${cls.confirmed_count >= cls.capacity ? 'chip-error' : 'chip-success'}`}>
55|                {cls.confirmed_count >= cls.capacity ? 'Full' : `${cls.capacity - cls.confirmed_count} spots`}
56|              </span>
57|            </div>
58|          ))}
59|        </div>
60|      )}
61|    </Shell>
62|  )
63|}
64|
65|function Shell({ children, session }) {
66|  const [pathname, setPathname] = useState('')
67|  useEffect(() => { setPathname(window.location.pathname) }, [])
68|  const nav = [
69|    { href: '/schedule', label: 'Schedule' },
70|    { href: '/instructors', label: 'Instructors' },
71|    { href: '/dashboard', label: 'Dashboard' },
72|  ]
73|  return (
74|    <div>
75|      <nav className="top-nav">
76|        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
77|          <Link href="/schedule" className="nav-brand">Yoga</Link>
78|          <div className="nav-links">
79|            {nav.map(item => (
80|              <Link key={item.href} href={item.href} className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`}>{item.label}</Link>
81|            ))}
82|          </div>
83|        </div>
84|        <div className="nav-actions">
85|          {session ? (
86|            <>
87|              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{session.user?.name || session.user?.email}</span>
88|              <button className="btn btn-ghost btn-sm" onClick={async () => { await authClient.signOut(); window.location.href = '/' }}>Sign Out</button>
89|            </>
90|          ) : <Link href="/" className="btn btn-primary btn-sm">Sign In</Link>}
91|        </div>
92|      </nav>
93|      <div className="page">{children}</div>
94|    </div>
95|  )
96|}
97|