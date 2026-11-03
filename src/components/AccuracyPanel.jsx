import { useState } from 'react'
import { Check, Pencil, History, ChevronDown } from 'lucide-react'
import { displayValue, differences, snapshot } from '../lib/revisions'

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const dateText = value => value ? new Date(value).toLocaleString('zh-CN') : '时间未记录'
function historicalRow(data) { return { ...data, entry_requirements: data } }

export function ChangeList({ before, after }) {
  const changes = differences(before, after)
  return <dl className="version-diff">{changes.map(change => <div key={change.key}><dt>{change.label}</dt><dd><del>{change.before}</del><span>→</span><ins>{change.after}</ins></dd></div>)}</dl>
}

export default function AccuracyPanel({ location, user, onApprove, onEdit }) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [visitDate, setVisitDate] = useState('')
  const votes = location.accuracy_votes || []
  const approved = votes.some(vote => vote.userId === user?.id)
  const history = location.revisions || []
  const current = { id: location.revision_id || 'current', number: location.revision_number || 1, data: snapshot(location), author: location.last_modified_by || '公开资料导入', createdAt: location.updated_at, reason: location.revision_reason || '原有资料', approvals: votes }
  return <section className="accuracy-panel" aria-label="资料准确性">
    <div className="section-heading"><h3>这份资料准确吗？</h3><span className="version-badge">版本 {current.number}</span></div>
    <p>认可的是当前资料的正确性，与通关友好度分开计算。修改保存后立即生效，无需审核。</p>
    {!approved && <label className="approval-date">实际到访日期（选填）<input type="date" value={visitDate} max={today()} onChange={event => setVisitDate(event.target.value)} /></label>}
    <div className="accuracy-actions"><button disabled={busy} className={approved ? 'accuracy-approved' : ''} aria-pressed={approved} onClick={async () => { setBusy(true); try { await onApprove(location, visitDate) } finally { setBusy(false) } }}><Check size={16} />{approved ? '已认可，点击取消' : '资料准确'} · {votes.length} 人认可</button><button onClick={() => onEdit(location)}><Pencil size={16} /> 有出入，我来修改</button></div>
    {votes.length > 0 && <p className="approval-names">{votes.map(vote => `${vote.name}${vote.visitDate ? `（到访 ${vote.visitDate}）` : ''}`).join('、')}</p>}
    <button className="history-toggle" aria-expanded={historyOpen} onClick={() => setHistoryOpen(!historyOpen)}><History size={15} /> 修改记录 · {history.length} 次修改 <ChevronDown size={14} /></button>
    {historyOpen && <div className="version-history">{[...history, current].reverse().map((version, index, ordered) => <details key={version.id} className="history-entry"><summary><strong>版本 {version.number}{index === 0 ? ' · 当前' : ''}</strong><span>{version.author} · {dateText(version.createdAt)}</span><span>{version.approvals?.length || 0} 人认可</span></summary><p className="revision-reason">修改说明：{version.reason}</p>{ordered[index + 1] && <ChangeList before={historicalRow(ordered[index + 1].data)} after={historicalRow(version.data)} />}<details className="version-snapshot"><summary>查看此版本完整资料</summary><dl>{Object.entries(version.data).map(([key, value]) => <div key={key}><dt>{({ name: '公寓名称', area: '区域', address: '地址', latitude: '入口纬度', longitude: '入口经度', entrance_note: '入口说明', need_qr: '顾客 QR', need_ic: '证件登记', fee_required: '缴费', bike_allowed: '骑车进入', parking: '停车', gate_rule: '门禁规则', tips: '司机贴士', difficulty_level: '填写者通关感受' })[key]}</dt><dd>{displayValue(value)}</dd></div>)}</dl></details>{index > 0 && <p className="muted">此版本的认可仅供历史参考，不计入当前版本。</p>}</details>)}</div>}
  </section>
}
