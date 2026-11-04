import { MessageSquarePlus, Search } from 'lucide-react'

export default function BrowseEmptyState({ query, hasFilters, onClearFilters, onClearSearch, onCreate, suggestions = [], onSuggestion }) {
  const name = query.trim()
  return <div className="empty-state">
    <Search size={28} aria-hidden="true" />
    <strong>{hasFilters ? '当前筛选下暂无地点' : name ? `没有找到“${name}”` : '暂时没有可显示的地点'}</strong>
    <p>{hasFilters
      ? '已有地点可能不符合当前条件，或尚未形成司机评分。先清除筛选，再查看结果。'
      : name
        ? '试试公寓全名、其他拼写或街道名称。确认尚未收录后，再补充这个地点。'
        : '可以先搜索地点名称，或稍后再来查看。'}</p>
    {!hasFilters && suggestions.length > 0 && <div className="search-suggestions"><p>你是否在找这些已收录地点？</p>{suggestions.map(location=><button key={location.id} onClick={()=>onSuggestion(location)}>{location.name}<small>{location.area}</small></button>)}</div>}
    <div className="empty-actions">
      {hasFilters
        ? <button onClick={onClearFilters}>清除筛选{name && '，保留搜索'}</button>
        : <button onClick={onClearSearch}>{name ? '清空搜索' : '搜索地点'}</button>}
      {!hasFilters && name && <button className="empty-action-secondary" onClick={onCreate}><MessageSquarePlus size={16} /> 补充这个地点</button>}
    </div>
  </div>
}
