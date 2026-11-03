import { mockLocations } from '../../src/data.skudai.js'
// Display fixtures only. They are never submitted or inserted anywhere.
export const auditFixture = [
  { id: 'audit-preview-01', actor: 'fixture-admin', action: 'save_location', target: mockLocations[0].id, reason: '已核对访客入口，补充登记说明（模拟记录）', created_at: '2026-11-03T07:30:00Z' },
  { id: 'audit-preview-02', actor: 'demo:isolated-preview', action: 'set_role', target: 'fixture-admin', reason: '值班职责调整（模拟记录） -> admin', created_at: '2026-11-03T07:25:00Z' },
  { id: 'audit-preview-03', actor: 'fixture-admin', action: 'review_location', target: mockLocations[1].id, reason: 'review=true', created_at: '2026-11-03T07:20:00Z' },
  { id: 'audit-preview-04', actor: 'fixture-backup', action: 'moderate', target: 'post-preview-0001', reason: '重复内容（模拟记录） hidden=true', created_at: '2026-11-03T06:50:00Z' },
  { id: 'audit-preview-05', actor: 'fixture-admin', action: 'pin', target: 'post-preview-0001', reason: 'pinned=true', created_at: '2026-11-03T05:45:00Z' },
  { id: 'audit-preview-06', actor: 'fixture-admin', action: 'resolve_report', target: 'report-preview-0001', reason: '已核对内容（模拟记录） status=resolved hide=false', created_at: '2026-11-03T05:15:00Z' },
  { id: 'audit-preview-07', actor: null, action: 'bootstrap_super_admin', target: 'demo:isolated-preview', reason: '初始化管理账号（模拟记录）', created_at: '2026-11-03T00:00:00Z' },
  { id: 'audit-preview-08', actor: null, action: 'save_location', target: mockLocations[2].id, reason: '历史记录未提供操作者（模拟记录）', created_at: '2026-11-02T16:15:00Z' },
  { id: 'audit-preview-09', actor: 'unknown-actor-12345678901234567890', action: 'future_action', target: 'unknown-target-12345678901234567890', reason: '保留原动作与标识（模拟记录）', created_at: '2026-11-02T12:00:00Z' },
  ...[10, 11, 12].map(number => ({ id: `audit-preview-${number}`, actor: 'fixture-admin', action: 'save_location', target: mockLocations[number - 1].id, reason: `补充地点资料（模拟记录 ${number}）`, created_at: `2026-11-01T0${number - 9}:00:00Z` })),
]
