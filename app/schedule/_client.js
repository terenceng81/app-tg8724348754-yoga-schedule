1|'use client'
2|import { useState, useEffect } from 'react'
3|import Link from 'next/link'
4|import { authClient } from '@/lib/auth-client'
5|import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, parseISO, isSameDay } from 'date-fns'
6|
7|const CLASS_TYPES = ['All', 'Hatha', 'Vinyasa', 'Yin', 'Ashtanga', 'Restorative']
8|
9|export default function SchedulePage() {
10|  const { data: session } = authClient.useSession()
11|  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
12|  const [classes, setClasses] = useState([])
13|  const [locations, setLocations] = useState([])
14|  const [typeFilter, setTypeFilter] = useState('All')
15|  const [locFilter, setLocFilter] = useState('All')
16|  const [loading, setLoading] = useState(true)
17|  const [selected, setSelected] = useState(null)
18|  const [booking, setBooking] = useState(false)
19|  const [toast, setToast] = useState(null)
20|
21|  useEffect(() => { loadData() }, [weekStart])
22|  useEffect(() => { showToast(null) }, [])
23|
24|  async function loadData() {
25|    setLoading(true)
26|    try {
27|      const from = format(weekStart, 'yyyy-MM-dd')
28|      const to = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')
29|      const [cRes, lRes] = await Promise.all([
30|        fetch(`/api/classes?from=${from}&to=${to}`).then(r => r.json()),
31|        fetch('/api/locations').then(r => r.json()),
32|      ])
33|      setClasses(cRes.classes || [])
34|      setLocations(lRes.locations || [])
35|    } catch (e) {
36|      console.error('Load failed', e)
37|    } finally {
38|      setLoading(false)
39|    }
40|  }
41|
42|  async function handleBook(classId) {
43|    if (!session) { window.location.href = '/'; return }
44|    setBooking(true)
45|    try {
46|      const res = await fetch('/api/bookings', {
47|        method: 'POST',
48|        headers: { 'Content-Type': 'application/json' },
49|        body: JSON.stringify({ class_id: classId }),
50|      })
51|      const data = await res.json()
52|      if (res.ok) {
53|        showToast(data.waitlisted ? `You're #${data.position} on the waitlist` : 'Class booked! 🧘')
54|        setSelected(null)
55|        loadData()
56|      } else {
57|        showToast(data.error || 'Booking failed', true)
58|      }
59|    } catch (e) {
60|      showToast('Something went wrong', true)
61|    } finally {
62|      setBooking(false)
63|    }
64|  }
65|
66|  function showToast(msg, isError) {
67|    setToast({ msg, isError })
68|    setTimeout(() => setToast(null), 3000)
69|  }
70|
71|  const filtered = classes.filter(c => {
72|    if (typeFilter !== 'All' && c.class_type !== typeFilter) return false
73|    if (locFilter !== 'All' && c.location_name !== locFilter) return false
74|    return true
75|  })
76|
77|  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
78|  const today = new Date()
79|
80|  return (
81|    <div>
82|      <AppShell ss={session}>
83|        {/* Week nav */}
84|        <div className="week-nav">
85|          <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(w => subWeeks(w, 1))}>←</button>
86|          <h2>{format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}</h2>
87|          <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(w => addWeeks(w, 1))}>→</button>
88|          <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</button>
89|        </div>
90|
91|        {/* Filters */}
92|        <div className="filter-bar">
93|          {CLASS_TYPES.map(t => (
94|            <button key={t} className={`filter-pill ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>{t}</button>
95|          ))}
96|          <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>
97|          <button className={`filter-pill ${locFilter === 'All' ? 'active' : ''}`} onClick={() => setLocFilter('All')}>All Studios</button>
98|          {locations.map(l => (
99|            <button key={l.name} className={`filter-pill ${locFilter === l.name ? 'active' : ''}`} onClick={() => setLocFilter(l.name)}>{l.name}</button>
100|          ))}
101|        </div>
102|
103|        {loading ? <div className="spinner" /> : (
104|          <>
105|            {/* Week grid */}
106|            <div className="week-grid">
107|              {days.map(day => {
108|                const dayClasses = filtered.filter(c => isSameDay(parseISO(c.starts_at), day))
109|                const isToday = isSameDay(day, today)
110|                return (
111|                  <div key={day.toISOString()} className="day-column">
112|                    <div className={`day-header ${isToday ? 'today' : ''}`}>
113|                      {format(day, 'EEE')}<br />{format(day, 'd')}
114|                    </div>
115|                    <div className="day-body">
116|                      {dayClasses.length === 0 && <div style={{ padding: 12, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>—</div>}
117|                      {dayClasses.map(cls => {
118|                        const full = cls.confirmed_count >= cls.capacity
119|                        return (
120|                          <div
121|                            key={cls.id}
122|                            className={`class-card ${full ? 'full' : ''}`}
123|                            onClick={() => setSelected(cls)}
124|                          >
125|                            <div className="class-card-name">{cls.class_type}</div>
126|                            <div className="class-card-time">
127|                              {format(parseISO(cls.starts_at), 'h:mm a')} · {cls.duration}min
128|                            </div>
129|                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{cls.instructor_name}</div>
130|                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{cls.location_name}</div>
131|                            <div className="class-card-spots" style={{ color: full ? 'var(--error)' : 'var(--success)' }}>
132|                              {full ? 'Full' : `${cls.capacity - cls.confirmed_count} spots left`}
133|                            </div>
134|                          </div>
135|                        )
136|                      })}
137|                    </div>
138|                  </div>
139|                )
140|              })}
141|            </div>
142|          </>
143|        )}
144|
145|        {/* Class Detail Modal */}
146|        {selected && (
147|          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
148|            <div className="modal">
149|              <div className="modal-title">{selected.class_type}</div>
150|              <div className="detail-meta">
151|                <span className="chip chip-primary">{selected.class_type}</span>
152|                <span className="chip" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>{selected.duration} minutes</span>
153|              </div>
154|              <div style={{ marginBottom: 16 }}>
155|                <div className="detail-row">🧘 {selected.instructor_name}</div>
156|                <div className="detail-row">📍 {selected.location_name}</div>
157|                <div className="detail-row">🕐 {format(parseISO(selected.starts_at), 'EEEE, MMM d · h:mm a')}</div>
158|              </div>
159|              <div style={{ marginBottom: 20 }}>
160|                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
161|                  {selected.confirmed_count >= selected.capacity
162|                    ? <span style={{ color: 'var(--error)' }}>Class Full</span>
163|                    : <span style={{ color: 'var(--success)' }}>{selected.capacity - selected.confirmed_count} of {selected.capacity} spots available</span>}
164|                </div>
165|                <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
166|                  <div style={{ height: '100%', width: `${Math.min(100, (selected.confirmed_count / selected.capacity) * 100)}%`, background: selected.confirmed_count >= selected.capacity ? 'var(--error)' : 'var(--primary)', borderRadius: 3, transition: 'width 0.3s' }} />
167|                </div>
168|              </div>
169|              <div className="modal-actions">
170|                <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
171|                <button
172|                  className={`btn ${selected.confirmed_count >= selected.capacity ? 'btn-accent' : 'btn-primary'} btn-lg`}
173|                  onClick={() => handleBook(selected.id)}
174|                  disabled={booking}
175|                >
176|                  {booking ? 'Booking...' : selected.confirmed_count >= selected.capacity ? 'Join Waitlist' : 'Book Now'}
177|                </button>
178|              </div>
179|            </div>
180|          </div>
181|        )}
182|      </AppShell>
183|
184|      {toast && <div className={`toast ${toast.isError ? 'error' : 'success'}`}>{toast.msg}</div>}
185|    </div>
186|  )
187|}
188|
189|function AppShell({ children, ss }) {
190|  const { data: session } = ss ? { data: ss } : authClient.useSession()
191|  const [pathname, setPathname] = useState('')
192|
193|  useEffect(() => { setPathname(window.location.pathname) }, [])
194|  const nav = [
195|    { href: '/schedule', label: 'Schedule' },
196|    { href: '/instructors', label: 'Instructors' },
197|    { href: '/dashboard', label: 'Dashboard' },
198|  ]
199|
200|  return (
201|    <div>
202|      <nav className="top-nav">
203|        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
204|          <Link href="/schedule" className="nav-brand">Yoga</Link>
205|          <div className="nav-links">
206|            {nav.map(item => (
207|              <Link key={item.href} href={item.href} className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`}>
208|                {item.label}
209|              </Link>
210|            ))}
211|            {session?.user?.role === 'admin' && <Link href="/admin" className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}>Admin</Link>}
212|          </div>
213|        </div>
214|        <div className="nav-actions">
215|          {session ? (
216|            <>
217|              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{session.user?.name || session.user?.email}</span>
218|              <button className="btn btn-ghost btn-sm" onClick={async () => { await authClient.signOut(); window.location.href = '/' }}>Sign Out</button>
219|            </>
220|          ) : (
221|            <Link href="/" className="btn btn-primary btn-sm">Sign In</Link>
222|          )}
223|        </div>
224|      </nav>
225|      <div className="page">{children}</div>
226|    </div>
227|  )
228|}
229|