import { useEffect, useState } from 'react'
import { command, canModerate, cloudError } from '../lib/sharedBackend'

const dateText = value => new Date(value).toLocaleString('zh-CN')
export default function CloudAdmin({ user, locations, onEdit, onChanged, showToast }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('open')
  async function load() {
    try { setData(await command('admin')); setError('') }
    catch (err) { setData(null); setError(cloudError(err)) }
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
  return <section className="admin-layout" aria-label="云端后台管理">
    <div className="admin-heading"><div><div className="eyebrow">MASUK MANAGEMENT</div><h2>后台管理</h2><p>{user.name} · {user.role === 'super_admin' ? 'Super admin' : '管理员'}</p></div><button disabled={busy} className="outline-action" onClick={load}>刷新后台</button></div>
    <p className="community-notice">管理操作保存至当前环境，处理原因和操作记录由服务端留存。</p>
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">正在载入后台…</p>}
    {data && <>
      <div className="admin-stats"><div className="admin-stat"><strong>{locations.length}</strong><span>地点</span></div><div className="admin-stat"><strong>{data.posts.length}</strong><span>帖子（含隐藏）</span></div><div className="admin-stat"><strong>{data.reports.filter(x => x.status === 'open').length}</strong><span>待处理举报</span></div></div>
      <section className="detail-panel"><h3>举报处理</h3><label>举报状态<select value={filter} onChange={e => setFilter(e.target.value)}><option value="open">待处理</option><option value="resolved">已处理</option><option value="dismissed">已驳回</option><option value="all">全部</option></select></label>
        {!data.reports.some(x => filter === 'all' || x.status === filter) && <p>暂无此状态的举报</p>}
        {data.reports.filter(x => filter === 'all' || x.status === filter).map(report => {
          const target = report.target_type === 'post' ? data.posts.find(x => x.id === report.target) : report.target_type === 'reply' ? data.replies.find(x => x.id === report.target) : report.target_type === 'feedback' ? data.feedback.find(x => x.id === report.target) : locations.find(x => x.id === report.target)
          return <article className="discussion-post" key={report.id}><strong>{target?.title || target?.name || '回复 / 反馈'} · {report.target_type}</strong><p className="post-body">{target?.body || target?.note || target?.address || '内容已不可见'}</p><p>举报原因：{report.reason}</p><small>举报者 ID：{report.reporter} · {dateText(report.created_at)}</small>
            {report.status === 'open' ? <form className="community-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); run('resolve_report', { id: report.id, status: f.get('status'), reason: f.get('reason').trim(), hide: f.get('hide') === 'on' }) }}>
              <label>处理结论<select name="status"><option value="resolved">举报成立，处理完成</option><option value="dismissed">驳回举报</option></select></label>
              {report.target_type !== 'location' && <label><input type="checkbox" name="hide" /> 同时隐藏被举报内容（仅举报成立时）</label>}
              {report.target_type === 'location' && target && <button type="button" className="outline-action" onClick={() => onEdit(target)}>查看并修改地点</button>}
              <label>处理说明<textarea name="reason" required maxLength={1000} /></label><button disabled={busy} className="primary-action">提交处理结果</button>
            </form> : <p>结论：{report.status} · {report.resolution} · {report.resolved_at && dateText(report.resolved_at)}</p>}
          </article>
        })}
      </section>
      <section className="detail-panel"><h3>跨设备内容管理</h3><p>隐藏可恢复；不会永久删除用户内容。</p>
        {[...data.posts.map(x => ({ ...x, targetType: 'post' })), ...data.replies.map(x => ({ ...x, targetType: 'reply' })), ...data.feedback.map(x => ({ ...x, title: '到访反馈', body: x.note, targetType: 'feedback' }))].map(item => <article className="discussion-post" key={item.id}><strong>{item.title || '回复'} · {item.author} · {item.hidden ? '已隐藏' : '公开'}</strong><p className="post-body">{item.body}</p><button disabled={busy} className="outline-action" onClick={() => moderate(item, item.targetType)}>{item.hidden ? '恢复内容' : '隐藏内容'}</button>{item.targetType === 'post' && !item.hidden && <button disabled={busy} className="outline-action" onClick={() => run('pin', { id: item.id, enabled: !item.pinned })}>{item.pinned ? '取消置顶' : '置顶'}</button>}</article>)}
        {!data.posts.length && !data.replies.length && <p>暂无云端讨论内容</p>}
      </section>
      <section className="detail-panel"><h3>地点管理</h3>{locations.map(location => <div className="admin-row" key={location.id}><div className="admin-location"><strong>{location.name}</strong><span>{location.area} · 版本 {location.revision_number || 1}</span></div><span>{location.review_needed ? '需复核' : '正常'}</span><div className="admin-row-actions"><button disabled={busy} className="outline-action" onClick={() => onEdit(location)}>修改资料</button><button disabled={busy} className="outline-action" onClick={() => run('review_location', { id: location.id, enabled: !location.review_needed })}>{location.review_needed ? '取消复核' : '标记复核'}</button></div></div>)}</section>
      {user.role === 'super_admin' && <section className="detail-panel"><h3>管理员账号</h3><p>账号需先完成本站登录并验证邮箱。角色调整立即在服务端生效。</p>{data.roles.map(item => <p key={item.user_id}>{item.email} · {item.role}</p>)}<form className="community-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); if (window.confirm('确认调整此账号的管理权限？')) run('set_role', { email: f.get('email').trim(), role: f.get('role'), reason: f.get('reason').trim() }) }}><label>已验证账号邮箱<input type="email" name="email" required /></label><label>角色<select name="role"><option value="admin">管理员</option><option value="user">普通用户（撤销管理权限）</option><option value="super_admin">Super admin</option></select></label><label>调整原因<input name="reason" required maxLength={1000} /></label><button disabled={busy} className="primary-action">保存账号权限</button></form></section>}
      <section className="detail-panel"><h3>最近 100 条操作记录</h3>{data.audit.map(item => <p key={item.id}>{dateText(item.created_at)} · {item.action} · {item.target} · {item.reason} · 操作者 {item.actor || '初始化'}</p>)}</section>
    </>}
  </section>
}
