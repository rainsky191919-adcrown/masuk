import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const roleNames = { user: '普通用户', admin: '管理员', super_admin: 'Super admin' }
const roleDetails = {
  user: '不再拥有后台管理权限，可使用普通用户功能。',
  admin: '可处理举报、管理地点和社区内容，不能调整管理员权限。',
  super_admin: '可管理后台内容，并分配或撤销管理员权限。',
}
const normalizeEmail = value => value.trim().toLowerCase()

export default function AdminAccountRoles({ roles, user, busy, onSave }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('admin')
  const [reason, setReason] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const emailRef = useRef(null)
  const summaryRef = useRef(null)
  const inFlight = useRef(false)
  const roleSnapshot = JSON.stringify(roles.map(item => [item.user_id, item.email, item.role]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))))
  const previousSnapshot = useRef(roleSnapshot)
  const current = roles.find(item => normalizeEmail(item.email || '') === normalizeEmail(email))
  const currentLabel = current ? roleNames[current.role] || '未知角色，请刷新核对' : email.trim() ? '未列入管理账号（验证状态待确认）' : '请输入账号邮箱'
  const noChange = current?.role === role
  const lastSuperAdmin = current?.role === 'super_admin' && role !== 'super_admin' && roles.filter(item => item.role === 'super_admin').length <= 1
  const disabled = busy || submitting

  useEffect(() => {
    if (previousSnapshot.current === roleSnapshot) return
    previousSnapshot.current = roleSnapshot
    setConfirmation(null)
    setNotice('账号角色资料已刷新，请重新核对变更。')
  }, [roleSnapshot])
  useLayoutEffect(() => {
    if (!confirmation) return
    summaryRef.current?.focus({ preventScroll: true })
    summaryRef.current?.scrollIntoView?.({ block: 'start' })
  }, [confirmation])

  function invalidate() { setConfirmation(null); setError(''); setNotice('') }
  function focusEmail() {
    emailRef.current?.focus({ preventScroll: true })
    emailRef.current?.scrollIntoView?.({ block: 'center' })
  }
  function selectAccount(item) {
    invalidate(); setEmail(item.email); setRole(item.role); setReason('')
    focusEmail()
  }
  function preview(event) {
    event.preventDefault()
    if (disabled || noChange || lastSuperAdmin) return
    if (!email.trim() || !reason.trim()) { setError('请填写有效邮箱及调整原因。'); return }
    setError(''); setNotice('')
    setConfirmation({ email: normalizeEmail(email), role, reason: reason.trim(), currentLabel, self: current?.user_id === user.id, roleSnapshot })
  }
  async function save() {
    if (!confirmation || disabled || inFlight.current || noChange || lastSuperAdmin) return
    if (confirmation.roleSnapshot !== roleSnapshot) { setConfirmation(null); setError('账号角色资料已更新，请重新核对。'); return }
    inFlight.current = true; setSubmitting(true); setError('')
    try {
      const result = await onSave({ email: confirmation.email, role: confirmation.role, reason: confirmation.reason })
      if (result?.ok) {
        setConfirmation(null); setReason('')
        setNotice(result.warning || '账号权限已更新，角色调整已生效。')
      } else setError(result?.error || '请求结果尚未确认，请刷新后台核对后再重试。')
    } catch { setError('请求结果尚未确认，请刷新后台核对后再重试。') }
    finally { inFlight.current = false; setSubmitting(false) }
  }

  return <div className="admin-account-roles">
    <p className="muted">账号需先完成本站登录并验证邮箱。先核对变更摘要，再确认提交；角色调整立即生效。</p>
    <ul className="admin-account-list" aria-label="已有管理账号">
      {roles.map(item => <li key={item.user_id}><div><strong>{item.email}</strong><span>{roleNames[item.role] || item.role}{item.user_id === user.id ? ' · 当前账号' : ''}</span></div><button type="button" className="outline-action" disabled={disabled} aria-label={`选择账号 ${item.email}`} onClick={() => selectAccount(item)}>选择账号</button></li>)}
    </ul>
    {!roles.length && <p className="muted">当前列表没有管理账号记录，可输入已验证账号的邮箱；最终身份和角色由服务端核验。</p>}
    <form className="community-form" aria-label="账号权限调整" onSubmit={preview}>
      <label>已验证账号邮箱<input ref={emailRef} type="email" name="email" value={email} onChange={event => { invalidate(); setEmail(event.target.value) }} required maxLength={254} disabled={disabled} autoComplete="off" /></label>
      <div className="admin-role-comparison" aria-live="polite"><div><span>当前角色</span><strong>{currentLabel}</strong></div><div><span>目标角色</span><strong>{roleNames[role]}</strong><p>{roleDetails[role]}</p></div></div>
      <p className="muted">当前角色以最近一次后台刷新结果为准。</p>
      <label>角色<select name="role" value={role} onChange={event => { invalidate(); setRole(event.target.value) }} disabled={disabled}><option value="admin">管理员</option><option value="user">普通用户（撤销管理权限）</option><option value="super_admin">Super admin</option></select></label>
      <label>调整原因<input name="reason" value={reason} onChange={event => { invalidate(); setReason(event.target.value) }} required maxLength={1000} disabled={disabled} /></label>
      {noChange && <p className="muted">目标角色与当前角色相同，无需重复提交。</p>}
      {lastSuperAdmin && <p className="admin-role-warning" role="status">必须保留至少一位 Super admin，不能撤销当前列表中最后一位的权限。请刷新后台核对，或先设置另一位 Super admin。</p>}
      <button type="submit" className="outline-action" disabled={disabled || noChange || lastSuperAdmin}>核对权限调整</button>
    </form>
    {error && <p className="admin-role-warning" role="alert">{error}</p>}
    {notice && <p className="muted" role="status">{notice}</p>}
    {confirmation && <section className="admin-role-confirmation" role="region" aria-label="权限调整确认摘要" ref={summaryRef} tabIndex={-1}>
      <h3>提交前确认</h3>
      <dl><div><dt>目标账号</dt><dd>{confirmation.email}</dd></div><div><dt>当前角色</dt><dd>{confirmation.currentLabel}</dd></div><div><dt>调整为</dt><dd>{roleNames[confirmation.role]}</dd></div><div><dt>影响范围</dt><dd>{roleDetails[confirmation.role]}</dd></div><div><dt>调整原因</dt><dd>{confirmation.reason}</dd></div></dl>
      {!current && <p className="muted">此邮箱未列入已有管理账号。提交时将核对是否已登录并验证邮箱。</p>}
      {confirmation.self && confirmation.role !== 'super_admin' && <p className="admin-role-warning">这是你正在使用的账号，调整后可能失去管理或分配权限的能力。</p>}
      <p className="muted">确认后立即更新当前站点的账号角色，并记录本次操作及原因。</p>
      <div className="admin-role-actions"><button type="button" className="outline-action" disabled={disabled} onClick={() => { setConfirmation(null); setError(''); focusEmail() }}>返回修改</button><button type="button" className="primary-action" disabled={disabled || noChange || lastSuperAdmin} onClick={save}>{submitting ? '正在提交…' : '确认提交权限调整'}</button></div>
    </section>}
  </div>
}
