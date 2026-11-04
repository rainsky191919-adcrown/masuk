// Keep the query literal for display; normalize only the matching key.
export function placeSearchKey(value = '') {
  return String(value).normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '').replace(/[\p{P}\p{S}\s]/gu, '')
}
export function matchesPlaceQuery(location, query) {
  const key = placeSearchKey(query)
  return !key || [location.name, location.area, location.address].some(value => placeSearchKey(value).includes(key))
}
function distance(a,b) {
  let row = Array.from({length:b.length+1},(_,i)=>i)
  for (let i=1;i<=a.length;i++) {
    const next=[i]
    for (let j=1;j<=b.length;j++) next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1))
    row=next
  }
  return row[b.length]
}
export function suggestPlaces(locations, query) {
  const key=placeSearchKey(query)
  if (key.length<4 || key.length>64) return []
  const limit=Math.min(2,Math.floor(key.length/5))
  return locations.map(location=>{
    const name=placeSearchKey(location.name)
    let score=Infinity
    for(let n=Math.max(1,key.length-limit);n<=Math.min(name.length,key.length+limit);n++) score=Math.min(score,distance(key,name.slice(0,n)))
    return {location,score}
  }).filter(item=>item.score<=limit).sort((a,b)=>a.score-b.score || a.location.name.localeCompare(b.location.name)).slice(0,3).map(item=>item.location)
}
