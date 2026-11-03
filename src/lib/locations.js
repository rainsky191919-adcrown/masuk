import { hasSupabaseConfig, supabase } from './supabase'
import { sharedBackend, command } from './sharedBackend'

function normalizeLocation(row) {
  const requirements = row.entry_requirements || {}

  return {
    ...row,
    address: row.address || `${row.area} · 地址待补充`,
    entry_requirements: {
      need_ic: false,
      need_qr: false,
      fee_required: false,
      bike_allowed: false,
      parking: '待确认',
      gate_rule: '门禁规则待司机补充。',
      ...requirements,
    },
    tips: row.tips || '暂无额外提示，欢迎下一位司机补充。',
    maps_url: row.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${row.name} ${row.area}`)}`,
    verified_count: row.verified_count || 0,
    last_modified_by: row.last_modified_by || 'Supabase 资料',
  }
}

export async function fetchLocations() {
  if (sharedBackend) {
    try { return { data: (await command('locations')).map(normalizeLocation), error: null } }
    catch (error) { return { data: null, error } }
  }
  if (!hasSupabaseConfig) {
    return { data: null, error: new Error('Supabase 环境变量尚未配置') }
  }

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('updated_at', { ascending: false })

  return { data: data?.map(normalizeLocation) || [], error }
}

export function subscribeToLocations(onChange) {
  if (!hasSupabaseConfig) return () => {}

  const channel = supabase
    .channel('locations-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'locations' },
      onChange,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
