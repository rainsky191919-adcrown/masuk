export const COMMUNITY_KEY = 'masuk-community-v1'
export const emptyCommunity = { posts: [], feedback: [] }

export function readCommunity() {
  try {
    const data = JSON.parse(localStorage.getItem(COMMUNITY_KEY))
    if (Array.isArray(data?.posts) && Array.isArray(data?.feedback)) return data
  } catch { /* A missing or unreadable local draft starts empty. */ }
  return emptyCommunity
}

export function requirement(value, yes = '需要', no = '不用') {
  return value === true ? yes : value === false ? no : '待确认'
}

// One current report per rider and location; only recent visits inform the summary.
export function summarize(location, feedback, now = Date.now()) {
  const recent = feedback.filter(item => item.locationId === location.id && now - new Date(item.visitedAt).getTime() <= 30 * 86400000 && new Date(item.visitedAt).getTime() <= now)
  const level = recent.length >= 3 ? Math.round(recent.reduce((sum, item) => sum + item.level, 0) / recent.length) : 0
  const levels = recent.map(item => item.level)
  return { level, count: recent.length, disputed: levels.length >= 2 && Math.max(...levels) - Math.min(...levels) >= 3, latest: recent.map(item => item.visitedAt).sort().at(-1) }
}
