import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const needsReview = location => Boolean(location.review_needed)
const pageSize = 10

export default function AdminLocationList({ locations, isReviewNeeded = needsReview, renderRow }) {
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const listRef = useRef(null)
  const pageNavigation = useRef(false)
  const areas = [...new Set(locations.map(location => location.area).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
  if (area && !areas.includes(area)) areas.push(area)
  const keyword = query.trim().toLocaleLowerCase()
  const matching = locations.filter(location =>
    (!keyword || [location.name, location.area, location.address].filter(Boolean).join(' ').toLocaleLowerCase().includes(keyword)) &&
    (!area || location.area === area) &&
    (status === 'all' || isReviewNeeded(location) === (status === 'review'))
  )
  const totalPages = Math.max(1, Math.ceil(matching.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const visible = matching.slice(start, start + pageSize)
  const hasFilters = Boolean(query || area || status !== 'all')

  useEffect(() => { setPage(current => Math.min(current, totalPages)) }, [totalPages])
  useLayoutEffect(() => {
    if (!pageNavigation.current) return
    pageNavigation.current = false
    listRef.current?.focus({ preventScroll: true })
    listRef.current?.scrollIntoView?.({ block: 'start' })
  }, [currentPage])

  function clearFilters() {
    setQuery(''); setArea(''); setStatus('all'); setPage(1)
  }
  function changePage(next) {
    pageNavigation.current = true
    setPage(next)
  }

  return <section className="admin-location-list" aria-label="地点管理列表" ref={listRef} tabIndex={-1}>
    <div className="admin-location-toolbar">
      <label>搜索地点<input type="search" aria-label="搜索后台地点" placeholder="名称、区域或地址" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} /></label>
      <label>地点区域<select value={area} onChange={event => { setArea(event.target.value); setPage(1) }}><option value="">全部区域</option>{areas.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>复核状态<select value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="all">全部状态</option><option value="review">需复核</option><option value="normal">正常</option></select></label>
      <button type="button" className="outline-action" disabled={!hasFilters} onClick={clearFilters}>清空地点筛选</button>
    </div>
    <p className="admin-location-summary" role="status">匹配 {matching.length} / 共 {locations.length} 个地点{matching.length > 0 && ` · 显示第 ${start + 1}–${start + visible.length} 条`}</p>
    {visible.length > 0 ? <div className="admin-table">{visible.map(renderRow)}</div> : <div className="admin-location-empty"><strong>{locations.length ? '没有匹配的地点' : '暂无地点资料'}</strong><p>{locations.length ? '请调整关键词、区域或复核状态，也可以清空筛选重试。' : '目前没有可管理的地点。'}</p></div>}
    <nav className="pagination admin-location-pagination" aria-label="后台地点分页">
      <button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>上一页</button>
      <span>第 {currentPage} / {totalPages} 页 · 每页 {pageSize} 条</span>
      <button type="button" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>下一页</button>
    </nav>
  </section>
}
