export const DISCUSSION_PAGE_SIZE = 10
export const discussionTypes = ['全部', '提问', '经验分享', '规则变化']
export function pageSlice(items, requested = 1) {
  const pages = Math.max(1, Math.ceil(items.length / DISCUSSION_PAGE_SIZE))
  const page = Math.min(pages, Math.max(1, Number(requested) || 1))
  return { items: items.slice((page - 1) * 10, page * 10), total: items.length, page, pages }
}
export function localPostPage(community, locationId, type, sort, page, focusId) {
  const posts = community.posts.filter(p => p.locationId === locationId)
  const counts = Object.fromEntries(discussionTypes.map(t => [t, posts.filter(p => t === '全部' || p.type === t).length]))
  const rows = posts.filter(p => type === '全部' || p.type === type).sort((a, b) =>
    Number(b.pinned) - Number(a.pinned) ||
    (sort === 'helpful' ? b.helpful.length - a.helpful.length : 0) ||
    new Date(b.activityAt) - new Date(a.activityAt) || a.id.localeCompare(b.id))
  if (focusId && rows.some(p=>p.id===focusId)) page=Math.floor(rows.findIndex(p=>p.id===focusId)/10)+1
  return { ...pageSlice(rows.map(p => ({ ...p, replyCount: p.replies.length, helpfulCount: p.helpful.length })), page), counts }
}
export function localReplyPage(post, page, focusId) {
  const rows=[...(post?.replies || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.id.localeCompare(b.id))
  if (focusId && rows.some(r=>r.id===focusId)) page=Math.floor(rows.findIndex(r=>r.id===focusId)/10)+1
  return pageSlice(rows, page)
}
