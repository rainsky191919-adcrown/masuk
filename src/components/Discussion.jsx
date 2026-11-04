import { useEffect, useRef, useState } from 'react'
import { canModerate, discussionCommand } from '../lib/sharedBackend'
import { discussionTypes, localPostPage, localReplyPage } from '../lib/discussions'

const timeText = value => new Date(value).toLocaleString('zh-CN', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
const today = () => new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10)
function focusBlock(element) {
  if (!element) return
  element.scrollIntoView({block:'start',behavior:'auto'})
  element.focus({preventScroll:true})
}
export function DiscussionPager({ label, data, busy, onPage }) {
  if (data.total <= 10) return null
  return <nav className="discussion-pagination" aria-label={label}>
    <button disabled={busy || data.page === 1} onClick={() => onPage(data.page-1)}>上一页</button>
    <span>第 {data.page} / {data.pages} 页</span>
    <button disabled={busy || data.page === data.pages} onClick={() => onPage(data.page+1)}>下一页</button>
  </nav>
}
function LongText({ text, preview = false }) {
  const [open, setOpen] = useState(false)
  const long = text.length > (preview ? 100 : 180) || text.split('\n').length > 3
  return <div className="discussion-copy"><p className={long && !open ? `post-body clamped-copy ${preview ? 'post-preview' : ''}` : 'post-body'}>{text}</p>
    {long && <button className="text-action" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '收起正文' : '展开全文'}</button>}</div>
}

export default function Discussion({ locationId, community, shared, onAction, saveCommunity, user, onLogin, showToast, entry, memory }) {
  const memoryKey = `${user?.id || 'guest'}:${locationId}`
  const saved = memory?.current[memoryKey] || {}
  const [query, setQuery] = useState(saved.query || {type:'全部',sort:'latest',page:1})
  const [result, setResult] = useState(saved.result || null)
  const [threads, setThreads] = useState(saved.threads || {})
  const [postOpen, setPostOpen] = useState(saved.postOpen || false)
  const [postDraft, setPostDraft] = useState(saved.postDraft || {type:'提问',title:'',body:'',visitDate:'',service:'外卖配送'})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(false)
  const [highlight, setHighlight] = useState('')
  const pendingHighlight = useRef('')
  const heading = useRef(null), postForm = useRef(null), replyRefs = useRef({}), request = useRef(0), lock = useRef(false), focusNext = useRef(false)
  const communityRef = useRef(community); communityRef.current = community
  const threadRef = useRef(threads); threadRef.current = threads
  const fingerprint = shared ? community.discussionVersion : JSON.stringify(community.posts)
  const fingerprintRef = useRef(fingerprint)
  const identity = useRef(user?.id)
  const threadRequests = useRef({})
  const threadSequence = useRef(0)
  useEffect(() => {
    if (fingerprintRef.current !== fingerprint) { fingerprintRef.current = fingerprint; setNotice(true) }
  }, [fingerprint])
  useEffect(() => {
    if (identity.current !== user?.id) { identity.current = user?.id; threadRequests.current={}; setThreads({}); setResult(null); setRevision(n=>n+1) }
  }, [user?.id])
  useEffect(() => { if (memory) memory.current[memoryKey] = {...memory.current[memoryKey],query,result,threads,postDraft,postOpen} }, [memory,memoryKey,query,result,threads,postDraft,postOpen])
  useEffect(() => {
    const remember = () => { if (memory?.current[memoryKey]) memory.current[memoryKey].scroll=window.scrollY }
    window.addEventListener('scroll',remember)
    return () => { window.removeEventListener('scroll',remember); threadRequests.current={} }
  }, [memory,memoryKey])
  useEffect(() => {
    const id = ++request.current
    setLoading(true); setError('')
    Promise.resolve().then(() => shared ? discussionCommand('posts',{locationId,type:query.type,sort:query.sort,page:query.page,focusId:query.focusId}) : localPostPage(communityRef.current,locationId,query.type,query.sort,query.page,query.focusId))
      .then(data => { if (id !== request.current) return; setResult({...data,type:query.type,sort:query.sort}); setNotice(false); if (focusNext.current) { focusNext.current=false; requestAnimationFrame(()=>focusBlock(heading.current)) } })
      .catch(() => { if (id === request.current) setError('讨论加载失败，已保留当前内容，请重试。') })
      .finally(() => { if (id === request.current) setLoading(false) })
    return () => { request.current++ }
  }, [locationId,query,revision,shared])
  useEffect(() => {
    if (entry === 'discussion') requestAnimationFrame(()=> saved.scroll != null ? window.scrollTo(0,saved.scroll) : focusBlock(heading.current))
  }, [entry])
  useEffect(() => {
    if (!highlight || pendingHighlight.current !== highlight) return
    requestAnimationFrame(() => {
      const target=[...(heading.current?.closest('section')?.querySelectorAll('[data-content-id]') || [])].find(e=>e.dataset.contentId===highlight)
      if (target) { pendingHighlight.current=''; focusBlock(target) }
    })
  }, [highlight,result])
  function changeQuery(next) { focusNext.current=true; setQuery({...query,focusId:null,...next}) }
  function patchThread(id, patch) { setThreads(old=>({...old,[id]:{...old[id],...patch}})) }
  async function loadReplies(post, page = 1, open = true, focus = {}) {
    const sort = focus.sort || threadRef.current[post.id]?.sort || 'oldest'
    const token = ++threadSequence.current
    threadRequests.current[post.id]=token
    patchThread(post.id,{loading:true,error:'',expanded:open})
    try {
      const data = shared ? await discussionCommand('replies',{postId:post.id,page,...focus,sort}) : localReplyPage(communityRef.current.posts.find(p=>p.id===post.id),page,focus.focusReplyId,sort)
      if (threadRequests.current[post.id] !== token) return
      patchThread(post.id,{data,sort,loading:false})
      requestAnimationFrame(()=>focusBlock(replyRefs.current[post.id]))
      return data
    } catch { if (threadRequests.current[post.id] === token) patchThread(post.id,{loading:false,error:'回复加载失败，已保留当前页，请重试。',retryPage:page,retrySort:sort}) }
  }
  function requireUser() { if (user) return true; showToast('请先登录后发言'); return false }
  async function mutate(action, payload, localChange, refresh = true) {
    if (!requireUser() || lock.current) return false
    lock.current=true; setBusy(true)
    try {
      const next = shared ? null : localChange(communityRef.current)
      const ok = shared ? await onAction(action,payload) : saveCommunity(next)
      if (!ok) return false
      if (!shared) { communityRef.current=next; fingerprintRef.current=JSON.stringify(next.posts) }
      if (refresh) { setQuery(old=>({...old,page:result?.page || old.page,focusId:null})); setRevision(n=>n+1) }
      setNotice(false)
      return ok
    } catch { showToast('操作未完成，草稿和当前内容已保留，请重试'); return false }
    finally { lock.current=false; setBusy(false) }
  }
  async function submitPost(event) {
    event.preventDefault()
    if (!postDraft.title.trim() || !postDraft.body.trim()) return showToast('标题和内容不能只填写空格')
    const now = new Date().toISOString(), id = crypto.randomUUID()
    const payload = {locationId,...postDraft,title:postDraft.title.trim(),body:postDraft.body.trim()}
    const ok = await mutate('post',payload,c=>({...c,posts:[{...payload,id,authorId:user.id,author:user.name,createdAt:now,activityAt:now,replies:[],helpful:[],reports:[],pinned:false},...c.posts]}))
    if (!ok) return
    pendingHighlight.current=shared ? ok.id : id
    setHighlight(pendingHighlight.current); setPostOpen(false)
    setPostDraft({type:'提问',title:'',body:'',visitDate:'',service:'外卖配送'})
    changeQuery({type:'全部',sort:'latest',page:1,focusId:shared ? ok.id : id})
    showToast(shared ? '帖子已保存至云端' : '帖子已保存至此浏览器')
  }
  async function submitReply(event, post) {
    event.preventDefault()
    const body = (threadRef.current[post.id]?.draft || '').trim()
    if (!body) return showToast('回复不能只填写空格')
    const id=crypto.randomUUID(), now=new Date().toISOString()
    const ok=await mutate('reply',{id:post.id,body},c=>({...c,posts:c.posts.map(p=>p.id===post.id?{...p,activityAt:now,replies:[...p.replies,{id,authorId:user.id,author:user.name,body,createdAt:now}]}:p)}),false)
    if (!ok) return
    patchThread(post.id,{draft:'',replyOpen:false})
    setResult(old=>({...old,items:old.items.map(p=>p.id===post.id?{...p,replyCount:p.replyCount+1,activityAt:now}:p)}))
    // The current post remains visible even if its activity changes its server rank.
    const latest=await loadReplies(post,2147483647,true,{focusOwnBody:body,focusReplyId:shared ? undefined : id})
    const ownReply=latest?.items.filter(r=>r.authorId===user.id && r.body===body).at(-1)
    pendingHighlight.current=ownReply?.id || id
    setHighlight(pendingHighlight.current)
    showToast('回复已保存，已定位最新回复')
  }
  async function removePost(post) {
    if (!window.confirm('删除这篇帖子及其回复？')) return
    await mutate('delete_post',{id:post.id},c=>({...c,posts:c.posts.filter(p=>p.id!==post.id)}))
  }
  async function removeReply(post, reply) {
    if (!window.confirm('删除这条回复？')) return
    if (await mutate('delete_reply',{id:reply.id},c=>({...c,posts:c.posts.map(p=>p.id===post.id?{...p,replies:p.replies.filter(r=>r.id!==reply.id)}:p)}))) await loadReplies(post,threads[post.id]?.data?.page || 1)
  }
  async function report(id, targetType='post') {
    if (!requireUser()) return
    if (!shared) { showToast('举报需要共享后台'); return }
    const reason=window.prompt('请说明举报原因，请勿填写证件或住户隐私')
    if (reason?.trim() && await mutate('report',{id,targetType,reason:reason.trim()},c=>c)) showToast('举报已提交至管理员')
  }
  const data = result || {items:[],counts:{},total:0,page:1,pages:1}
  const counts = data.counts || {}
  const pager = <DiscussionPager label="帖子分页" data={data} busy={loading || busy} onPage={page=>changeQuery({page})} />
  return <section className="detail-panel discussion-section" aria-busy={loading}>
    <div className="section-heading"><h2 ref={heading} tabIndex={-1}>司机讨论 <span className="count-chip">{counts['全部'] ?? 0}</span></h2><button className="primary-action" onClick={()=>{setPostOpen(true);requestAnimationFrame(()=>{postForm.current?.scrollIntoView({block:'start'});postForm.current?.querySelector('input')?.focus({preventScroll:true})})}}>发帖子</button></div>
    <div className="discussion-toolbar"><div className="discussion-tabs" aria-label="讨论类型">{discussionTypes.map(type=><button key={type} aria-pressed={query.type===type} onClick={()=>changeQuery({type,page:1})}>{type} {counts[type] ?? 0}</button>)}</div>
      <select aria-label="讨论排序" value={query.sort} onChange={e=>changeQuery({sort:e.target.value,page:1})}><option value="latest">最新活动</option><option value="helpful">最多帮助</option></select></div>
    {notice && <button className="outline-action" onClick={()=>{setThreads({});changeQuery({page:1});setRevision(n=>n+1)}}>有新内容，更新讨论</button>}
    {loading && <p role="status">正在加载讨论…{result && '仍显示上次载入内容。'}</p>}
    {error && <p role="alert">{error}<button className="text-action" onClick={()=>setRevision(n=>n+1)}>重试加载讨论</button></p>}
    {result && <p role="status" aria-live="polite" className="discussion-range">{data.type} · {data.total ? `第 ${(data.page-1)*10+1}–${Math.min(data.page*10,data.total)} 帖／共 ${data.total} 帖` : '0 帖'} · 每页最多10帖</p>}
    {pager}
    {!loading && !error && !data.total && <div className="discussion-empty"><h3>{counts['全部'] ? '这个分类还没有帖子' : '这里的第一条经验，等你来分享'}</h3><p>问问入口怎么走，或留下今天的真实通关经历。</p>{query.type!=='全部'&&<button className="outline-action" onClick={()=>changeQuery({type:'全部',page:1})}>查看全部讨论</button>}</div>}
    {data.items.map(post=>{
      const thread=threads[post.id] || {}, replies=thread.data || {items:[],total:post.replyCount,page:1,pages:1}
      return <article tabIndex={-1} data-content-id={post.id} className={`discussion-post${highlight===post.id?' discussion-highlight':''}`} key={post.id}>
        <div className="post-type"><span>{post.type}</span>{post.pinned&&<span>已置顶</span>}</div><h3>{post.title}</h3><LongText text={post.body} preview />
        <div className="post-meta">{post.author} · {post.service}{post.visitDate&&` · 到访 ${post.visitDate}`}<br />最后活动：{timeText(post.activityAt)}</div>
        <div className="post-actions">
          <button aria-expanded={!!thread.expanded} onClick={()=>thread.expanded?patchThread(post.id,{expanded:false}):loadReplies(post,thread.data?.page||1)}>{post.replyCount} 条回复</button>
          <button aria-expanded={!!thread.replyOpen} onClick={()=>requireUser()&&patchThread(post.id,{replyOpen:!thread.replyOpen})}>{thread.replyOpen?'取消回复':'我要回复'}</button>
          <button disabled={busy} aria-pressed={post.helpful.includes(user?.id)} onClick={()=>mutate('helpful',{id:post.id,enabled:!post.helpful.includes(user?.id)},c=>({...c,posts:c.posts.map(p=>p.id===post.id?{...p,helpful:p.helpful.includes(user.id)?p.helpful.filter(id=>id!==user.id):[...p.helpful,user.id]}:p)}))}>{post.helpfulCount} 人有帮助</button>
          <details className="discussion-more"><summary>更多操作</summary><button disabled={busy || post.reports.includes(user?.id)} onClick={()=>report(post.id)}>举报</button>{post.authorId===user?.id&&<button disabled={busy} onClick={()=>removePost(post)}>删除帖子</button>}{canModerate(user)&&<button disabled={busy} onClick={()=>mutate('pin',{id:post.id,enabled:!post.pinned},c=>({...c,posts:c.posts.map(p=>p.id===post.id?{...p,pinned:!p.pinned}:p)}))}>{post.pinned?'取消置顶':'置顶'}</button>}</details>
        </div>
        {thread.replyOpen && <form className="reply-form" onSubmit={e=>submitReply(e,post)}><label>回复《{post.title}》<textarea aria-label={`回复《${post.title}》`} required maxLength={1500} rows={3} autoFocus value={thread.draft||''} onChange={e=>patchThread(post.id,{draft:e.target.value})} /></label><p className="form-hint">请勿公开证件及住户隐私。</p><button className="primary-action" disabled={busy} type="submit">发布回复</button></form>}
        {thread.expanded && <section className="post-replies" aria-label={`《${post.title}》的回复`} aria-busy={!!thread.loading}>
          <h4 tabIndex={-1} ref={e=>replyRefs.current[post.id]=e}>《{post.title}》的回复</h4>
          <label className="reply-sort">回复顺序<select aria-label={`《${post.title}》回复顺序`} disabled={thread.loading} value={thread.sort || 'oldest'} onChange={e=>loadReplies(post,1,true,{sort:e.target.value})}><option value="oldest">最早回复优先</option><option value="latest">最新回复优先</option></select></label>
          <p className="discussion-range" role="status">{thread.sort === 'latest' ? '按时间从新到旧' : '按时间从早到晚'} · {replies.total?`第 ${(replies.page-1)*10+1}–${Math.min(replies.page*10,replies.total)} 条／共 ${replies.total} 条`:'暂无回复'}</p>
          <button className="text-action" disabled={thread.loading} onClick={()=>loadReplies(post,1,true,{sort:'latest'})}>看最新回复</button>
          {thread.loading&&<p role="status">正在加载回复…</p>}{thread.error&&<p role="alert">{thread.error}<button className="text-action" onClick={()=>loadReplies(post,thread.retryPage,true,{sort:thread.retrySort})}>重试回复</button></p>}
          <DiscussionPager label={`《${post.title}》回复分页`} data={replies} busy={thread.loading||busy} onPage={page=>loadReplies(post,page)} />
          {replies.items.map(reply=><div tabIndex={-1} data-content-id={reply.id} className={`post-reply${highlight===reply.id?' discussion-highlight':''}`} key={reply.id}><div className="post-meta">{reply.author} · {timeText(reply.createdAt)}</div><LongText text={reply.body} />
            {(shared||reply.authorId===user?.id)&&<details className="discussion-more"><summary>回复更多操作</summary>{reply.authorId===user?.id&&<button disabled={busy} onClick={()=>removeReply(post,reply)}>删除回复</button>}{shared&&<button disabled={busy} onClick={()=>report(reply.id,'reply')}>举报回复</button>}</details>}</div>)}
          <DiscussionPager label={`《${post.title}》回复分页`} data={replies} busy={thread.loading||busy} onPage={page=>loadReplies(post,page)} />
        </section>}
      </article>
    })}
    {pager}
    <div className="discussion-composer" ref={postForm}><h3>发起讨论</h3><button className="outline-action" aria-expanded={postOpen} onClick={()=>setPostOpen(!postOpen)}>{postOpen?'收起发帖表单':'写一篇讨论'}</button>
      {postOpen&&<form className="community-form" onSubmit={submitPost}><label>帖子类型<select value={postDraft.type} onChange={e=>setPostDraft({...postDraft,type:e.target.value})}>{discussionTypes.slice(1).map(t=><option key={t}>{t}</option>)}</select></label><label>标题<input required maxLength={100} value={postDraft.title} onChange={e=>setPostDraft({...postDraft,title:e.target.value})} /></label><label>内容<textarea required rows={5} maxLength={3000} value={postDraft.body} onChange={e=>setPostDraft({...postDraft,body:e.target.value})} /></label><label>到访日期（选填）<input type="date" max={today()} value={postDraft.visitDate} onChange={e=>setPostDraft({...postDraft,visitDate:e.target.value})} /></label><label>服务类型<select value={postDraft.service} onChange={e=>setPostDraft({...postDraft,service:e.target.value})}>{['外卖配送','包裹送货','接送乘客','其他'].map(t=><option key={t}>{t}</option>)}</select></label><p className="form-hint">请勿公开证件及住户隐私。</p>{!user&&<button type="button" className="outline-action" onClick={onLogin}>登录后发言</button>}<button className="primary-action" type="submit" disabled={!user||busy}>发布帖子</button></form>}
    </div>
  </section>
}
