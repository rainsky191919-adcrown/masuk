import { useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Clipboard, MapPin, MessageSquare, Plus, ShieldCheck, Info, Flag, ThumbsUp, Trash2, Pin } from 'lucide-react'
import AccuracyPanel from './AccuracyPanel'
import { difficultyMeta } from '../data.skudai'
import { requirement, summarize } from '../lib/community'

const types = ['提问', '经验分享', '规则变化']
const dateText = date => new Date(date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const localDate = value => { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

export function Friendliness({ location, feedback, compact = false }) {
  const summary = summarize(location, feedback)
  const meta = difficultyMeta[summary.level]
  return <div className={`friendliness ${compact ? 'friendliness-compact' : ''}`}>
    <div className="friendliness-heading"><span className={`status-dot rating-${summary.level}`} /><strong>{meta.label}</strong>{compact && <span>{summary.count} 位司机反馈</span>}</div>
    {!compact && <p>{summary.level ? meta.description : '还需要更多近期实测，公开门禁资料不等于通关体验。'}</p>}
    <div className="rating-scale" aria-label={`通关友好度：${meta.label}`}>
      {[1, 2, 3, 4, 5].map(level => <div key={level} className={`rating-${level} ${summary.level === level ? 'rating-selected' : ''}`}><span>{difficultyMeta[level].label}</span></div>)}
    </div>
    {!compact && <div className="feedback-meta"><span>近30天 · {summary.count} 位司机反馈{summary.latest && ` · 最近到访：${dateText(summary.latest)}`}</span>{summary.disputed && <span className="dispute">体验有分歧，请查看具体反馈</span>}</div>}
  </div>
}

export default function LocationDetail({ location, community, saveCommunity, user, onBack, onLogin, copyRules, showToast, onEdit, onApprove }) {
  const [tab, setTab] = useState('全部')
  const [sort, setSort] = useState('latest')
  const [replyTo, setReplyTo] = useState(null)
  const [expanded, setExpanded] = useState([])
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const titleRef = useRef(null)
  const posts = community.posts.filter(post => post.locationId === location.id)
  const reports = community.feedback.filter(item => item.locationId === location.id).sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
  const currentReport = reports.find(item => item.authorId === user?.id)
  const visiblePosts = posts.filter(post => tab === '全部' || post.type === tab).sort((a, b) => Number(b.pinned) - Number(a.pinned) || (sort === 'helpful' ? b.helpful.length - a.helpful.length : new Date(b.activityAt) - new Date(a.activityAt)))
  const rules = location.entry_requirements
  const requireUser = () => { if (user) return true; showToast('请先使用顶部登录后发言'); return false }
  function submitPost(event) {
    event.preventDefault()
    if (!requireUser()) return
    const data = new FormData(event.currentTarget)
    const title = data.get('title').trim(), body = data.get('body').trim()
    if (!title || !body) return showToast('标题和内容不能只填写空格')
    const now = new Date().toISOString()
    const post = { id: crypto.randomUUID(), locationId: location.id, authorId: user.id, author: user.name, type: data.get('type'), title, body, visitDate: data.get('visitDate'), service: data.get('service'), createdAt: now, activityAt: now, replies: [], helpful: [], reports: [], pinned: false }
    if (saveCommunity({ ...community, posts: [post, ...community.posts] })) { event.currentTarget.reset(); setTab('全部'); showToast('帖子已保存在此浏览器'); }
  }
  function updatePost(id, change) { return saveCommunity({ ...community, posts: community.posts.map(post => post.id === id ? change(post) : post) }) }
  function deletePost(post) {
    if (user?.id !== post.authorId || !window.confirm('删除这篇帖子及其回复？')) return
    saveCommunity({ ...community, posts: community.posts.filter(item => item.id !== post.id) })
  }
  function submitReply(event, post) {
    event.preventDefault()
    if (!requireUser()) return
    const body = new FormData(event.currentTarget).get('reply').trim()
    if (!body) return showToast('请填写回复内容')
    const now = new Date().toISOString()
    if (updatePost(post.id, item => ({ ...item, activityAt: now, replies: [...item.replies, { id: crypto.randomUUID(), authorId: user.id, author: user.name, body, createdAt: now }] }))) { setReplyTo(null); setExpanded([...expanded, post.id]); showToast('回复已保存') }
  }
  function submitFeedback(event) {
    event.preventDefault()
    if (!requireUser()) return
    const data = new FormData(event.currentTarget)
    const report = { locationId: location.id, authorId: user.id, author: user.name, level: Number(data.get('level')), visitedAt: new Date(`${data.get('visitedAt')}T${data.get('time') || '12:00'}`).toISOString(), service: data.get('service'), note: data.get('note').trim(), requirements: Object.fromEntries(['need_qr', 'need_ic', 'bike_allowed'].map(key => [key, data.get(key)])) }
    if (new Date(report.visitedAt).getTime() > Date.now()) return showToast('到访时间不能晚于现在')
    if (saveCommunity({ ...community, feedback: [...community.feedback.filter(item => !(item.locationId === location.id && item.authorId === user.id)), report] })) { setFeedbackOpen(false); showToast('通关反馈已保存，同一账号在此地点的新反馈会替换旧反馈') }
  }
  return <section className="detail-page">
    <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> 返回地点列表 <span>/ {location.area} / 地点详情</span></button>
    <div className="detail-heading"><div><div className="eyebrow">DRIVER FIELD NOTES</div><h1 tabIndex={-1} ref={element => element && !element.dataset.focused && (element.dataset.focused = 'true', element.focus())}>{location.name}</h1><p><MapPin size={16} />{location.address}</p></div><div className="detail-heading-actions"><a className="primary-action" href={location.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + ' ' + location.area)}`} target="_blank" rel="noreferrer"><MapPin size={16} /> 地图导航</a><button onClick={() => copyRules(location)}><Clipboard size={16} /> 复制规则</button></div></div>
    <div className="community-notice"><Info size={16} /><span>本机体验版 · 资料、认可、讨论与反馈仅保存在此浏览器，尚未跨设备共享。</span></div>
    <div className="detail-grid"><div className="detail-main">
      <section className="detail-panel"><h2>通关友好度</h2><Friendliness location={location} feedback={community.feedback} /></section>
      <section className="detail-panel"><h2>进门要求</h2><div className="requirement-grid">{[['顾客 QR', requirement(rules.need_qr)], ['证件登记', requirement(rules.need_ic)], ['骑车进入', requirement(rules.bike_allowed, '可进入', '不可进入')], ['临时停车', rules.parking || '待确认']].map(([label, value]) => <div key={label}><span>{label}</span><strong className={value === '待确认' ? 'unknown-text' : ''}>{value}</strong></div>)}</div><p className="entry-rule">{rules.gate_rule}</p>{location.entrance_note && <p className="entry-rule"><MapPin size={14} /> 入口提示：{location.entrance_note}</p>}<div className="detail-tip"><Info size={15} />{location.tips}</div><AccuracyPanel location={location} user={user} onEdit={onEdit} onApprove={onApprove} /></section>
      <section className="detail-panel discussion-section"><div className="section-heading"><h2>司机讨论 <span className="count-chip">{posts.length}</span></h2><button className="primary-action" onClick={() => { titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); titleRef.current?.focus() }}><Plus size={17} /> 发帖子</button></div>
        <div className="discussion-toolbar"><div className="discussion-tabs" aria-label="讨论类型">{['全部', ...types].map(type => <button key={type} aria-pressed={tab === type} className={tab === type ? 'selected' : ''} onClick={() => setTab(type)}>{type}</button>)}</div><select aria-label="讨论排序" value={sort} onChange={event => setSort(event.target.value)}><option value="latest">最新活动</option><option value="helpful">最多帮助</option></select></div>
        {!visiblePosts.length && <div className="discussion-empty"><MessageSquare size={28} /><h3>{posts.length ? '这个分类还没有帖子' : '这里的第一条经验，等你来分享'}</h3><p>问问入口怎么走，或留下今天的真实通关经历。</p></div>}
        {visiblePosts.map(post => <article className="discussion-post" key={post.id}>
          <div className="post-type"><span>{post.type}</span>{post.pinned && <span className="pinned"><Pin size={13} />已置顶</span>}</div><h3>{post.title}</h3><p className="post-body">{post.body}</p><div className="post-meta">{post.author} · {dateText(post.createdAt)} · {post.service}{post.visitDate && ` · 到访 ${post.visitDate}`}</div>
          <div className="post-actions"><button aria-expanded={expanded.includes(post.id)} onClick={() => setExpanded(expanded.includes(post.id) ? expanded.filter(id => id !== post.id) : [...expanded, post.id])}><MessageSquare size={15} /> {post.replies.length} 条回复</button><button aria-pressed={post.helpful.includes(user?.id)} onClick={() => requireUser() && updatePost(post.id, item => ({ ...item, helpful: item.helpful.includes(user.id) ? item.helpful.filter(id => id !== user.id) : [...item.helpful, user.id] }))}><ThumbsUp size={15} /> {post.helpful.length} 人有帮助</button><button onClick={() => { if (requireUser() && !post.reports.includes(user.id) && updatePost(post.id, item => ({ ...item, reports: [...item.reports, user.id] }))) showToast('已在本机标记举报，尚未发送至管理员') }} disabled={post.reports.includes(user?.id)}><Flag size={14} />{post.reports.includes(user?.id) ? '已标记' : '举报'}</button>{user?.id === post.authorId && <button onClick={() => deletePost(post)}><Trash2 size={14} />删除</button>}{user?.role === 'admin' && <button onClick={() => updatePost(post.id, item => ({ ...item, pinned: !item.pinned }))}><Pin size={14} />{post.pinned ? '取消置顶' : '置顶'}</button>}</div>
          {expanded.includes(post.id) && <div className="post-replies">{!post.replies.length && <p className="muted">还没有回复，来聊聊你的经验。</p>}{post.replies.map(reply => <div className="post-reply" key={reply.id}><div className="post-meta">{reply.author} · {dateText(reply.createdAt)}</div><p>{reply.body}</p>{user?.id === reply.authorId && <button className="text-action" onClick={() => window.confirm('删除这条回复？') && updatePost(post.id, item => ({ ...item, replies: item.replies.filter(value => value.id !== reply.id) }))}>删除回复</button>}</div>)}</div>}
          <button className="text-action" onClick={() => requireUser() && setReplyTo(replyTo === post.id ? null : post.id)}> {replyTo === post.id ? '取消回复' : '我要回复'} <ArrowUpRight size={13} /></button>{replyTo === post.id && <form className="reply-form" onSubmit={event => submitReply(event, post)}><label>回复内容<textarea name="reply" required maxLength={1500} rows={3} autoFocus /></label><button className="primary-action" type="submit">发布回复</button></form>}
        </article>)}
      </section>
      <section className="detail-panel"><h2>近期实测记录</h2><p className="muted">同一账号保留最新一条记录，至少3位司机近30天反馈才显示综合等级。</p>{!reports.length && <p className="muted">暂无司机反馈，进门要求仍需现场确认。</p>}{reports.map(report => <div className="visit-record" key={report.authorId}><strong>{difficultyMeta[report.level].label}</strong><span className="post-meta">{report.author} · {dateText(report.visitedAt)} · {report.service}</span><p>{report.note || '未补充说明'}</p><small>QR：{report.requirements.need_qr} · 证件：{report.requirements.need_ic} · 骑车：{report.requirements.bike_allowed}</small></div>)}</section>
    </div><aside className="detail-sidebar">
      <section className="detail-panel"><ShieldCheck className="sidebar-icon" size={25} /><h2>我刚去过</h2><p className="muted">留下实际通关体验，帮下一位少绕路。</p><button className="outline-action" onClick={() => setFeedbackOpen(!feedbackOpen)} aria-expanded={feedbackOpen}>{currentReport ? '更新我的通关反馈' : '填写通关反馈'}</button>
        {feedbackOpen && <form className="community-form feedback-form" onSubmit={submitFeedback} key={user?.id || 'guest'}><label>通关感受<select name="level" defaultValue={currentReport?.level || 3}>{[1, 2, 3, 4, 5].map(level => <option key={level} value={level}>{difficultyMeta[level].label}</option>)}</select></label><label>到访日期<input name="visitedAt" type="date" required max={today()} defaultValue={currentReport ? localDate(currentReport.visitedAt) : today()} /></label><label>到访时间<input name="time" type="time" required defaultValue={new Date(currentReport?.visitedAt || Date.now()).toTimeString().slice(0, 5)} /></label><label>服务类型<select name="service" defaultValue={currentReport?.service || '外卖配送'}><option>外卖配送</option><option>包裹送货</option><option>接送乘客</option><option>其他</option></select></label>{[['need_qr', '需要顾客 QR'], ['need_ic', '需要证件登记'], ['bike_allowed', '允许骑车进入']].map(([key, label]) => <label key={key}>{label}<select name={key} defaultValue={currentReport?.requirements[key] || '待确认'}><option>待确认</option><option>是</option><option>否</option></select></label>)}<label>现场说明<textarea name="note" rows={3} maxLength={1000} defaultValue={currentReport?.note} placeholder="补充入口、时段和实际流程" /></label><button className="primary-action" type="submit" disabled={!user}>保存反馈</button></form>}
      </section>
      <section className="detail-panel"><h2>发起讨论</h2><form className="community-form" onSubmit={submitPost}><label>帖子类型<select name="type">{types.map(type => <option key={type}>{type}</option>)}</select></label><label>标题<input name="title" ref={titleRef} required maxLength={100} placeholder="例如：夜间进门要准备什么？" /></label><label>内容<textarea name="body" required rows={5} maxLength={3000} placeholder="分享到访时间、进门流程和注意事项…" /></label><label>到访日期（选填）<input type="date" name="visitDate" max={today()} /></label><label>服务类型<select name="service"><option>外卖配送</option><option>包裹送货</option><option>接送乘客</option><option>其他</option></select></label><p className="form-hint"><Info size={14} />请勿公开证件及住户隐私。</p>{!user && <button type="button" className="outline-action" onClick={onLogin}>登录后发言</button>}<button className="primary-action" type="submit" disabled={!user}><Plus size={16} />发布帖子</button></form></section>
      <section className="detail-panel data-note"><Info size={21} /><h3>公开资料 ≠ 司机实测</h3><p>未知信息单独标记，未有足够实测时不推算友好度。单条帖子不会改变等级，现场规则以保安安排为准。</p></section>
    </aside></div>
  </section>
}
