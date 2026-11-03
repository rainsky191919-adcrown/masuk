import { useEffect, useState } from 'react'
import { command, canModerate, cloudError } from '../lib/sharedBackend'
import AdminLocationList from './AdminLocationList'
import AdminSectionNav from './AdminSectionNav'
import AdminAccountRoles from './AdminAccountRoles'
import AdminLocationActions from './AdminLocationActions'
import AdminAuditLog from './AdminAuditLog'
import { RefreshCcw } from 'lucide-react'

const dateText = value => new Date(value).toLocaleString('zh-CN')
const reportEmptyCopy = {
  open: ['当前没有待处理举报', '本次载入的举报中没有待处理项目。可切换状态查看其他举报，或刷新后台获取最新资料。'],
  resolved: ['当前没有已处理举报', '本次载入的举报中没有处理完成的记录。可切换状态查看待处理或已驳回的举报。'],
  dismissed: ['当前没有已驳回举报', '本次载入的举报中没有被驳回的记录。可切换状态查看其他举报。'],
  all: ['当前没有举报记录', '本次载入未返回举报记录。可刷新后台获取最新资料。'],
}
export default function CloudAdmin({ user, locations, onEdit, onChanged, showToast }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadedAt, setLoadedAt] = useState(null)
  const [filter, setFilter] = useState('open')
  async function load() {
    setLoading(true)
    try { const next = await command('admin'); setData(next); setLoadedAt(new Date().toISOString()); setError(''); return next }
    catch (err) { setData(null); setError(cloudError(err)); return null }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [user?.id, user?.role])
  if (!canModerate(user)) return <section className="detail-panel"><h2>需要管理员权限</h2><p>请使用已获授权的账号登录。</p></section>
  async function run(action, payload) {
    if (busy) return
    setBusy(true)
    try { await command(action, payload); await load(); await onChanged(); showToast('云端操作已保存') }
    catch (err) { showToast(cloudError(err)); if (/ADMIN_REQUIRED/.test(err.message || '')) setData(null) }
    finally { setBusy(false) }
  }
  function moderate(item, targetType) {
    const reason = window.prompt(item.hidden ? '请填写恢复内容的原因' : '请填写隐藏内容的原因')
    if (reason?.trim()) run('moderate', { id: item.id, targetType, hidden: !item.hidden, reason: reason.trim() })
  }
  async function changeRole(payload) {
    if (busy || loading) return { ok: false, error: '后台正在处理其他操作，请稍后重新核对。' }
    setBusy(true)
    try {
      try { await command('set_role', payload) }
      catch (err) {
        const message = cloudError(err)
        return { ok: false, error: message.startsWith('云端操作未完成') ? '请求结果尚未确认，请刷新后台核对账号角色后再重试。' : message }
      }
      const refreshed = await load()
      let synced = true
      try { await onChanged() } catch { synced = false }
      const warning = !refreshed || !synced ? '权限调整已保存，但页面未能完整刷新，请刷新后台核对最新角色。' : ''
      showToast(warning || '账号权限已更新')
      return { ok: true, warning }
    } finally { setBusy(false) }
  }
  const visibleReports = data?.reports.filter(x => filter === 'all' || x.status === filter) || []
  const discussionItems = data ? [...data.posts.map(x => ({ ...x, targetType: 'post' })), ...data.replies.map(x => ({ ...x, targetType: 'reply' })), ...data.feedback.map(x => ({ ...x, title: '到访反馈', body: x.note, targetType: 'feedback' }))] : []
  const [emptyReportTitle, emptyReportHint] = reportEmptyCopy[filter]
  return <section className="admin-layout" aria-label="云端后台管理">
    <div className="admin-heading"><div><div className="eyebrow">MASUK MANAGEMENT</div><h1>后台管理</h1><p>{user.name} · {user.role === 'super_admin' ? 'Super admin' : '管理员'}</p></div><button disabled={busy || loading} className="outline-action" onClick={load}><RefreshCcw size={16} aria-hidden="true" />{loading ? '刷新中…' : '刷新后台'}</button></div>
    {loadedAt && <p className="admin-refresh-status">上次成功载入：<time dateTime={loadedAt}>{new Date(loadedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' })}</time>（UTC+8）</p>}
    <p className="community-notice">云端管理 · 保存成功后会更新当前站点，其他设备可读取；处理原因和操作记录由服务端留存。</p>
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">正在载入后台…</p>}
    {data && <>
      <div className="admin-stats"><div className="admin-stat"><strong>{locations.length}</strong><span>地点</span></div><div className="admin-stat"><strong>{data.posts.length}</strong><span>帖子（含隐藏）</span></div><div className="admin-stat"><strong>{data.reports.filter(x => x.status === 'open').length}</strong><span>待处理举报</span></div></div>
      <AdminSectionNav items={[
        { id: 'admin-reports', label: '举报处理', shortLabel: '举报' },
        { id: 'admin-content', label: '讨论内容管理', shortLabel: '内容' },
        { id: 'admin-locations', label: '地点管理', shortLabel: '地点' },
        ...(user.role === 'super_admin' ? [{ id: 'admin-accounts', label: '管理员账号', shortLabel: '账号' }] : []),
        { id: 'admin-audit', label: '操作记录', shortLabel: '记录' },
      ]} />
      <section className="detail-panel"><h2 className="admin-section-heading" id="admin-reports" tabIndex={-1}>举报处理</h2><label className="admin-report-filter">举报状态<select value={filter} onChange={e => setFilter(e.target.value)}><option value="open">待处理</option><option value="resolved">已处理</option><option value="dismissed">已驳回</option><option value="all">全部</option></select></label>
        {!visibleReports.length && <div className="admin-empty-state" role="status"><strong>{emptyReportTitle}</strong><p>{emptyReportHint}</p></div>}
        {visibleReports.map(report => {
          const target = report.target_type === 'post' ? data.posts.find(x => x.id === report.target) : report.target_type === 'reply' ? data.replies.find(x => x.id === report.target) : report.target_type === 'feedback' ? data.feedback.find(x => x.id === report.target) : locations.find(x => x.id === report.target)
          return <article className="discussion-post" key={report.id}><strong>{target?.title || target?.name || '回复 / 反馈'} · {report.target_type}</strong><p className="post-body">{target?.body || target?.note || target?.address || '内容已不可见'}</p><p>举报原因：{report.reason}</p><small>举报者 ID：{report.reporter} · {dateText(report.created_at)}</small>
            {report.status === 'open' ? <form className="community-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); run('resolve_report', { id: report.id, status: f.get('status'), reason: f.get('reason').trim(), hide: f.get('hide') === 'on' }) }}>
              <label>处理结论<select name="status"><option value="resolved">举报成立，处理完成</option><option value="dismissed">驳回举报</option></select></label>
              {report.target_type !== 'location' && <label className="admin-checkbox-label"><input type="checkbox" name="hide" /> 同时隐藏被举报内容（仅举报成立时）</label>}
              {report.target_type === 'location' && target && <button type="button" className="outline-action" onClick={() => onEdit(target)}>查看并修改地点</button>}
              <label>处理说明<textarea name="reason" required maxLength={1000} /></label><button disabled={busy} className="primary-action">提交处理结果</button>
            </form> : <p>结论：{report.status} · {report.resolution} · {report.resolved_at && dateText(report.resolved_at)}</p>}
          </article>
        })}
      </section>
      <section className="detail-panel"><h2 className="admin-section-heading" id="admin-content" tabIndex={-1}>讨论内容管理</h2><p className="muted">查看帖子、回复和到访反馈。隐藏可恢复；不会永久删除用户内容。</p>
        {discussionItems.map(item => <article className="discussion-post" key={item.id}><strong>{item.title || '回复'} · {item.author} · {item.hidden ? '已隐藏' : '公开'}</strong><p className="post-body">{item.body}</p><button disabled={busy} className="outline-action" onClick={() => moderate(item, item.targetType)}>{item.hidden ? '恢复内容' : '隐藏内容'}</button>{item.targetType === 'post' && !item.hidden && <button disabled={busy} className="outline-action" onClick={() => run('pin', { id: item.id, enabled: !item.pinned })}>{item.pinned ? '取消置顶' : '置顶'}</button>}</article>)}
        {!discussionItems.length && <div className="admin-empty-state" role="status"><strong>当前没有可管理的讨论内容</strong><p>本次载入未返回帖子、回复或到访反馈。后续可刷新后台查看最新内容。</p></div>}
      </section>
      <section className="detail-panel"><h2 className="admin-section-heading" id="admin-locations" tabIndex={-1}>地点管理</h2><AdminLocationList locations={locations} renderRow={location => <div className="admin-row" key={location.id}><div className="admin-location"><strong>{location.name}</strong><span>{location.area} · 版本 {location.revision_number || 1}</span></div><span className={`admin-location-state${location.review_needed ? ' review-needed' : ''}`}>管理状态：{location.review_needed ? '需复核' : '正常'}</span><AdminLocationActions location={location} reviewNeeded={Boolean(location.review_needed)} disabled={busy} onEdit={onEdit} onToggleReview={() => run('review_location', { id: location.id, enabled: !location.review_needed })} /></div>} /></section>
      {user.role === 'super_admin' && <section className="detail-panel"><h2 className="admin-section-heading" id="admin-accounts" tabIndex={-1}>管理员账号</h2><AdminAccountRoles roles={data.roles} user={user} busy={busy || loading} onSave={changeRole} /></section>}
      <section className="detail-panel"><h2 className="admin-section-heading" id="admin-audit" tabIndex={-1}>最近操作记录</h2><AdminAuditLog records={data.audit} locations={locations} context={data} user={user} /></section>
    </>}
  </section>
}
