import { useRef, useState } from 'react'
import { ArrowLeft, Clipboard, MapPin, ShieldCheck, Info } from 'lucide-react'
import AccuracyPanel from './AccuracyPanel'
import { difficultyMeta } from '../data.skudai'
import { requirement, summarize } from '../lib/community'
import Discussion from './Discussion'

const dateText = date => new Date(date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const localDate = value => { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

export function Friendliness({ location, feedback, compact = false }) {
  const summary = summarize(location, feedback)
  const meta = difficultyMeta[summary.level]
  if (compact) {
    const label = summary.level ? meta.label : summary.count ? '反馈不足，暂未评分' : '尚无司机评分'
    return <div className="friendliness friendliness-compact" aria-label={`通关友好度：${label}`}>
      <div className="friendliness-heading"><span className={`status-dot rating-${summary.level}`} aria-hidden="true" /><strong>{label}</strong></div>
      <p className="compact-feedback-meta">近30天 · {summary.count ? `${summary.count} 位司机反馈` : '暂无近期到访反馈'}{!summary.level && summary.count > 0 && ' · 满3位后形成评分'}{summary.level > 0 && summary.disputed && <span className="dispute"> · 体验有分歧</span>}</p>
      {summary.latest && <p className="compact-feedback-meta">最近到访反馈：{dateText(summary.latest)}</p>}
    </div>
  }
  return <div className={`friendliness ${compact ? 'friendliness-compact' : ''}`}>
    <div className="friendliness-heading"><span className={`status-dot rating-${summary.level}`} /><strong>{meta.label}</strong>{compact && <span>{summary.count} 位司机反馈</span>}</div>
    {!compact && <p>{summary.level ? meta.description : '还需要更多近期实测，公开门禁资料不等于通关体验。'}</p>}
    <div className="rating-scale" aria-label={`通关友好度：${meta.label}`}>
      {[1, 2, 3, 4, 5].map(level => <div key={level} className={`rating-${level} ${summary.level === level ? 'rating-selected' : ''}`}><span>{difficultyMeta[level].label}</span></div>)}
    </div>
    {!compact && <div className="feedback-meta"><span>近30天 · {summary.count} 位司机反馈{summary.latest && ` · 最近到访：${dateText(summary.latest)}`}</span>{summary.disputed && <span className="dispute">体验有分歧，请查看具体反馈</span>}</div>}
  </div>
}

export default function LocationDetail({ location, community, saveCommunity, shared = false, onAction, user, onBack, onLogin, copyRules, showToast, onEdit, onApprove, entry, discussionMemory }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const feedbackRef = useRef(null)
  function openFeedback() {
    setFeedbackOpen(true)
    requestAnimationFrame(() => { feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); feedbackRef.current?.querySelector('select')?.focus({ preventScroll: true }) })
  }
  const actionLock = useRef(false)
  const [busy, setBusy] = useState(false)
  const allReports = community.feedback.filter(item => item.locationId === location.id).sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
  const reports = allReports.filter(item => Date.now() - new Date(item.visitedAt).getTime() <= 30 * 86400000 && new Date(item.visitedAt).getTime() <= Date.now())
  const currentReport = allReports.find(item => item.authorId === user?.id)
  const rules = location.entry_requirements
  const requireUser = () => { if (user) return true; showToast('请先使用顶部登录后发言'); return false }
  async function act(action, payload) {
    if (!requireUser() || actionLock.current) return false
    actionLock.current = true; setBusy(true)
    try { return await onAction(action, payload) }
    finally { actionLock.current = false; setBusy(false) }
  }
  async function reportContent(id, targetType = 'post') {
    if (!requireUser()) return
    if (!shared) return showToast('此举报功能需要共享后台')
    const reason = window.prompt('请说明举报原因，请勿填写证件或住户隐私')
    if (reason?.trim() && await act('report', { id, targetType, reason: reason.trim() })) showToast('举报已提交至管理员')
  }
  async function submitFeedback(event) {
    event.preventDefault()
    if (!requireUser()) return
    const data = new FormData(event.currentTarget)
    const report = { locationId: location.id, authorId: user.id, author: user.name, level: Number(data.get('level')), visitedAt: new Date(`${data.get('visitedAt')}T${data.get('time') || '12:00'}`).toISOString(), service: data.get('service'), note: data.get('note').trim(), requirements: Object.fromEntries(['need_qr', 'need_ic', 'bike_allowed'].map(key => [key, data.get(key)])) }
    if (new Date(report.visitedAt).getTime() > Date.now()) return showToast('到访时间不能晚于现在')
    if (shared) {
      if (await act('feedback', report)) { setFeedbackOpen(false); showToast('通关反馈已保存至云端') }
      return
    }
    if (saveCommunity({ ...community, feedback: [...community.feedback.filter(item => !(item.locationId === location.id && item.authorId === user.id)), report] })) { setFeedbackOpen(false); showToast('通关反馈已保存，同一账号在此地点的新反馈会替换旧反馈') }
  }
  function renderReport(report) {
    return <div className="visit-record" key={report.authorId}>
      <strong>{difficultyMeta[report.level].label} · 尚未核实</strong>
      <span className="post-meta">{report.author} · {dateText(report.visitedAt)} · {report.service}</span>
      <p>{report.note || '未补充说明'}</p>
      <small>司机自报 · QR：{report.requirements.need_qr} · 证件：{report.requirements.need_ic} · 骑车：{report.requirements.bike_allowed}</small>
      {shared && <button disabled={busy} className="text-action" onClick={() => reportContent(report.id, 'feedback')}>举报反馈</button>}
    </div>
  }
  return <section className="detail-page">
    <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> 返回地点列表 <span>/ {location.area} / 地点详情</span></button>
    <div className="detail-heading"><div><div className="eyebrow">DRIVER FIELD NOTES</div><h1 tabIndex={-1} ref={element => element && !element.dataset.focused && (element.dataset.focused = 'true', element.focus())}>{location.name}</h1><p><MapPin size={16} />{location.address}</p></div><div className="detail-heading-actions"><a className="primary-action" href={location.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + ' ' + location.area)}`} target="_blank" rel="noreferrer"><MapPin size={16} /> 地图导航</a><button className="primary-action" aria-label="我刚去过 · 补充反馈" onClick={openFeedback}>我刚去过</button><button onClick={() => copyRules(location)}><Clipboard size={16} /> 复制规则</button></div></div>
    <details className="sharing-note"><summary>资料共享说明</summary><div className="community-notice"><Info size={16} /><span>{shared ? '云端共享 · 资料、认可、讨论与反馈同步至当前环境；旧本机内容不会自动上传。' : '本机体验版 · 资料、认可、讨论与反馈仅保存在此浏览器，尚未跨设备共享。'}</span></div></details>
    {busy && <p role="status">正在保存至云端…</p>}
    {shared && <button className="text-action" onClick={() => reportContent(location.id, 'location')}>举报地点资料</button>}
    <div className="detail-grid"><div className="detail-main">

      <section className="detail-panel"><h2>进门要求</h2><div className="requirement-grid">{[['顾客 QR', requirement(rules.need_qr)], ['证件登记', requirement(rules.need_ic)], ['骑车进入', requirement(rules.bike_allowed, '可进入', '不可进入')], ['临时停车', rules.parking || '待确认']].map(([label, value]) => <div key={label}><span>{label}</span><strong className={value === '待确认' ? 'unknown-text' : ''}>{value}</strong></div>)}</div><p className="entry-rule">{rules.gate_rule}</p>{location.entrance_note && <p className="entry-rule"><MapPin size={14} /> 入口提示：{location.entrance_note}</p>}<div className="detail-tip"><Info size={15} />{location.tips}</div><AccuracyPanel location={location} user={user} onEdit={onEdit} onApprove={onApprove} /></section>
      <section className="detail-panel" id="recent-reports">
        <h2>近期司机报告</h2><p className="muted">近30天 · {reports.length} 位司机报告；个人到访经历尚未核实，不自动覆盖当前规则。至少3位司机反馈才形成评分。</p>
        {!reports.length && <p className="muted">近30天暂无司机反馈，进门要求仍需现场确认。</p>}
        {reports.map(renderReport)}
        {allReports.length > reports.length && <details className="older-reports"><summary>查看其他原报告（{allReports.length - reports.length}）</summary>{allReports.filter(report => !reports.includes(report)).map(renderReport)}</details>}
      </section>
      <section className="detail-panel"><h2>通关友好度</h2><Friendliness compact location={location} feedback={community.feedback} /><details className="rating-help"><summary>查看等级说明</summary><Friendliness location={location} feedback={community.feedback} /></details></section>
      <section className="detail-panel" ref={feedbackRef}><ShieldCheck className="sidebar-icon" size={25} /><h2>我刚去过</h2><p className="muted">留下实际通关体验，帮下一位少绕路。</p><button className="outline-action" onClick={() => setFeedbackOpen(!feedbackOpen)} aria-expanded={feedbackOpen}>{currentReport ? '更新我的通关反馈' : '填写通关反馈'}</button>
        {!user && <button className="outline-action" onClick={onLogin}>登录后补充反馈</button>}{feedbackOpen && <form className="community-form feedback-form" onSubmit={submitFeedback} key={user?.id || 'guest'}><label>通关感受<select name="level" defaultValue={currentReport?.level || 3}>{[1, 2, 3, 4, 5].map(level => <option key={level} value={level}>{difficultyMeta[level].label}</option>)}</select></label><label>到访日期<input name="visitedAt" type="date" required max={today()} defaultValue={currentReport ? localDate(currentReport.visitedAt) : today()} /></label><label>到访时间<input name="time" type="time" required defaultValue={new Date(currentReport?.visitedAt || Date.now()).toTimeString().slice(0, 5)} /></label><label>服务类型<select name="service" defaultValue={currentReport?.service || '外卖配送'}><option>外卖配送</option><option>包裹送货</option><option>接送乘客</option><option>其他</option></select></label>{[['need_qr', '需要顾客 QR'], ['need_ic', '需要证件登记'], ['bike_allowed', '允许骑车进入']].map(([key, label]) => <label key={key}>{label}<select name={key} defaultValue={currentReport?.requirements[key] || '待确认'}><option>待确认</option><option>是</option><option>否</option></select></label>)}<label>现场说明<textarea name="note" rows={3} maxLength={1000} defaultValue={currentReport?.note} placeholder="补充入口、时段和实际流程" /></label><button className="primary-action" type="submit" disabled={!user}>保存反馈</button></form>}
      </section>
      <Discussion key={user?.id || 'guest'} locationId={location.id} community={community} shared={shared} onAction={onAction} saveCommunity={saveCommunity} user={user} onLogin={onLogin} showToast={showToast} entry={entry} memory={discussionMemory} />

    </div><aside className="detail-sidebar">

      <section className="detail-panel data-note"><Info size={21} /><h3>公开资料 ≠ 司机实测</h3><p>未知信息单独标记，未有足够实测时不推算友好度。单条帖子不会改变等级，现场规则以保安安排为准。</p></section>
    </aside></div>
  </section>
}
