import { Gauge } from 'lucide-react'
import { coverageArea } from '../data.skudai'
import { summarize } from '../lib/community'

export function getBoardStatus({ locations, feedback, isLoading, dataSource, hasCloudConfig, shared, now = Date.now() }) {
  if (isLoading || dataSource === 'connecting') return { headline: '资料加载中…', note: '正在获取地点与反馈', warning: false }
  if (dataSource === 'error') return locations.length
    ? { headline: `${locations.length} 个地点`, note: '更新失败 · 显示上次资料', warning: true }
    : { headline: '资料暂不可用', note: '加载失败，请稍后重试', warning: true }
  if (dataSource === 'mock' && hasCloudConfig) return { headline: `${locations.length} 个地点`, note: '云端未连接 · 显示本机资料', warning: true }
  const recentCount = locations.filter(location => summarize(location, feedback, now).count > 0).length
  const scope = dataSource === 'mock' ? '本机资料' : shared ? '共享资料' : '反馈仅本机'
  return {
    headline: `${locations.length} 个地点`,
    note: `${scope} · ${recentCount ? `近30天 ${recentCount} 个地点有反馈` : '近30天暂无反馈'}`,
    warning: false,
  }
}

export default function BoardStatus(props) {
  const status = getBoardStatus(props)
  return <div className={`hero-signal${status.warning ? ' hero-signal-warning' : ''}`} role="status" aria-label="目前情报板状态" aria-atomic="true">
    <div className="signal-ring" aria-hidden="true"><Gauge size={26} /></div>
    <div>
      <span className="signal-label">覆盖 {coverageArea}</span>
      <strong>{status.headline}</strong>
      <small>{status.note}</small>
    </div>
  </div>
}
