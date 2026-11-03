import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const actionNames = { bootstrap_super_admin: '初始化管理账号', set_role: '调整账号权限', save_location: '保存地点资料', review_location: '调整地点复核', moderate: '调整内容可见性', pin: '调整帖子置顶', resolve_report: '处理举报' }
const roleNames = { user: '普通用户', admin: '管理员', super_admin: 'Super admin' }
const timeFormat = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const dayFormat = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' })
const shortId = value => value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value
const actionName = code => Object.hasOwn(actionNames, code) ? actionNames[code] : `其他操作（${code}）`

function dateInfo(value) {
  const date = value == null || value === '' ? null : new Date(value)
  if (!date || !Number.isFinite(date.getTime())) return { time: -Infinity, day: '', text: '时间未记录' }
  const parts = Object.fromEntries(dayFormat.formatToParts(date).map(part => [part.type, part.value]))
  return { time: date.getTime(), day: `${parts.year}-${parts.month}-${parts.day}`, text: timeFormat.format(date) }
}
function accountName(id, roles, user) {
  if (id === user?.id) return `${user.name || '当前账号'}（当前账号）`
  return roles.find(item => item.user_id === id)?.email || `账号 ${shortId(id)}`
}
function targetName(item, locations, context, user) {
  const target = String(item.target || '')
  if (!target) return '未记录对象'
  if (['set_role', 'bootstrap_super_admin'].includes(item.action)) return accountName(target, context.roles || [], user)
  if (['save_location', 'review_location'].includes(item.action)) return locations.find(row => row.id === target)?.name || `地点 ${shortId(target)}`
  if (item.action === 'resolve_report') return `举报 ${shortId(target)}`
  const matches = [
    ...(context.posts || []).filter(row => row.id === target).map(row => `帖子：${row.title || shortId(target)}`),
    ...(context.replies || []).filter(row => row.id === target).map(row => `回复：${row.body?.slice(0, 50) || shortId(target)}`),
    ...(context.feedback || []).filter(row => row.id === target).map(row => `到访反馈：${row.note?.slice(0, 50) || shortId(target)}`),
  ]
  return matches.length === 1 ? matches[0] : `${item.action === 'pin' ? '帖子' : item.action === 'moderate' ? '内容' : '对象'} ${shortId(target)}`
}
function displayReason(item) {
  const reason = String(item.reason || '')
  if (item.action === 'review_location' && /^review=(true|false)$/.test(reason)) return reason === 'review=true' ? '标记为需要复核' : '取消复核标记'
  if (item.action === 'pin' && /^pinned=(true|false)$/.test(reason)) return reason === 'pinned=true' ? '置顶帖子' : '取消帖子置顶'
  if (item.action === 'set_role') {
    const match = reason.match(/^([\s\S]*) -> (admin|super_admin|user)$/)
    if (match) return `${match[1]}\n目标角色：${roleNames[match[2]]}`
  }
  if (item.action === 'moderate') {
    const match = reason.match(/^([\s\S]*) hidden=(true|false)$/)
    if (match) return `${match[1]}\n内容状态：${match[2] === 'true' ? '隐藏' : '公开'}`
  }
  if (item.action === 'resolve_report') {
    const match = reason.match(/^([\s\S]*) status=(resolved|dismissed) hide=(true|false)$/)
    if (match) return `${match[1]}\n处理结论：${match[2] === 'resolved' ? '举报成立' : '驳回举报'}\n隐藏选项：${match[3] === 'true' ? '已勾选' : '未勾选'}`
  }
  return reason || '未记录原因'
}

export default function AdminAuditLog({ records = [], locations = [], context = {}, user }) {
  const [query, setQuery] = useState('')
  const [action, setAction] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const panelRef = useRef(null)
  const pageNavigation = useRef(false)
  const invalidRange = Boolean(startDate && endDate && startDate > endDate)
  const actions = [...new Set(records.map(item => String(item.action || 'unknown')))]
  if (action && !actions.includes(action)) actions.push(action)
  const keyword = query.trim().toLocaleLowerCase()
  const prepared = records.map(item => {
    const code = String(item.action || 'unknown')
    const actor = item.actor ? accountName(String(item.actor), context.roles || [], user) : code === 'bootstrap_super_admin' ? '系统初始化' : '未记录操作者'
    return { item, code, date: dateInfo(item.created_at), actor, target: targetName(item, locations, context, user), action: actionName(code), reason: displayReason(item) }
  }).sort((a, b) => b.date.time - a.date.time)
  const matching = invalidRange ? [] : prepared.filter(row =>
    (!action || row.code === action) &&
    (!startDate || row.date.day && row.date.day >= startDate) &&
    (!endDate || row.date.day && row.date.day <= endDate) &&
    (!keyword || [row.item.id, row.item.actor, row.item.target, row.item.reason, row.code, row.actor, row.target, row.action, row.reason, row.date.text, row.item.created_at].filter(value => value != null).join(' ').toLocaleLowerCase().includes(keyword))
  )
  const totalPages = Math.max(1, Math.ceil(matching.length / 10))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * 10
  const visible = matching.slice(start, start + 10)
  useEffect(() => { setPage(current => Math.min(current, totalPages)) }, [totalPages])
  useLayoutEffect(() => {
    if (!pageNavigation.current) return
    pageNavigation.current = false
    panelRef.current?.focus({ preventScroll: true })
    panelRef.current?.scrollIntoView?.({ block: 'start' })
  }, [currentPage])
  function clear() { setQuery(''); setAction(''); setStartDate(''); setEndDate(''); setPage(1) }
  function changePage(next) { pageNavigation.current = true; setPage(next) }
  return <section className="admin-audit-log" aria-label="操作记录检索" ref={panelRef} tabIndex={-1}>
    <p className="muted">仅筛选当前已载入的最近记录（最多100条），不包含更早记录。时间均为马来西亚时间（UTC+8）。</p>
    <div className="admin-audit-toolbar">
      <label>搜索记录<input type="search" aria-label="搜索操作记录" placeholder="操作者、对象、原因或编号" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} /></label>
      <label>操作动作<select value={action} onChange={event => { setAction(event.target.value); setPage(1) }}><option value="">全部动作</option>{actions.map(code => <option key={code} value={code}>{actionName(code)}</option>)}</select></label>
      <label>开始日期<input type="date" value={startDate} onChange={event => { setStartDate(event.target.value); setPage(1) }} /></label>
      <label>结束日期<input type="date" value={endDate} onChange={event => { setEndDate(event.target.value); setPage(1) }} /></label>
      <button type="button" className="outline-action" disabled={!query && !action && !startDate && !endDate} onClick={clear}>清空记录筛选</button>
    </div>
    {invalidRange && <p className="admin-role-warning" role="alert">开始日期不能晚于结束日期，请调整日期范围。</p>}
    <p className="admin-location-summary" role="status">匹配 {matching.length} / 已载入 {records.length} 条记录{matching.length > 0 && ` · 显示第 ${start + 1}–${start + visible.length} 条`}</p>
    {visible.length ? <table className="admin-audit-table" aria-label="操作记录明细"><thead><tr>{['时间', '操作者', '对象', '动作', '原因'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{visible.map(row => <tr key={row.item.id}>
      <td><span className="audit-cell-label" aria-hidden="true">时间</span>{row.date.day ? <time dateTime={row.item.created_at}>{row.date.text}</time> : row.date.text}</td>
      <td><span className="audit-cell-label" aria-hidden="true">操作者</span>{row.actor}</td>
      <td><span className="audit-cell-label" aria-hidden="true">对象</span>{row.target}</td>
      <td><span className="audit-cell-label" aria-hidden="true">动作</span><span className="admin-audit-action">{row.action}</span></td>
      <td><span className="audit-cell-label" aria-hidden="true">原因</span><p className="admin-audit-reason">{row.reason}</p><details className="admin-audit-raw"><summary aria-label={`查看原始记录：${row.item.id}`}>查看原始记录</summary><dl><div><dt>记录编号</dt><dd>{row.item.id}</dd></div><div><dt>原始时间</dt><dd>{row.item.created_at || '未记录'}</dd></div><div><dt>动作代码</dt><dd>{row.code}</dd></div><div><dt>操作者编号</dt><dd>{row.item.actor || '未记录'}</dd></div><div><dt>对象编号</dt><dd>{row.item.target || '未记录'}</dd></div><div><dt>原始原因</dt><dd>{row.item.reason || '未记录'}</dd></div></dl></details></td>
    </tr>)}</tbody></table> : <div className="admin-location-empty"><strong>{invalidRange ? '请先修正日期范围' : records.length ? '没有匹配的操作记录' : '暂无操作记录'}</strong><p>{records.length ? '可调整搜索和筛选条件，或清空筛选查看已载入记录。' : '后续管理操作记录将在刷新后台后显示。'}</p></div>}
    <nav className="pagination admin-location-pagination" aria-label="操作记录分页"><button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>上一页</button><span>第 {currentPage} / {totalPages} 页 · 每页10条</span><button type="button" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>下一页</button></nav>
  </section>
}
