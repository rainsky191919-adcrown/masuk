import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Filter,
  Flag,
  Info,
  Lightbulb,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageSquarePlus,
  Pencil,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Clock3,
  X,
} from 'lucide-react'
import { areas, coverageArea, difficultyMeta, mockLocations } from './data.skudai'
import { fetchLocations, subscribeToLocations } from './lib/locations'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import MapPicker from './components/MapPicker'
import { ChangeList } from './components/AccuracyPanel'
import { revisionOf, differences, nextRevision, toggleApproval, savePlace, withPlaceLock } from './lib/revisions'
import { PLACES_KEY, readLocalPlaces, mergeLocalPlaces, validPoint, navigationUrl, nearDuplicates } from './lib/placeStorage'
import LocationDetail from './components/LocationDetail'
import { COMMUNITY_KEY, readCommunity, requirement, summarize } from './lib/community'
import { sharedBackend, command, discussionCommand, canModerate, cloudError } from './lib/sharedBackend'
import CloudAdmin from './components/CloudAdmin'
import AdminLocationList from './components/AdminLocationList'
import AdminSectionNav from './components/AdminSectionNav'
import AdminLocationActions from './components/AdminLocationActions'
import BrowseEmptyState from './components/BrowseEmptyState'
import CardEntrySummary, { CardSourceNotes } from './components/CardEntrySummary'
import { matchesPlaceQuery, suggestPlaces } from './lib/placeSearch'
import BoardStatus from './components/BoardStatus'

function formatUpdated(dateString) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

function copyTextFor(location, feedback) {
  const rules = location.entry_requirements
  return [
    `${location.name} · ${difficultyMeta[summarize(location, feedback).level].label}`,
    location.address,
    `规则：${rules.gate_rule}`,
    `押 IC：${requirement(rules.need_ic)}｜QR：${requirement(rules.need_qr)}｜骑车上楼：${requirement(rules.bike_allowed, '可以', '不行')}`,
    `临停：${rules.parking}`,
    ...(location.entrance_note ? [`入口：${location.entrance_note}`] : []),
    `提示：${location.tips}`,
  ].join('\n')
}

function App() {
  const [accountOpen, setAccountOpen] = useState(false)
  const [community, setCommunity] = useState(() => sharedBackend ? { posts: [], feedback: [] } : readCommunity())
  const [selectedLocationId, setSelectedLocationId] = useState(null)
  const [browseScroll, setBrowseScroll] = useState(0)
  const [detailEntry, setDetailEntry] = useState('rules')
  const discussionMemory = useRef({})
  function saveCommunity(next) {
    try { localStorage.setItem(COMMUNITY_KEY, JSON.stringify(next)); setCommunity(next); return true }
    catch { showToast('浏览器未能保存，请检查存储空间后重试'); return false }
  }
  const [activeView, setActiveView] = useState('browse')
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('全部区域')
  const [difficulty, setDifficulty] = useState('all')
  const [recentOnly, setRecentOnly] = useState(false)
  const [locations, setLocations] = useState(() => sharedBackend ? [] : mergeLocalPlaces(mockLocations))
  const selectedLocation = locations.find(item => item.id === selectedLocationId)
  const [dataSource, setDataSource] = useState(hasSupabaseConfig ? 'connecting' : 'mock')
  const [isLoadingLocations, setIsLoadingLocations] = useState(hasSupabaseConfig)
  const [editingLocation, setEditingLocation] = useState(null)
  const [editOrigin, setEditOrigin] = useState(null)
  const editScrollRestore = useRef(null)
  const [editConflict, setEditConflict] = useState(null)
  const [isSavingPlace, setIsSavingPlace] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    if (hasSupabaseConfig) return null
    try {
      const stored = JSON.parse(window.localStorage.getItem('masuk-user'))
      return stored ? { ...stored, id: stored.id || `demo:${stored.name.trim().toLowerCase()}` } : null
    } catch {
      return null
    }
  })
  const [authBusy, setAuthBusy] = useState(hasSupabaseConfig)
  const [reviewIds, setReviewIds] = useState([])
  const isAdminUser = canModerate(currentUser)
  const isAdminEdit = Boolean(editingLocation && editOrigin?.view === 'admin' && isAdminUser)
  const [currentPage, setCurrentPage] = useState(1)
  const [mobileBrowse, setMobileBrowse] = useState(() => window.matchMedia?.('(max-width: 600px)').matches || false)
  const pageSize = mobileBrowse ? 10 : 20
  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 600px)')
    if (!media) return
    let previous = media.matches
    const resize = () => {
      const next = media.matches
      if (next === previous) return
      const oldSize = previous ? 10 : 20, nextSize = next ? 10 : 20
      previous = next
      setMobileBrowse(next)
      setCurrentPage(page => Math.floor((page - 1) * oldSize / nextSize) + 1)
    }
    media.addEventListener('change', resize)
    return () => media.removeEventListener('change', resize)
  }, [])
  const [toast, setToast] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const navigationRef = useRef(null)
  const mainRef = useRef(null)

  function focusMain() {
    requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }))
  }

  function toggleMenu() {
    if (isMenuOpen) { setIsMenuOpen(false); return }
    setIsMenuOpen(true)
    requestAnimationFrame(() => navigationRef.current?.querySelector('button')?.focus())
  }

  useLayoutEffect(() => {
    const origin = editScrollRestore.current
    if (!origin || activeView !== origin.view) return
    editScrollRestore.current = null
    if (origin.trigger?.isConnected) origin.trigger.focus({ preventScroll: true })
    window.scrollTo(origin.x, origin.y)
  }, [activeView])

  async function refreshShared() {
    const [feed, places] = await Promise.all([discussionCommand('overview'), fetchLocations()])
    if (places.error) throw places.error
    setCommunity(feed); setLocations(places.data); setDataSource('supabase')
  }
  async function communityAction(action, payload) {
    let result
    try { result = await command(action, payload) }
    catch (error) { showToast(cloudError(error)); return false }
    try { await refreshShared() }
    catch { showToast('操作已保存，列表刷新失败，请重试刷新') }
    return result
  }
  useEffect(() => {
    if (!sharedBackend) return
    let active = true, loading = false
    async function refresh() {
      if (loading) return
      loading = true
      try {
        const [role, feed, places] = await Promise.all([command('role'), discussionCommand('overview'), fetchLocations()])
        if (!active) return
        if (places.error) throw places.error
        setCurrentUser(user => user ? { ...user, role: role.role } : null)
        setCommunity(feed); setLocations(places.data); setDataSource('supabase')
      } catch (error) {
        if (active) { setDataSource('error'); setCurrentUser(user => user ? { ...user, role: 'user' } : null); showToast(cloudError(error)) }
      } finally { loading = false; if (active) setIsLoadingLocations(false) }
    }
    refresh()
    const timer = setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [currentUser?.id])

  useEffect(() => {
    if (!supabase) return
    let active = true
    let authChanged = false
    const applyUser = user => {
      if (!active) return
      setCurrentUser(user ? {
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || 'Masuk 用户',
        role: 'user',
      } : null)
      setAuthBusy(false)
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authChanged = true
      applyUser(session?.user)
    })
    supabase.auth.getUser().then(({ data }) => {
      if (!authChanged) applyUser(data.user)
    }).catch(() => { if (!authChanged) applyUser(null) })
    const params = new URLSearchParams(window.location.search)
    if (params.has('error')) {
      showToast('Google 登录未完成，请重试')
      for (const key of ['error', 'error_code', 'error_description']) params.delete(key)
      window.history.replaceState(null, '', window.location.pathname + (params.size ? `?${params}` : ''))
    }
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    const syncLocalCommunity = event => {
      if (sharedBackend) return
      if (event.key === COMMUNITY_KEY) setCommunity(readCommunity())
      if (event.key === PLACES_KEY) setLocations(current => mergeLocalPlaces(current))
    }
    window.addEventListener('storage', syncLocalCommunity)
    return () => window.removeEventListener('storage', syncLocalCommunity)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadLocations() {
      if (!hasSupabaseConfig || sharedBackend) return

      const { data, error } = await fetchLocations()
      if (!isMounted) return

      setIsLoadingLocations(false)
      if (error) {
        console.error('Supabase locations query failed:', error)
        setDataSource('mock')
        return
      }

      setLocations(mergeLocalPlaces(data))
      setDataSource('supabase')
    }

    loadLocations()
    const unsubscribe = subscribeToLocations(async () => {
      if (sharedBackend) return
      const { data, error } = await fetchLocations()
      if (!isMounted || error || !data) return
      setLocations(mergeLocalPlaces(data))
      setDataSource('supabase-live')
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const matchesQuery = matchesPlaceQuery(location, query)
      const matchesArea = area === '全部区域' || location.area === area
      const summary = summarize(location, community.feedback)
      const matchesDifficulty = difficulty === 'all' || summary.level === Number(difficulty)
      return matchesQuery && matchesArea && matchesDifficulty && (!recentOnly || summary.count > 0)
    })
  }, [area, difficulty, recentOnly, locations, query, community.feedback])

  const totalPages = Math.max(1, Math.ceil(filteredLocations.length / pageSize))
  const visibleLocations = filteredLocations.slice((Math.min(currentPage, totalPages) - 1) * pageSize, Math.min(currentPage, totalPages) * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [query, area, difficulty, recentOnly])

  function showToast(message) {
    setToast(message)
    window.clearTimeout(showToast.timeout)
    showToast.timeout = window.setTimeout(() => setToast(''), 2600)
  }

  async function copyRules(location) {
    try {
      await navigator.clipboard.writeText(copyTextFor(location, community.feedback))
      showToast('门禁规则已复制，可以直接发给顾客')
    } catch {
      showToast('浏览器未开放剪贴板，请长按卡片文字复制')
    }
  }

  function clearFilters() {
    setQuery('')
    setArea('全部区域')
    setDifficulty('all')
    setRecentOnly(false)
  }

  async function handleGoogleLogin() {
    if (supabase) {
      if (authBusy) return
      setAuthBusy(true)
      try {
        if (currentUser) {
          const { error } = await supabase.auth.signOut({ scope: 'local' })
          if (error) throw error
          setCurrentUser(null)
          showToast('已退出登录')
        } else {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/` },
          })
          if (error) throw error
        }
      } catch {
        showToast('登录连接未完成，请检查网络后重试')
      } finally { setAuthBusy(false) }
      return
    }
    if (currentUser) {
      window.localStorage.removeItem('masuk-user')
      setCurrentUser(null)
      showToast('已退出本机 Google 演示登录')
      return
    }
    const name = window.prompt('Google 显示名称（演示登录）', 'Skudai Rider')
    if (!name?.trim()) return
    const nextUser = {
      id: `demo:${name.trim().toLowerCase()}`,
      name: name.trim(),
      role: /^(测试员|管理员|admin)$/i.test(name.trim()) ? 'admin' : 'user',
    }
    window.localStorage.setItem('masuk-user', JSON.stringify(nextUser))
    setCurrentUser(nextUser)
    showToast(`已登录：${nextUser.name}`)
  }

  async function handleContribution(event) {
    event.preventDefault()
    const form = event.currentTarget
    if (isSavingPlace) return
    if (!currentUser) {
      showToast('请先点击顶部登录，再保存资料')
      return
    }
    const formData = new FormData(form)
    if (!formData.get('name').trim() || !formData.get('area').trim() || !formData.get('address').trim()) return showToast('请填写公寓名称、区域和地址')
    const reason = formData.get('change_reason')?.trim() || ''
    if (editingLocation && !reason) return showToast('请填写修改原因，让其他司机了解变化')
    const lat = formData.get('latitude'), lng = formData.get('longitude')
    const hasPoint = validPoint(lat, lng)
    const duplicates = nearDuplicates(locations, formData.get('name'), hasPoint ? { lat: Number(lat), lng: Number(lng) } : null, editingLocation?.id)
    if (duplicates.length && !window.confirm('已有名称或位置相近的地点：' + duplicates.map(row => row.name).join('、') + '。确认是不同公寓，继续保存？')) return
    const updatedLocation = {
      id: editingLocation?.id || `ugc-${Date.now()}`,
      name: formData.get('name').trim(),
      area: formData.get('area').trim(),
      address: formData.get('address') || `${formData.get('area')} · 新增地点`,
      latitude: hasPoint ? Number(lat) : null,
      longitude: hasPoint ? Number(lng) : null,
      entrance_note: formData.get('entrance_note')?.trim() || '',
      maps_url: navigationUrl(hasPoint ? lat : null, hasPoint ? lng : null, formData.get('name'), formData.get('area')),
      difficulty_level: Number(formData.get('difficulty_level')),
      entry_requirements: {
        need_ic: formData.get('need_ic') === 'true' ? true : formData.get('need_ic') === 'false' ? false : '待确认',
        need_qr: formData.get('need_qr') === 'true' ? true : formData.get('need_qr') === 'false' ? false : '待确认',
        fee_required: formData.get('fee_required') === 'true' ? true : formData.get('fee_required') === 'false' ? false : '待确认',
        bike_allowed: formData.get('bike_allowed') === 'true' ? true : formData.get('bike_allowed') === 'false' ? false : '待确认',
        parking: formData.get('parking').trim() || '待确认',
        gate_rule: formData.get('gate_rule').trim() || '门禁规则暂不清楚，待司机现场补充。',
      },
      tips: formData.get('tips') || '暂无额外提示，欢迎下一位司机补充。',
      updated_at: new Date().toISOString(),
      last_modified_by: currentUser.name,
      platforms: ['司机补充'],
      verified_count: 0,
      review_needed: false,
      ...(editingLocation ? {

        source_url: editingLocation.source_url,
        source_label: editingLocation.source_label,
        verified_count: editingLocation.verified_count,
      } : {}),
    }
    setIsSavingPlace(true)
    try {
      let result
      if (sharedBackend) {
        if (editingLocation && !differences(editingLocation, updatedLocation).length) return showToast('资料没有变化，无需重复保存')
        try {
          await command('save_location', { ...updatedLocation, expectedVersion: editingLocation?.revision_number ?? null, reason: reason || '创建地点' })
        } catch (error) {
          if (error.message?.includes('VERSION_CONFLICT')) {
            const latest = await fetchLocations()
            if (latest.error) throw latest.error
            setLocations(latest.data)
            setEditConflict({ latest: latest.data.find(row => row.id === editingLocation.id), draft: updatedLocation })
          }
          throw error
        }
        const latest = await fetchLocations()
        if (latest.error) throw latest.error
        result = { saved: latest.data.find(row => row.id === updatedLocation.id) }
      } else result = await withPlaceLock(() => {
        const latest = editingLocation ? readLocalPlaces().find(row => row.id === editingLocation.id) || locations.find(row => row.id === editingLocation.id) : null
        if (editingLocation && (!latest || revisionOf(latest) !== revisionOf(editingLocation))) return { conflict: latest }
        if (latest && !differences(latest, updatedLocation).length) return { unchanged: true }
        const saved = nextRevision(latest, updatedLocation, currentUser, reason || '创建地点')
        savePlace(saved)
        return { saved }
      })
      if ('conflict' in result) { setEditConflict({ latest: result.conflict, draft: updatedLocation }); showToast('资料已被更新，草稿未覆盖，请先核对差异'); return }
      if (result.unchanged) return showToast('资料没有变化，无需重复保存')
      const saved = result.saved
      setLocations(current => [saved, ...current.filter(row => row.id !== saved.id)])
      form.reset()
      setSelectedLocationId(saved.id)
      setActiveView('detail')
      setEditingLocation(null)
      setEditConflict(null)
      window.scrollTo(0, 0)
      setQuery(saved.name)
      setArea('全部区域')
      setDifficulty('all')
      const savedScope = sharedBackend ? '已保存到云端' : '已保存到此浏览器'
      showToast(editingLocation ? `资料${savedScope}；新版本重新累计认可` : `地点${savedScope}，可以开始讨论`)
    } catch (error) { showToast(sharedBackend ? cloudError(error) : '无法保存，请检查浏览器存储后重试；表单内容仍保留') }
    finally { setIsSavingPlace(false) }
  }

  function openEdit(location) {
    if (!currentUser) return showToast('请先点击顶部登录，再修改资料')
    setEditOrigin({ view: activeView, x: window.scrollX, y: window.scrollY, trigger: document.activeElement })
    setEditingLocation(location)
    setEditConflict(null)
    setActiveView('contribute')
    setIsMenuOpen(false)
    window.scrollTo(0, 0)
  }

  function cancelEdit() {
    const origin = editOrigin && (editOrigin.view !== 'admin' || isAdminUser)
      ? editOrigin
      : { view: 'browse', x: 0, y: 0 }
    editScrollRestore.current = origin
    setEditingLocation(null)
    setEditConflict(null)
    setEditOrigin(null)
    setActiveView(origin.view)
  }

  async function approveLocation(location, visitDate) {
    if (!currentUser) return showToast('请先点击顶部登录，再认可资料')
    if (sharedBackend) {
      const enabled = !location.accuracy_votes?.some(vote => vote.userId === currentUser.id)
      if (await communityAction('approve', { id: location.id, expectedVersion: location.revision_number, enabled, visitDate })) showToast(enabled ? '已认可当前版本资料' : '已取消认可')
      return
    }
    if (visitDate && (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate) || new Date(visitDate + 'T00:00:00') > new Date())) return showToast('到访日期不能晚于今天')
    try {
      const result = await withPlaceLock(() => {
        const latest = readLocalPlaces().find(row => row.id === location.id) || locations.find(row => row.id === location.id)
        if (!latest) return { missing: true }
        if (revisionOf(latest) !== revisionOf(location)) return { stale: latest }
        const saved = toggleApproval(latest, currentUser, visitDate)
        savePlace(saved)
        return { saved }
      })
      const current = result.saved || result.stale
      if (current) setLocations(rows => rows.map(row => row.id === current.id ? current : row))
      if (result.stale) return showToast('资料刚刚更新，请阅读最新版本后再认可')
      if (result.missing) return showToast('地点已不存在，请返回列表')
      showToast(result.saved.accuracy_votes.some(vote => vote.userId === currentUser.id) ? '已认可当前版本资料' : '已取消认可')
    } catch { showToast('认可未能保存，请检查浏览器存储后重试') }
  }

  function openAdmin() {
    if (!isAdminUser) {
      showToast('只有管理员账号可以进入后台管理')
      return
    }
    setActiveView('admin')
    setEditingLocation(null)
    setIsMenuOpen(false)
  }

  function deleteLocation(location) {
    if (!window.confirm(`确定要删除「${location.name}」吗？`)) return
    try { localStorage.setItem(PLACES_KEY, JSON.stringify(readLocalPlaces().filter(row => row.id !== location.id))) }
    catch { showToast('删除未保存，请检查浏览器存储后重试'); return }
    setLocations((current) => current.filter((item) => item.id !== location.id))
    setReviewIds((current) => current.filter((id) => id !== location.id))
    showToast(`已删除：${location.name}`)
  }

  function toggleReview(location) {
    setReviewIds((current) => current.includes(location.id) ? current.filter((id) => id !== location.id) : [...current, location.id])
    showToast(reviewIds.includes(location.id) ? '已取消复核标记' : '已标记为需要复核')
  }

  return (
    <div className={`app-shell${activeView === 'admin' ? ' app-shell-admin' : ''}`}>
      <div className="grid-glow grid-glow-top" />
      <div className="grid-glow grid-glow-bottom" />

      <header className="topbar" onKeyDown={event => {
        if (event.key === 'Escape' && isMenuOpen) {
          event.preventDefault()
          setIsMenuOpen(false)
          menuButtonRef.current?.focus()
        }
      }}>
        <button className="brand" onClick={() => { setActiveView('browse'); setIsMenuOpen(false) }} aria-label="回到地点查询">
          <span className="brand-mark"><ShieldCheck size={19} strokeWidth={2.5} /></span>
          <span className="brand-copy">
            <strong>MASUK?</strong>
            <small>guardhouse intel</small>
          </span>
        </button>

        <div className="topbar-actions">
          <nav id="primary-navigation" ref={navigationRef} aria-label="主导航" className={`topnav ${isMenuOpen ? 'topnav-open' : ''}`}>
          <button aria-current={activeView === 'browse' ? 'page' : undefined} className={activeView === 'browse' ? 'nav-item nav-item-active' : 'nav-item'} onClick={() => { setActiveView('browse'); setIsMenuOpen(false); focusMain() }}>
            查地点 <span>{locations.length}</span>
          </button>
          <button aria-current={activeView === 'contribute' && !isAdminEdit ? 'page' : undefined} className={activeView === 'contribute' && !isAdminEdit ? 'nav-item nav-item-active' : 'nav-item'} onClick={() => { setEditingLocation(null); setEditConflict(null); setActiveView('contribute'); setIsMenuOpen(false); focusMain() }}>
            <MessageSquarePlus size={15} /> 报一个新点
          </button>
          {isAdminUser && <button aria-current={activeView === 'admin' || isAdminEdit ? 'page' : undefined} className={activeView === 'admin' || isAdminEdit ? 'nav-item nav-item-active' : 'nav-item'} onClick={() => { openAdmin(); focusMain() }}>
            <LayoutDashboard size={15} /> 后台管理
          </button>}
          </nav>
          <div className="account-control" onKeyDown={event => { if (event.key === 'Escape') { setAccountOpen(false); event.currentTarget.querySelector('button')?.focus() } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false) }}>
            <button className={currentUser ? 'auth-button auth-button-active' : 'auth-button'} onClick={() => currentUser ? setAccountOpen(!accountOpen) : handleGoogleLogin()} disabled={authBusy} aria-label={currentUser ? '我的账号' : undefined} aria-expanded={currentUser ? accountOpen : undefined} aria-controls={currentUser ? 'account-options' : undefined}>
              <span className="google-mark">{currentUser ? '我的' : 'G'}</span>
              <span className="account-name">{authBusy ? '连接中…' : currentUser ? currentUser.name : hasSupabaseConfig ? 'Google 登录' : '演示登录'}</span>
            </button>
            {currentUser && accountOpen && <div id="account-options" className="account-options"><strong>{currentUser.name}</strong><button disabled={authBusy} onClick={() => { setAccountOpen(false); handleGoogleLogin() }}>退出登录</button></div>}
          </div>
        </div>

        <button ref={menuButtonRef} className="menu-button" onClick={toggleMenu} aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'} aria-expanded={isMenuOpen} aria-controls="primary-navigation">
          {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <main ref={mainRef} tabIndex={-1} className={`page-wrap${activeView === 'browse' ? ' page-wrap-browse' : ''}${activeView === 'admin' || isAdminEdit ? ' page-wrap-admin' : ''}`}>
        {activeView !== 'detail' && activeView !== 'admin' && !isAdminEdit && <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> {coverageArea} · DRIVER FIELD NOTES</div>
            <h1>门口要过 <em>哪一关？</em></h1>
            <p className="hero-description-full">给 Grab、inDrive、Foodpanda 和 ShopeeFood 司机的 Guardhouse 快速情报。先看规则，再决定要不要掉头。</p>
            {activeView === 'browse' && <p className="hero-description-compact">先查门禁规则，再安排进门。</p>}
          </div>
          <BoardStatus locations={locations} feedback={community.feedback} isLoading={isLoadingLocations} dataSource={dataSource} hasCloudConfig={hasSupabaseConfig} shared={sharedBackend} />
        </section>}

        {activeView === 'detail' && selectedLocation ? (
          <LocationDetail entry={detailEntry} discussionMemory={discussionMemory} key={selectedLocation.id} location={selectedLocation} community={community} saveCommunity={saveCommunity} shared={sharedBackend} onAction={communityAction} user={currentUser} onLogin={handleGoogleLogin} copyRules={copyRules} showToast={showToast} onEdit={openEdit} onApprove={approveLocation} onBack={() => { setActiveView('browse'); requestAnimationFrame(() => window.scrollTo(0, browseScroll)) }} />
        ) : activeView === 'browse' ? (
          <BrowseView
            locations={locations}
            pageSize={pageSize}
            recentOnly={recentOnly}
            setRecentOnly={setRecentOnly}
            onCreate={() => { setEditingLocation(null); setEditConflict(null); setActiveView('contribute') }}
            community={community}
            onOpen={(location, entry = 'rules') => { setDetailEntry(entry); setBrowseScroll(window.scrollY); setSelectedLocationId(location.id); setActiveView('detail'); window.scrollTo(0, 0) }}
            query={query}
            setQuery={setQuery}
            area={area}
            setArea={setArea}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            filteredLocations={filteredLocations}
            visibleLocations={visibleLocations}
            currentPage={Math.min(currentPage, totalPages)}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            clearFilters={clearFilters}
            copyRules={copyRules}
            onEdit={openEdit}
            showToast={showToast}
          />
        ) : activeView !== 'admin' ? (
          <ContributeView shared={sharedBackend} isAdminEdit={isAdminEdit} conflict={editConflict} isSaving={isSavingPlace} onReloadLatest={() => { if (editConflict?.latest) { setEditingLocation(editConflict.latest); setEditConflict(null) } }} key={(editingLocation?.id || 'new') + (editingLocation ? revisionOf(editingLocation) : '')} locations={locations} initialName={query} onUseExisting={(location) => { setSelectedLocationId(location.id); setActiveView('detail'); window.scrollTo(0, 0) }} initialLocation={editingLocation} onSubmit={handleContribution} onCancel={cancelEdit} />
        ) : null}

        {/* Preserve admin state so cancel can restore the original list and scroll. */}
        {(activeView === 'admin' || (activeView === 'contribute' && editingLocation && editOrigin?.view === 'admin')) && (
          <div hidden={activeView !== 'admin'}>
            {sharedBackend ? <CloudAdmin user={currentUser} locations={locations} onEdit={openEdit} onChanged={refreshShared} showToast={showToast} /> : <AdminView locations={locations} reviewIds={reviewIds} currentUser={currentUser} onEdit={openEdit} onDelete={deleteLocation} onToggleReview={toggleReview} />}
          </div>
        )}
      </main>

      <footer className="footer">
        <span><Sparkles size={14} /> {coverageArea} 公开项目资料 · 门禁规则待司机现场补充</span>
        <span>v0.2 / {coverageArea}</span>
      </footer>

      {toast && <div className="toast" role="status"><CheckCircle2 size={17} /> {toast}</div>}
    </div>
  )
}

function BrowseView({ locations, pageSize, recentOnly, setRecentOnly, onCreate, community, onOpen, query, setQuery, area, setArea, difficulty, setDifficulty, filteredLocations, visibleLocations, currentPage, totalPages, setCurrentPage, clearFilters, copyRules, onEdit, showToast }) {
  const availableAreas = [...new Set(locations.map(location => location.area))]
  const candidates = locations.filter(location => (area === '全部区域' || location.area === area) && matchesPlaceQuery(location, query))
  const summaries = candidates.map(location => summarize(location, community.feedback))
  const counts = summaries.filter(summary => !recentOnly || summary.count > 0)
  const recentCount = summaries.filter(summary => summary.count > 0 && (difficulty === 'all' || summary.level === Number(difficulty))).length
  const resultsRef = useRef(null)
  function scrollBrowseTo(element) {
    if (element) window.scrollTo({ top: Math.max(0, element.getBoundingClientRect().top + window.scrollY - 20) })
  }
  function jumpPage(page) {
    setCurrentPage(page)
    requestAnimationFrame(() => { scrollBrowseTo(resultsRef.current); resultsRef.current?.focus({ preventScroll: true }) })
  }
  const suggestions = !recentOnly && area === '全部区域' && difficulty === 'all' && !filteredLocations.length ? suggestPlaces(locations, query) : []
  const pagination = position => totalPages > 1 && <nav className={`pagination browse-pagination browse-pagination-${position}`} aria-label={position === 'top' ? '地点分页（顶部）' : '地点分页'}>
    <button aria-label="上一页" disabled={currentPage === 1} onClick={() => jumpPage(currentPage - 1)}><ChevronLeft size={16} /><span>上一页</span></button>
    <span>第 {currentPage} / {totalPages} 页{position === 'bottom' && ` · 每页最多 ${pageSize} 个`}</span>
    <button aria-label="下一页" disabled={currentPage === totalPages} onClick={() => jumpPage(currentPage + 1)}><span>下一页</span><ChevronRight size={16} /></button>
  </nav>
  const searchInput = useRef(null)
  const difficultyFilters = useRef(null)
  function resetBrowseFilters(keepSearch = false) {
    if (keepSearch) { setArea('全部区域'); setDifficulty('all'); setRecentOnly(false) }
    else clearFilters()
    if (difficultyFilters.current) difficultyFilters.current.scrollLeft = 0
    searchInput.current?.focus()
  }
  return (
    <>
      <section className="search-zone">
        <div className="search-input-wrap">
          <Search size={21} />
          <input
            ref={searchInput}
            maxLength={100}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜公寓、住宅区、街道…"
            aria-label="搜索住宅区或公寓"
          />
          {query && <button className="clear-search" onClick={() => setQuery('')} aria-label="清除搜索"><X size={16} /></button>}
        </div>
        {availableAreas.length > 1 ? <label className="select-wrap">
          <MapPin size={16} />
          <select value={area} onChange={(event) => setArea(event.target.value)} aria-label="按区域筛选">
            {['全部区域', ...availableAreas].map((areaName) => <option key={areaName}>{areaName}</option>)}
          </select>
          <ChevronDown size={15} />
        </label> : <p className="coverage-caption"><MapPin size={14} />覆盖：{availableAreas[0] || coverageArea}</p>}
      </section>

      <section className="filter-zone" aria-label="通关难度筛选">
        <div className="quick-filters">
          <button className="difficulty-filter" aria-pressed={difficulty === 'all' && !recentOnly} onClick={() => { setDifficulty('all'); setRecentOnly(false) }}>全部 {candidates.length}</button>
          <button className="difficulty-filter" aria-pressed={recentOnly} onClick={() => setRecentOnly(!recentOnly)}>有近期反馈 {recentCount}</button>
        </div>
        <details className="advanced-filters" open={difficulty !== 'all' ? true : undefined}>
        <summary><Filter size={15} />按友好度筛选</summary>
        <p className="filter-explanation">近期反馈可与等级同时筛选。待确认表示尚无足够评分；数量按当前搜索、区域和近期反馈条件计算。</p>
        <div ref={difficultyFilters} className="difficulty-filters" role="group" aria-label="选择通关友好度">
          <button aria-pressed={difficulty === 'all'} className={difficulty === 'all' ? 'difficulty-filter active-filter' : 'difficulty-filter'} onClick={() => setDifficulty('all')}>全部等级 {counts.length}</button>
          {Object.entries(difficultyMeta).map(([level, meta]) => (
            <button key={level} aria-pressed={difficulty === level} className={`difficulty-filter ${meta.className} ${difficulty === level ? 'active-filter' : ''}`} onClick={() => setDifficulty(level)}>
              <span className="filter-dot" aria-hidden="true" /> {meta.label} {counts.filter(summary => summary.level === Number(level)).length}
            </button>
          ))}
        </div>
        </details>
      </section>

      <div className="result-toolbar">
        <div ref={resultsRef} tabIndex={-1} role="status" aria-atomic="true">
          <span className="result-count">{filteredLocations.length}</span>
          <span className="result-label">个地点</span>
        </div>
        {pagination('top')}
        {(query || area !== '全部区域' || difficulty !== 'all' || recentOnly) && (
          <button className="reset-button" onClick={() => resetBrowseFilters()}><RefreshCcw size={14} /> 重置筛选</button>
        )}
      </div>

      {(recentOnly || difficulty !== 'all') && <div className="active-browse-filters" aria-label="已选筛选条件">
        {recentOnly && <button onClick={() => setRecentOnly(false)} aria-label="清除近期反馈条件">近30天有反馈 ×</button>}
        {difficulty !== 'all' && <button onClick={() => setDifficulty('all')} aria-label="清除友好度条件">{difficultyMeta[difficulty].label} ×</button>}
      </div>}
      {filteredLocations.length > 0 ? (
        <section className="location-grid">
          {visibleLocations.map((location) => (
            <LocationCard community={community} onOpen={onOpen} key={location.id} location={location} copyRules={copyRules} onEdit={onEdit} showToast={showToast} />
          ))}
        </section>
      ) : (
        <BrowseEmptyState
          query={query}
          suggestions={suggestions}
          onSuggestion={location => { setQuery(location.name); searchInput.current?.focus() }}
          hasFilters={area !== '全部区域' || difficulty !== 'all' || recentOnly}
          onClearFilters={() => resetBrowseFilters(true)}
          onClearSearch={() => { setQuery(''); searchInput.current?.focus() }}
          onCreate={onCreate}
        />
      )}

      {pagination('bottom')}
      {filteredLocations.length > 0 && <button className="back-to-search" onClick={() => { scrollBrowseTo(searchInput.current); searchInput.current?.focus({ preventScroll: true }) }}>回到搜索</button>}
    </>
  )
}

function LocationCard({ community, onOpen, location, copyRules, onEdit, showToast }) {
  const summary = summarize(location, community.feedback)
  const meta = difficultyMeta[summary.level]
  const approvalCount = location.accuracy_votes?.length || 0
  const imported = location.last_modified_by === '公开资料导入'
  const discussionCount = community.postCounts?.[location.id] ?? community.posts.filter(post => post.locationId === location.id).length
  return (
    <article className={`location-card ${meta.className}`} onClick={(event) => { if (!event.target.closest('button, a, input, select, textarea, details') && !window.getSelection()?.toString()) onOpen(location) }}>
      <div className="card-stripe" />
      <div className="card-header">
        <div className="level-badge">
          <span className="level-code">{meta.code}</span>
          <strong>{summary.level ? meta.label : '暂未评分'}</strong>
          <span>{summary.count ? `${summary.count}位司机近期报告` : '暂无近期司机报告'}{summary.disputed && ' · 体验有分歧'}</span>
        </div>
        <button className="flag-button" onClick={() => showToast('收到标记，我们会提醒大家重新核对规则')} aria-label={`标记 ${location.name} 规则可能已变化`}>
          <Flag size={15} />
        </button>
      </div>

      <div className="card-title-row">
        <div>
          <h2><button className="card-title-button" onClick={() => onOpen(location)}>{location.name}</button></h2>
          <div className="location-meta"><MapPin size={14} /> {location.area} <span className="meta-divider" /> {location.address}</div>
        </div>
      </div>

      <CardEntrySummary compact location={location} />
      <div className="card-footer">
        <div className="card-actions">
          <button className="copy-button" onClick={() => onOpen(location)}>查看规则</button>
          <a className="source-link" href={location.maps_url} target="_blank" rel="noreferrer"><MapPin size={13} /> 导航</a>
          <details className="card-more"><summary>更多</summary><button className="source-link edit-link" onClick={() => onEdit(location)}><Pencil size={13} /> 修改资料</button><button className="source-link" onClick={() => copyRules(location)}><Clipboard size={14} /> 复制规则</button></details>
        </div>
      </div>
      {summary.latest && <p className="card-report-note">最近到访报告：{formatUpdated(summary.latest)} · 尚未核实</p>}
      <button className={`card-discussion-link${discussionCount ? '' : ' card-discussion-empty'}`} onClick={() => onOpen(location, 'discussion')}><MessageSquarePlus size={16} /> {discussionCount ? `${discussionCount} 个讨论` : '还没有讨论'} <span>{discussionCount ? '查看司机讨论 ↗' : '补充经验 ↗'}</span></button>

      <details className="card-extra"><summary>贴士与资料来源</summary>
        <div className={`verified-count${approvalCount ? '' : ' verified-count-empty'}`} title="仅表示当前版本资料认可，与通关评分分开计算">{approvalCount > 0 && <Check size={13} />} {approvalCount ? `${approvalCount} 人认可资料` : '资料暂无认可'}</div>
        <p className="rating-explanation">{summary.level ? meta.description : '近30天至少3位司机反馈才形成评分，单条报告不会自动确认规则。'}</p>
        <CardSourceNotes location={location} />
        <div className="tips-box">
        <Lightbulb size={16} />
        <div><span>司机避坑贴士</span><p>{location.tips}</p></div>
      </div>
      <span className="updated-at">{imported ? '资料导入' : '资料更新'} · {formatUpdated(location.updated_at)}</span></details>

    </article>
  )
}

function AdminView({ locations, reviewIds, currentUser, onEdit, onDelete, onToggleReview }) {
  const latestEdits = [...locations].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5)
  return (
    <section className="admin-layout">
      <div className="admin-heading">
        <div>
          <div className="eyebrow"><span className="live-dot" /> ADMIN CONTROL ROOM</div>
          <h1>后台管理</h1>
          <p>当前以 {currentUser?.name || '本机用户'} 身份管理 Skudai 地点资料。</p>
        </div>
        <div className="admin-status"><span className="live-dot" /> LOCAL ADMIN</div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat"><LayoutDashboard size={18} /><strong>{locations.length}</strong><span>地点总数</span></div>
        <div className="admin-stat"><AlertTriangle size={18} /><strong>{reviewIds.length}</strong><span>待复核</span></div>
        <div className="admin-stat"><Users size={18} /><strong>{new Set(locations.map((location) => location.last_modified_by || '公开资料导入')).size}</strong><span>修改者</span></div>
        <div className="admin-stat"><Clock3 size={18} /><strong>{latestEdits.length}</strong><span>近期改动</span></div>
      </div>

      <AdminSectionNav items={[
        { id: 'local-admin-locations', label: '地点资料', shortLabel: '地点' },
        { id: 'local-admin-audit', label: '最近修改', shortLabel: '记录' },
      ]} />

      <div className="admin-panel">
        <div className="admin-panel-header"><div><span className="rule-label">LOCATION DATABASE</span><h2 className="admin-section-heading" id="local-admin-locations" tabIndex={-1}>地点资料</h2></div><span>{locations.length} records</span></div>
        <AdminLocationList locations={locations} isReviewNeeded={location => reviewIds.includes(location.id)} renderRow={(location) => (
            <div className={`admin-row ${reviewIds.includes(location.id) ? 'admin-row-review' : ''}`} key={location.id}>
              <div className="admin-location"><strong>{location.name}</strong><span>{location.area} · {location.last_modified_by || '公开资料导入'}</span></div>
              <div className="admin-row-date">{formatUpdated(location.updated_at)}</div>
              <AdminLocationActions location={location} reviewNeeded={reviewIds.includes(location.id)} onEdit={onEdit} onToggleReview={onToggleReview} onDelete={onDelete} />
            </div>
          )} />
      </div>

      <div className="admin-panel recent-panel">
        <div className="admin-panel-header"><div><span className="rule-label">AUDIT TRAIL</span><h2 className="admin-section-heading" id="local-admin-audit" tabIndex={-1}>最近修改</h2></div><span>最后 5 条</span></div>
        <div className="audit-list">
          {latestEdits.map((location) => <div className="audit-item" key={location.id}><Check size={14} /><span>{location.name}</span><strong>{location.last_modified_by || '公开资料导入'}</strong><time>{formatUpdated(location.updated_at)}</time></div>)}
        </div>
      </div>
    </section>
  )
}

function ContributeView({ shared, isAdminEdit, conflict, isSaving, onReloadLatest, initialLocation, initialName, locations, onUseExisting, onSubmit, onCancel }) {
  const [name, setName] = useState(initialLocation?.name || initialName || '')
  const [address, setAddress] = useState(initialLocation?.address || '')
  const [point, setPoint] = useState(validPoint(initialLocation?.latitude, initialLocation?.longitude) && !(initialLocation.latitude === 0 && initialLocation.longitude === 0) ? { lat: Number(initialLocation.latitude), lng: Number(initialLocation.longitude) } : null)
  const duplicates = nearDuplicates(locations, name, point, initialLocation?.id)
  const requirements = initialLocation?.entry_requirements || {}
  const saveNotice = shared
    ? initialLocation
      ? '云端共享 · 保存成功后会更新当前站点的地点资料，其他设备可读取；修改者、修改原因和版本历史由服务端留存。'
      : '云端共享 · 保存成功后会在当前站点公开展示，其他设备可查看。旧本机资料不会自动上传。'
    : '本机保存 · 资料仅保存在此浏览器，刷新后仍保留，不会同步到其他设备或上传云端。'
  return (
    <section className={`contribute-layout${isAdminEdit ? ' contribute-layout-admin' : ''}`}>
      {isAdminEdit && <div className="admin-edit-context"><nav aria-label="后台编辑路径"><button type="button" onClick={onCancel}>后台 / 地点管理</button><span aria-hidden="true">/</span><span aria-current="page">编辑地点</span></nav><h1>{initialLocation.name}</h1><p>当前版本 {initialLocation.revision_number || 1} · 管理员编辑</p></div>}
      <div className="contribute-intro">
        <div className="eyebrow"><span className="live-dot" /> {isAdminEdit ? 'MASUK MANAGEMENT' : 'COMMUNITY SIGNAL'}</div>
        <h2>{isAdminEdit ? '核对并修改地点资料' : initialLocation ? <>把资料改准确，<br /><em>帮下一位少绕路。</em></> : <>你刚刚走过的门，<br /><em>帮下一位画条线。</em></>}</h2>
        <p>{isAdminEdit ? `正在修改「${initialLocation.name}」。请核对地点资料，并填写本次修改原因。` : '保安规则常常一夜之间改变。把你今天遇到的真实情况留下来，其他司机就能少一次折返。'}</p>
        <div className="contribute-note"><Info size={17} /><span>{initialLocation ? `${isAdminEdit ? '管理员编辑 · ' : ''}保存后直接更新${shared ? '当前站点' : '此浏览器'}的地点资料并生成新版本，无需另行审核；新版本重新累计认可。` : '先做现场记录，之后可以继续补充。只知道公寓地址也可以创建，门禁规则以后再补充。'}</span></div>
        <div className="form-legend">
          <span><i className="legend-dot legend-green" /> 直接进</span>
          <span><i className="legend-dot legend-orange" /> 需要登记</span>
          <span><i className="legend-dot legend-purple" /> 先问清楚</span>
        </div>
      </div>

      <form className="contribute-form" onSubmit={onSubmit} key={initialLocation?.id || 'new-location'}>
        {conflict && <div className="edit-conflict" role="alert"><h3>资料已更新，尚未保存你的草稿</h3><p>下面保留你的输入。请核对其他人的更新，再载入最新版重新编辑；不会直接覆盖对方的修改。</p>{conflict.latest && <><h4>别人已更新的内容</h4><ChangeList before={initialLocation} after={conflict.latest} /><h4>你的草稿改动</h4><ChangeList before={initialLocation} after={conflict.draft} /><button type="button" className="outline-action" onClick={onReloadLatest}>载入最新版重新编辑（替换当前草稿）</button></>}</div>}
        <div className="form-topline"><span>{isAdminEdit ? '管理员编辑地点' : initialLocation ? 'EDIT FIELD NOTE' : 'NEW FIELD NOTE'}</span><span>必填 *</span></div>
        <div className="form-row">
          <label>住宅 / 公寓名称 *<input name="name" required value={name} onChange={event => setName(event.target.value)} maxLength={150} placeholder="例如：The Troika Residences" /></label>
          <label>区域 / 城市 *<input name="area" required defaultValue={initialLocation?.area || ''} placeholder="例如：Skudai, Johor" /></label>
        </div>
        <label>地址 / 入口提示 *<input name="address" required value={address} onChange={event => setAddress(event.target.value)} placeholder="选点后自动填入，也可手动输入街道和地址" maxLength={500} /></label>
        <MapPicker point={point} address={address} searchName={name} onConfirm={(next, label) => { setPoint(next); if (label) setAddress(label) }} />
        <input type="hidden" name="latitude" value={point?.lat ?? ''} /><input type="hidden" name="longitude" value={point?.lng ?? ''} />
        <label>入口补充说明<input name="entrance_note" defaultValue={initialLocation?.entrance_note || ''} placeholder="例如：保安亭在西门，走左侧访客道" maxLength={500} /></label>
        {duplicates.length > 0 && <div className="duplicate-notice"><strong>可能已有这间公寓</strong><p>先看看相近地点，避免重复创建。不同公寓仍可继续填写。</p>{duplicates.map(row => <button type="button" key={row.id} onClick={() => onUseExisting(row)}>{row.name} · 查看已有资料 ↗</button>)}</div>}

        <fieldset>
          <legend>通关感受（不清楚可选待确认）</legend>
          <div className="form-difficulty-grid">
            {Object.entries(difficultyMeta).map(([level, meta]) => (
              <label className={`form-level-option ${meta.className}`} key={level}>
                <input type="radio" name="difficulty_level" value={level} defaultChecked={level === String(initialLocation?.difficulty_level ?? 0)} required />
                <span className="filter-dot" /> {meta.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-row">{[['need_ic', '需要证件登记'], ['need_qr', '需要顾客 QR'], ['fee_required', '需要缴费'], ['bike_allowed', '允许骑车进入']].map(([key, label]) => <label key={key}>{label}<select name={key} defaultValue={requirements[key] === true ? 'true' : requirements[key] === false ? 'false' : 'unknown'}><option value="unknown">待确认</option><option value="true">是</option><option value="false">否</option></select></label>)}</div>
        <label>指定临时停车点<input name="parking" defaultValue={requirements.parking === '待确认' ? '' : requirements.parking || ''} placeholder="例如：B1 visitor bay · 10 min" /></label>
        <label>一句话门禁规则（选填）<textarea name="gate_rule" rows="3" defaultValue={requirements.gate_rule || ''} placeholder="保安会要什么？从哪个门进？能不能骑到 lobby？" /></label>
        <label>司机避坑贴士<textarea name="tips" rows="3" defaultValue={initialLocation?.tips || ''} placeholder="例如：晚餐时段很塞，建议让顾客到 guardhouse 拿。" /></label>

        {initialLocation && <label>修改原因 *<textarea name="change_reason" required maxLength={1000} rows={2} placeholder="例如：今天到访发现已改为顾客 QR 登记" /></label>}
        <div className="form-button-row">
          {initialLocation && <button className="cancel-button" type="button" onClick={onCancel}>取消修改</button>}
          <button className="submit-button" type="submit" disabled={isSaving || !!conflict}><MessageSquarePlus size={17} /> {initialLocation ? '保存修改' : '发布这条现场情报'} <ArrowUpRight size={17} /></button>
        </div>
        <p className="form-footnote">{saveNotice}</p>
      </form>
    </section>
  )
}

export default App
