import { PLACES_KEY, readLocalPlaces } from './placeStorage'

const fields = [
  ['name', '公寓名称'], ['area', '区域'], ['address', '地址'],
  ['latitude', '入口纬度'], ['longitude', '入口经度'], ['entrance_note', '入口说明'],
  ['need_qr', '顾客 QR'], ['need_ic', '证件登记'], ['fee_required', '缴费'], ['bike_allowed', '骑车进入'],
  ['parking', '临时停车'], ['gate_rule', '门禁规则'], ['tips', '司机贴士'], ['difficulty_level', '填写者的通关感受'],
]
export function snapshot(row) {
  return Object.fromEntries(fields.map(([key]) => [key, row.entry_requirements?.[key] ?? row[key] ?? '']))
}
export function revisionOf(row) { return row.revision_id || JSON.stringify(snapshot(row)) }
export function displayValue(value) { return value === true ? '是' : value === false ? '否' : value === '' || value == null ? '未填写' : String(value) }
export function differences(before, after) {
  const a = snapshot(before), b = snapshot(after)
  return fields.filter(([key]) => a[key] !== b[key]).map(([key, label]) => ({ key, label, before: displayValue(a[key]), after: displayValue(b[key]) }))
}
export function nextRevision(latest, draft, user, reason) {
  const number = (latest?.revision_number || 1) + (latest ? 1 : 0)
  const history = latest ? [...(latest.revisions || []), {
    id: revisionOf(latest), number: latest.revision_number || 1, data: snapshot(latest),
    author: latest.last_modified_by || '公开资料导入', createdAt: latest.updated_at,
    reason: latest.revision_reason || '原有资料', approvals: latest.accuracy_votes || [],
  }] : []
  return { ...draft, revision_id: crypto.randomUUID(), revision_number: number, revision_reason: reason,
    last_modified_by: user.name, updated_at: new Date().toISOString(), revisions: history, accuracy_votes: [] }
}
export function toggleApproval(row, user, visitDate) {
  const votes = row.accuracy_votes || []
  return { ...row, accuracy_votes: votes.some(vote => vote.userId === user.id) ? votes.filter(vote => vote.userId !== user.id) : [...votes, { userId: user.id, name: user.name, visitDate, createdAt: new Date().toISOString() }] }
}
export function savePlace(row) {
  localStorage.setItem(PLACES_KEY, JSON.stringify([row, ...readLocalPlaces().filter(item => item.id !== row.id)]))
}
// Serialize read/compare/write across same-origin tabs on browsers supporting Web Locks.
export function withPlaceLock(action) {
  if (navigator.locks) return navigator.locks.request('masuk-place-write', action)
  return Promise.resolve().then(action)
}
