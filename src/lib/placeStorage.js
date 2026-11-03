export const PLACES_KEY = 'masuk-local-places-v1'
export function readLocalPlaces() {
  try {
    const value = JSON.parse(localStorage.getItem(PLACES_KEY))
    return Array.isArray(value) ? value.filter(row => row?.id && row?.name && row?.entry_requirements) : []
  } catch { return [] }
}
export function mergeLocalPlaces(base) {
  const local = readLocalPlaces()
  const ids = new Set(local.map(row => row.id))
  return [...local, ...base.filter(row => !ids.has(row.id))]
}
export function validPoint(lat, lng) {
  return lat !== '' && lng !== '' && lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(Number(lat)) <= 85 && Math.abs(Number(lng)) <= 180
}
export function navigationUrl(lat, lng, name, area) {
  const query = validPoint(lat, lng) ? `${lat},${lng}` : `${name} ${area}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
export function nearDuplicates(locations, name, point, excludeId) {
  const normalize = value => value.toLowerCase().replace(/[\s’'.,，。-]/g, '')
  const query = normalize(name)
  return locations.filter(row => row.id !== excludeId && ((query.length >= 3 && (normalize(row.name).includes(query) || query.includes(normalize(row.name)))) || (point && validPoint(row.latitude, row.longitude) && Math.hypot((row.latitude - point.lat) * 111000, (row.longitude - point.lng) * 111000 * Math.cos(point.lat * Math.PI / 180)) < 150))).slice(0, 4)
}
