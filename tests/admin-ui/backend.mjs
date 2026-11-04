// UI fixtures only: no remote requests, authentication or data writes.
import { mockLocations } from '../../src/data.skudai.js'
import { auditFixture } from './audit-fixture.mjs'

export const sharedBackend = import.meta.env.MODE !== 'navigation-local-test'
export const canModerate = user => ['admin', 'super_admin'].includes(user?.role)
export const cloudError = error => error.message
export async function discussionCommand(action) {
  if (action === 'overview') return command('feed')
  if (action === 'posts') return {items:[],total:0,page:1,pages:1,counts:{'全部':0}}
  if (action === 'replies') return {items:[],total:0,page:1,pages:1}
  throw new Error('Unexpected discussion read')
}
let adminOverride
export const setAdminFixture = value => { adminOverride = value }
export async function command(action) {
  if (action === 'role') return { role: 'super_admin' }
  if (action === 'locations') return mockLocations
  if (action === 'feed') return { posts: [], replies: [], feedback: [] }
  if (action === 'admin' && adminOverride !== undefined) return typeof adminOverride === 'function' ? adminOverride() : adminOverride
  if (action === 'admin' && import.meta.env.MODE === 'admin-empty-test') return { posts: [], replies: [], feedback: [], reports: [], roles: [], audit: [] }
  if (action === 'admin') return { posts: [{ id: 'post-preview-0001', title: '待核对的门口提示（模拟内容）', body: '用于本机控件与文字可读性验证，不会保存到线上。', author: 'Preview Rider', hidden: false }], replies: [], feedback: [], reports: [{ id: 'report-style-preview', target_type: 'post', target: 'post-preview-0001', reporter: 'fixture-rider', reason: '信息需要核对（模拟举报）', created_at: '2026-11-03T08:00:00Z', status: 'open' }], roles: [
    { user_id: 'demo:isolated-preview', email: 'owner@example.test', role: 'super_admin' },
    { user_id: 'fixture-admin', email: 'moderator@example.test', role: 'admin' },
    { user_id: 'fixture-backup', email: 'backup@example.test', role: 'super_admin' },
  ], audit: auditFixture }
  throw new Error('Navigation fixture rejects all writes: ' + action)
}
