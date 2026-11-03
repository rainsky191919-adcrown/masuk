import { Flag, Pencil, Trash2 } from 'lucide-react'

export default function AdminLocationActions({ location, reviewNeeded, disabled = false, onEdit, onToggleReview, onDelete }) {
  const reviewLabel = reviewNeeded ? '取消复核' : '标记复核'
  return <div className="admin-row-actions admin-location-actions" role="group" aria-label={`地点操作：${location.name}`}>
    <button type="button" className="admin-location-edit" disabled={disabled} aria-label={`修改资料：${location.name}`} title={`修改资料：${location.name}`} onClick={() => onEdit(location)}><Pencil size={15} aria-hidden="true" />修改资料</button>
    <button type="button" className={`admin-location-review${reviewNeeded ? ' review-needed' : ''}`} disabled={disabled} aria-label={`${reviewLabel}：${location.name}`} title={`${reviewLabel}：${location.name}`} aria-pressed={reviewNeeded} onClick={() => onToggleReview(location)}><Flag size={15} aria-hidden="true" />{reviewLabel}</button>
    {onDelete && <button type="button" className="admin-location-delete" disabled={disabled} aria-label={`删除地点：${location.name}`} title={`删除地点：${location.name}`} onClick={() => onDelete(location)}><Trash2 size={15} aria-hidden="true" />删除</button>}
  </div>
}
