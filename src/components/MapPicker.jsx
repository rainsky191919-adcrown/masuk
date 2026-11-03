import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, MapPin, Search, Check, Info } from 'lucide-react'
import { validPoint } from '../lib/placeStorage'

// Public preview provider. User-triggered requests only; replace the endpoint for a larger deployment.
const PHOTON = import.meta.env.VITE_GEOCODER_URL || 'https://photon.komoot.io'
const cache = new Map()
function addressFor(feature) {
  const p = feature.properties || {}
  return [...new Set([p.name, [p.housenumber, p.street].filter(Boolean).join(' '), p.district, p.city || p.county, p.state, p.postcode, p.country].filter(Boolean))].join(', ')
}
async function lookup(path, params, signal) {
  const url = `${PHOTON}${path}?${new URLSearchParams(params)}`
  if (cache.has(url)) return cache.get(url)
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('地图搜索暂时不可用，请稍后重试或直接在地图上选点。')
  const json = await response.json()
  cache.set(url, json.features || [])
  return json.features || []
}

export default function MapPicker({ point, address, searchName, onConfirm }) {
  const container = useRef(null), map = useRef(null), marker = useRef(null), request = useRef(null)
  const mounted = useRef(true), version = useRef(0)
  const [draft, setDraft] = useState(point)
  const [latInput, setLatInput] = useState(point?.lat?.toString() || '')
  const [lngInput, setLngInput] = useState(point?.lng?.toString() || '')
  const [query, setQuery] = useState(searchName || '')
  const [results, setResults] = useState([])
  const [draftAddress, setDraftAddress] = useState(address || '')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('点击地图或拖动标记到车辆入口，再确认位置。')
  const [tileError, setTileError] = useState(false)
  const [open, setOpen] = useState(false)
  const draftRef = useRef(draft)
  function selectPoint(lat, lng, label = '') {
    version.current += 1
    request.current?.abort()
    setBusy('')
    const next = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }
    draftRef.current = next
    setDraft(next)
    setLatInput(String(next.lat)); setLngInput(String(next.lng))
    setDraftAddress(label)
    marker.current?.setLatLng([next.lat, next.lng])
    setMessage('位置已调整，请核对地址；建议标记入口或保安亭。')
  }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort() } }, [])
  useEffect(() => {
    if (!open || !container.current) return
    const initial = draftRef.current || { lat: 1.522, lng: 103.635 }
    const instance = L.map(container.current, { scrollWheelZoom: false }).setView([initial.lat, initial.lng], point ? 17 : 14)
    map.current = instance
    L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' }).on('tileerror', () => setTileError(true)).addTo(instance)
    const icon = L.divIcon({ className: 'entry-pin', html: '<span></span>', iconSize: [28, 36], iconAnchor: [14, 36] })
    marker.current = L.marker([initial.lat, initial.lng], { draggable: true, icon, title: '拖动到公寓车辆入口', alt: '公寓入口标记' }).addTo(instance)
    if (!draftRef.current) marker.current.setOpacity(0)
    instance.on('click', event => { marker.current.setOpacity(1); selectPoint(event.latlng.lat, event.latlng.lng) })
    marker.current.on('dragend', () => { const pos = marker.current.getLatLng(); selectPoint(pos.lat, pos.lng) })
    const observer = new ResizeObserver(() => instance.invalidateSize())
    observer.observe(container.current)
    return () => { observer.disconnect(); instance.remove(); map.current = null; marker.current = null }
  }, [open])
  function moveTo(lat, lng, label) {
    selectPoint(lat, lng, label)
    marker.current?.setOpacity(1)
    map.current?.setView([lat, lng], 17)
  }
  function applyCoordinates() {
    if (!validPoint(latInput, lngInput)) return setMessage('请填写有效经纬度：纬度 -85 至 85，经度 -180 至 180。')
    if (Number(latInput) !== draft?.lat || Number(lngInput) !== draft?.lng) moveTo(Number(latInput), Number(lngInput), '')
  }
  async function search() {
    if (!query.trim() || busy) return
    request.current?.abort()
    const controller = new AbortController(); request.current = controller
    setBusy('search'); setResults([])
    const timer = setTimeout(() => controller.abort(), 12000)
    try {
      const features = await lookup('/api/', { q: query.trim(), limit: 5, lat: map.current.getCenter().lat, lon: map.current.getCenter().lng }, controller.signal)
      if (!mounted.current || controller.signal.aborted) return
      const matches = features.filter(item => validPoint(item.geometry?.coordinates?.[1], item.geometry?.coordinates?.[0]))
      setResults(matches); setMessage(matches.length ? '请选择搜索结果，再调整到实际入口。' : '没有搜到结果，请尝试街道或城市名称，或直接在地图上选点。')
    } catch { if (mounted.current) setMessage('搜索未完成。可以重试，或直接在地图上选择入口。') }
    finally { clearTimeout(timer); if (mounted.current) setBusy('') }
  }
  function locate() {
    if (!navigator.geolocation) return setMessage('浏览器不支持定位，请在地图上手动选择。')
    const ticket = ++version.current
    setBusy('locate'); setMessage('请允许浏览器定位；当前位置仍需你确认。')
    navigator.geolocation.getCurrentPosition(position => {
      if (!mounted.current || ticket !== version.current) return
      moveTo(position.coords.latitude, position.coords.longitude, '')
      setMessage(`已定位，误差约 ${Math.round(position.coords.accuracy)} 米。请把标记调整到入口。`)
      setBusy('')
    }, () => { if (mounted.current && ticket === version.current) { setBusy(''); setMessage('无法取得当前位置。请检查定位权限，或在地图上手动选择。') } }, { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 })
  }
  async function fillAddress() {
    if (!draft || busy) return
    const ticket = version.current
    request.current?.abort()
    const controller = new AbortController(); request.current = controller
    const timer = setTimeout(() => controller.abort(), 12000)
    setBusy('address')
    try {
      const features = await lookup('/reverse', { lat: draft.lat, lon: draft.lng, limit: 1 }, controller.signal)
      if (mounted.current && !controller.signal.aborted && ticket === version.current) { setDraftAddress(features[0] ? addressFor(features[0]) : ''); setMessage('已查找附近地址，请核对并手动修正。') }
    } catch { if (mounted.current && ticket === version.current) setMessage('未能取得地址，请手动填写；已选坐标仍然保留。') }
    finally { clearTimeout(timer); if (mounted.current) setBusy('') }
  }
  return <section className="map-picker">
    <div className="map-picker-heading"><div><strong><MapPin size={17} /> 公寓入口位置</strong><p>将标记放在车辆入口或保安亭，方便司机导航。</p></div><button className="outline-action" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '收起地图' : point ? '调整地图位置' : '在地图上选位置'}</button></div>
    {point && <p className="confirmed-point"><Check size={14} /> 已确认：{point.lat.toFixed(6)}, {point.lng.toFixed(6)}</p>}
    {open && <><div className="map-search-row"><input aria-label="搜索地图位置" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); search() } }} placeholder="输入公寓、街道或城市名称" /><button type="button" disabled={!!busy || !query.trim()} onClick={search}><Search size={16} />{busy === 'search' ? '搜索中…' : '搜索'}</button><button type="button" disabled={!!busy} onClick={locate}><Crosshair size={16} />{busy === 'locate' ? '定位中…' : '使用当前位置'}</button></div>
      {!!results.length && <ul className="map-results">{results.map((item, index) => <li key={index}><button type="button" onClick={() => { moveTo(item.geometry.coordinates[1], item.geometry.coordinates[0], addressFor(item)); setResults([]) }}>{addressFor(item)}</button></li>)}</ul>}
      <div className="entry-map" ref={container} aria-label="选择公寓入口地图" />
      <p className="map-status" role="status"><Info size={14} />{message}</p>
      {tileError && <p className="map-error">部分地图未能加载，请检查网络或稍后重试；已选位置和下方坐标仍可使用。</p>}
      <div className="map-coordinates"><label>入口纬度<input type="number" step="any" min="-85" max="85" value={latInput} onChange={event => setLatInput(event.target.value)} onBlur={applyCoordinates} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); applyCoordinates() } }} /></label><label>入口经度<input type="number" step="any" min="-180" max="180" value={lngInput} onChange={event => setLngInput(event.target.value)} onBlur={applyCoordinates} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); applyCoordinates() } }} /></label></div>
      <label className="map-address-label">选点地址（可修正）<input value={draftAddress} onChange={event => setDraftAddress(event.target.value)} placeholder="确认道路及门牌，可手动填写" /></label>
      <div className="map-confirm-row"><button type="button" disabled={!draft || !validPoint(latInput, lngInput) || !!busy} onClick={fillAddress}>{busy === 'address' ? '查找中…' : '查找附近地址'}</button><button className="primary-action" type="button" disabled={!draft || !validPoint(latInput, lngInput) || !!busy} onClick={() => { onConfirm(draft, draftAddress.trim()); setOpen(false) }}><Check size={16} /> 使用这个位置</button></div>
      <p className="form-hint">搜索与地址查询由 Photon 提供；仅在你点击按钮时发送查询或所选坐标。地图数据 © OpenStreetMap。</p>
    </>}
  </section>
}
