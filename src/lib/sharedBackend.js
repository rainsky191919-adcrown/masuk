import { hasSupabaseConfig, supabase } from './supabase'

export const sharedBackend = hasSupabaseConfig && import.meta.env.VITE_SHARED_BACKEND === 'true'
export const canModerate = user => ['admin', 'super_admin'].includes(user?.role)

export async function discussionCommand(action, payload = {}) {
  if (!sharedBackend) throw new Error('共享后台尚未启用')
  const { data, error } = await supabase.rpc('masuk_discussion', { action, payload })
  if (error) throw error
  return data
}

export async function command(action, payload = {}) {
  if (!sharedBackend) throw new Error('共享后台尚未启用')
  const { data, error } = await supabase.rpc('masuk_command', { action, payload })
  if (error) throw error
  return data
}

export function cloudError(error) {
  const message = error?.message || ''
  if (message.includes('VERSION_CONFLICT')) return '资料刚刚更新，草稿已保留，请载入最新版后重试'
  if (/LOGIN_REQUIRED/.test(message)) return '登录已失效，请重新登录后重试'
  if (/ADMIN_REQUIRED|OWNER_REQUIRED/.test(message)) return '当前账号没有执行此操作的权限'
  if (/LAST_SUPER_ADMIN/.test(message)) return '必须保留至少一位 super admin'
  if (/VERIFIED_ACCOUNT_NOT_FOUND/.test(message)) return '找不到已验证的账号，请先让该用户登录本站'
  if (/REPORT_ALREADY_HANDLED/.test(message)) return '此举报已被其他管理员处理，请刷新列表'
  if (/REASON_REQUIRED|INVALID_RESOLUTION|INVALID_ROLE/.test(message)) return '请填写有效的处理原因及选项'
  return '云端操作未完成，请检查连接后重试；内容尚未保存'
}
