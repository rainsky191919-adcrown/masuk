import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Filter,
  Flag,
  Gauge,
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
  Trash2,
  Users,
  Clock3,
  X,
} from 'lucide-react'
import { areas, difficultyMeta, mockLocations } from './data.skudai'
import { fetchLocations, subscribeToLocations } from './lib/locations'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import MapPicker from './components/MapPicker'
import { ChangeList } from './components/AccuracyPanel'
import { revisionOf, differences, nextRevision, toggleApproval, savePlace, withPlaceLock } from './lib/revisions'
import { PLACES_KEY, readLocalPlaces, mergeLocalPlaces, validPoint, navigationUrl, nearDuplicates } from './lib/placeStorage'
import LocationDetail, { Friendliness } from './components/LocationDetail'
import { COMMUNITY_KEY, readCommunity, requirement, summarize } from './lib/community'

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
  const [community, setCommunity] = useState(readCommunity)
  const [selectedLocationId, setSelectedLocationId] = useState(null)
  const [browseScroll, setBrowseScroll] = useState(0)
  function saveCommunity(next) {
    try { localStorage.setItem(COMMUNITY_KEY, JSON.stringify(next)); setCommunity(next); return true }
    catch { showToast('浏览器未能保存，请检查存储空间后重试'); return false }
  }
  const [activeView, setActiveView] = useState('browse')
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('全部区域')
  const [difficulty, setDifficulty] = useState('all')
  const [locations, setLocations] = useState(() => mergeLocalPlaces(mockLocations))
  const selectedLocation = locations.find(item => item.id === selectedLocationId)
  const [dataSource, setDataSource] = useState(hasSupabaseConfig ? 'connecting' : 'mock')
  const [isLoadingLocations, setIsLoadingLocations] = useState(hasSupabaseConfig)
  const [editingLocation, setEditingLocation] = useState(null)
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
  const isAdminUser = currentUser?.role === 'admin'
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const [toast, setToast] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
      if (event.key === COMMUNITY_KEY) setCommunity(readCommunity())
      if (event.key === PLACES_KEY) setLocations(current => mergeLocalPlaces(current))
    }
    window.addEventListener('storage', syncLocalCommunity)
    return () => window.removeEventListener('storage', syncLocalCommunity)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadLocations() {
      if (!hasSupabaseConfig) return

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
    const normalizedQuery = query.trim().toLowerCase()
    return locations.filter((location) => {
      const matchesQuery = !normalizedQuery || [location.name, location.area, location.address].some((value) => value.toLowerCase().includes(normalizedQuery))
      const matchesArea = area === '全部区域' || (area === 'Skudai, Johor · 81300' && location.area === 'Skudai, Johor')
      const matchesDifficulty = difficulty === 'all' || summarize(location, community.feedback).level === Number(difficulty)
      return matchesQuery && matchesArea && matchesDifficulty
    })
  }, [area, difficulty, locations, query, community.feedback])

  const totalPages = Math.max(1, Math.ceil(filteredLocations.length / pageSize))
  const visibleLocations = filteredLocations.slice((Math.min(currentPage, totalPages) - 1) * pageSize, Math.min(currentPage, totalPages) * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [query, area, difficulty])

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
      const result = await withPlaceLock(() => {
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
      showToast(editingLocation ? '资料已更新，立即生效；新版本重新累计认可' : '地点已保存，可以开始讨论')
    } catch { showToast('无法保存，请检查浏览器存储后重试；表单内容仍保留') }
    finally { setIsSavingPlace(false) }
  }

  function openEdit(location) {
    if (!currentUser) return showToast('请先点击顶部登录，再修改资料')
    setEditingLocation(location)
    setEditConflict(null)
    setActiveView('contribute')
    setIsMenuOpen(false)
    window.scrollTo(0, 0)
  }

  async function approveLocation(location, visitDate) {
    if (!currentUser) return showToast('请先点击顶部登录，再认可资料')
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
    <div className="app-shell">
      <div className="grid-glow grid-glow-top" />
      <div className="grid-glow grid-glow-bottom" />

      <header className="topbar">
        <button className="brand" onClick={() => { setActiveView('browse'); setIsMenuOpen(false) }} aria-label="回到地点查询">
          <span className="brand-mark"><ShieldCheck size={19} strokeWidth={2.5} /></span>
          <span className="brand-copy">
            <strong>MASUK?</strong>
            <small>guardhouse intel</small>
          </span>
        </button>

        <div className="topbar-actions">
          <div className={`topnav ${isMenuOpen ? 'topnav-open' : ''}`}>
          <button className={activeView === 'browse' ? 'nav-item nav-item-active' : 'nav-item'} onClick={() => { setActiveView('browse'); setIsMenuOpen(false) }}>
            查地点 <span>{locations.length}</span>
          </button>
          <button className={activeView === 'contribute' ? 'nav-item nav-item-active' : 'nav-item'} onClick={() => { setEditingLocation(null); setEditConflict(null); setActiveView('contribute'); setIsMenuOpen(false) }}>
            <MessageSquarePlus size={15} /> 报一个新点
          </button>
          {isAdminUser && <button className={activeView === 'admin' ? 'nav-item nav-item-active' : 'nav-item'} onClick={openAdmin}>
            <LayoutDashboard size={15} /> 后台管理
          </button>}
          </div>
          <button className={currentUser ? 'auth-button auth-button-active' : 'auth-button'} onClick={handleGoogleLogin} disabled={authBusy} title={currentUser ? '点击退出登录' : undefined}>
            <span className="google-mark">G</span>
            {authBusy ? '连接中…' : currentUser ? currentUser.name : hasSupabaseConfig ? 'Google 登录' : '演示登录'}
          </button>
        </div>

        <button className="menu-button" onClick={() => setIsMenuOpen((open) => !open)} aria-label="打开菜单">
          {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <main className="page-wrap">
        {activeView !== 'detail' && <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> KLANG VALLEY · DRIVER FIELD NOTES</div>
            <h1>门口要过 <em>哪一关？</em></h1>
            <p>给 Grab、inDrive、Foodpanda 和 ShopeeFood 司机的 Guardhouse 快速情报。先看规则，再决定要不要掉头。</p>
          </div>
          <div className="hero-signal" aria-label="目前情报板状态">
            <div className="signal-ring"><Gauge size={26} /></div>
            <div>
              <span className="signal-label">FIELD BOARD</span>
              <strong>{isLoadingLocations ? '同步中…' : `${locations.length} 个地点`}</strong>
              <small>{dataSource === 'supabase-live' ? 'Supabase · 实时同步' : dataSource === 'supabase' ? 'Supabase · 云端资料' : 'Skudai · 本地资料'}</small>
            </div>
            <ArrowUpRight className="signal-arrow" size={18} />
          </div>
        </section>}

        {activeView === 'detail' && selectedLocation ? (
          <LocationDetail key={selectedLocation.id} location={selectedLocation} community={community} saveCommunity={saveCommunity} user={currentUser} onLogin={handleGoogleLogin} copyRules={copyRules} showToast={showToast} onEdit={openEdit} onApprove={approveLocation} onBack={() => { setActiveView('browse'); requestAnimationFrame(() => window.scrollTo(0, browseScroll)) }} />
        ) : activeView === 'browse' ? (
          <BrowseView
            onCreate={() => { setEditingLocation(null); setEditConflict(null); setActiveView('contribute') }}
            community={community}
            onOpen={(location) => { setBrowseScroll(window.scrollY); setSelectedLocationId(location.id); setActiveView('detail'); window.scrollTo(0, 0) }}
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
        ) : activeView === 'admin' ? (
          <AdminView locations={locations} reviewIds={reviewIds} currentUser={currentUser} onEdit={openEdit} onDelete={deleteLocation} onToggleReview={toggleReview} />
        ) : (
          <ContributeView conflict={editConflict} isSaving={isSavingPlace} onReloadLatest={() => { if (editConflict?.latest) { setEditingLocation(editConflict.latest); setEditConflict(null) } }} key={(editingLocation?.id || 'new') + (editingLocation ? revisionOf(editingLocation) : '')} locations={locations} initialName={query} onUseExisting={(location) => { setSelectedLocationId(location.id); setActiveView('detail'); window.scrollTo(0, 0) }} initialLocation={editingLocation} onSubmit={handleContribution} onCancel={() => { setEditingLocation(null); setEditConflict(null); setActiveView('browse') }} />
        )}
      </main>

      <footer className="footer">
        <span><Sparkles size={14} /> Johor / Skudai 公开项目资料 · 门禁规则待司机现场补充</span>
        <span>v0.2 / Skudai only</span>
      </footer>

      {toast && <div className="toast" role="status"><CheckCircle2 size={17} /> {toast}</div>}
    </div>
  )
}

function BrowseView({ onCreate, community, onOpen, query, setQuery, area, setArea, difficulty, setDifficulty, filteredLocations, visibleLocations, currentPage, totalPages, setCurrentPage, clearFilters, copyRules, onEdit, showToast }) {
  return (
    <>
      <section className="search-zone">
        <div className="search-input-wrap">
          <Search size={21} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜公寓、住宅区、街道…"
            aria-label="搜索住宅区或公寓"
          />
          {query && <button className="clear-search" onClick={() => setQuery('')} aria-label="清除搜索"><X size={16} /></button>}
        </div>
        <label className="select-wrap">
          <MapPin size={16} />
          <select value={area} onChange={(event) => setArea(event.target.value)} aria-label="按区域筛选">
            {areas.map((areaName) => <option key={areaName}>{areaName}</option>)}
          </select>
          <ChevronDown size={15} />
        </label>
      </section>

      <section className="filter-zone" aria-label="通关难度筛选">
        <div className="filter-title"><Filter size={15} /> 通关友好度</div>
        <div className="difficulty-filters">
          <button className={difficulty === 'all' ? 'difficulty-filter active-filter' : 'difficulty-filter'} onClick={() => setDifficulty('all')}>全部</button>
          {Object.entries(difficultyMeta).map(([level, meta]) => (
            <button key={level} className={`difficulty-filter ${meta.className} ${difficulty === level ? 'active-filter' : ''}`} onClick={() => setDifficulty(level)}>
              <span className="filter-dot" /> {meta.label}
            </button>
          ))}
        </div>
      </section>

      <div className="result-toolbar">
        <div>
          <span className="result-count">{filteredLocations.length}</span>
          <span className="result-label">个情报点匹配</span>
        </div>
        {(query || area !== '全部区域' || difficulty !== 'all') && (
          <button className="reset-button" onClick={clearFilters}><RefreshCcw size={14} /> 重置筛选</button>
        )}
      </div>

      {filteredLocations.length > 0 ? (
        <section className="location-grid">
          {visibleLocations.map((location) => (
            <LocationCard community={community} onOpen={onOpen} key={location.id} location={location} copyRules={copyRules} onEdit={onEdit} showToast={showToast} />
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <Search size={28} />
          <strong>这个区域还没有匹配的记录</strong>
          <p>换一个关键词，或者先把筛选清空。也可以直接补充这个地点。</p>
          <div className="empty-actions"><button onClick={onCreate}><MessageSquarePlus size={16} /> 新增这间公寓</button><button onClick={clearFilters}>清空筛选</button></div>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pagination" aria-label="地点分页">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>上一页</button>
          <span>第 {currentPage} / {totalPages} 页 · 每页最多 {20} 个</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>下一页</button>
        </nav>
      )}
    </>
  )
}

function LocationCard({ community, onOpen, location, copyRules, onEdit, showToast }) {
  const meta = difficultyMeta[summarize(location, community.feedback).level]
  return (
    <article className={`location-card ${meta.className}`} onClick={(event) => { if (!event.target.closest('button, a, input, select, textarea') && !window.getSelection()?.toString()) onOpen(location) }}>
      <div className="card-stripe" />
      <div className="card-header">
        <div className="level-badge">
          <span className="level-code">{meta.code}</span>
          <strong>{meta.label}</strong>
          <span>{meta.short}</span>
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
        <div className="verified-count"><Check size={13} /> {location.accuracy_votes?.length || 0} 人认可</div>
      </div>

      <Friendliness compact location={location} feedback={community.feedback} />
      <div className="rule-callout">
        <span className="rule-label">ENTRY RULE</span>
        <p>{location.entry_requirements.gate_rule}</p>
      </div>

      <div className="tips-box">
        <Lightbulb size={16} />
        <div><span>司机避坑贴士</span><p>{location.tips}</p></div>
      </div>

<button className="card-discussion-link" onClick={() => onOpen(location)}><MessageSquarePlus size={16} /> {community.posts.filter(post => post.locationId === location.id).length} 个讨论 <span>查看详情与发言 ↗</span></button>
      <div className="card-footer">
        <span className="updated-at"><RefreshCcw size={13} /> 最后修改：{location.last_modified_by || '公开资料导入'} · {formatUpdated(location.updated_at)}</span>
        <div className="card-actions">
          <a className="source-link" href={location.maps_url} target="_blank" rel="noreferrer"><MapPin size={13} /> Maps</a>
          <button className="source-link edit-link" onClick={() => onEdit(location)}><Pencil size={13} /> 修改</button>
          <button className="copy-button" onClick={() => copyRules(location)}><Clipboard size={14} /> 复制</button>
        </div>
      </div>
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
          <h2>后台管理<br /><em>看清每一次改动。</em></h2>
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

      <div className="admin-panel">
        <div className="admin-panel-header"><div><span className="rule-label">LOCATION DATABASE</span><h3>地点资料</h3></div><span>{locations.length} records</span></div>
        <div className="admin-table">
          {locations.map((location) => (
            <div className={`admin-row ${reviewIds.includes(location.id) ? 'admin-row-review' : ''}`} key={location.id}>
              <div className="admin-location"><strong>{location.name}</strong><span>{location.area} · {location.last_modified_by || '公开资料导入'}</span></div>
              <div className="admin-row-date">{formatUpdated(location.updated_at)}</div>
              <div className="admin-row-actions">
                <button className="admin-action review-action" onClick={() => onToggleReview(location)}><AlertTriangle size={14} /> {reviewIds.includes(location.id) ? '取消复核' : '需复核'}</button>
                <button className="admin-action" onClick={() => onEdit(location)}><Pencil size={14} /> 修改</button>
                <button className="admin-action delete-action" onClick={() => onDelete(location)}><Trash2 size={14} /> 删除</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-panel recent-panel">
        <div className="admin-panel-header"><div><span className="rule-label">AUDIT TRAIL</span><h3>最近修改</h3></div><span>最后 5 条</span></div>
        <div className="audit-list">
          {latestEdits.map((location) => <div className="audit-item" key={location.id}><Check size={14} /><span>{location.name}</span><strong>{location.last_modified_by || '公开资料导入'}</strong><time>{formatUpdated(location.updated_at)}</time></div>)}
        </div>
      </div>
    </section>
  )
}

function ContributeView({ conflict, isSaving, onReloadLatest, initialLocation, initialName, locations, onUseExisting, onSubmit, onCancel }) {
  const [name, setName] = useState(initialLocation?.name || initialName || '')
  const [address, setAddress] = useState(initialLocation?.address || '')
  const [point, setPoint] = useState(validPoint(initialLocation?.latitude, initialLocation?.longitude) && !(initialLocation.latitude === 0 && initialLocation.longitude === 0) ? { lat: Number(initialLocation.latitude), lng: Number(initialLocation.longitude) } : null)
  const duplicates = nearDuplicates(locations, name, point, initialLocation?.id)
  const requirements = initialLocation?.entry_requirements || {}
  return (
    <section className="contribute-layout">
      <div className="contribute-intro">
        <div className="eyebrow"><span className="live-dot" /> COMMUNITY SIGNAL</div>
        <h2>{initialLocation ? <>把资料改准确，<br /><em>帮下一位少绕路。</em></> : <>你刚刚走过的门，<br /><em>帮下一位画条线。</em></>}</h2>
        <p>保安规则常常一夜之间改变。把你今天遇到的真实情况留下来，其他司机就能少一次折返。</p>
        <div className="contribute-note"><Info size={17} /><span>先做现场记录，之后可以继续补充。提交内容会先标为“司机补充”。</span></div>
        <div className="form-legend">
          <span><i className="legend-dot legend-green" /> 直接进</span>
          <span><i className="legend-dot legend-orange" /> 需要登记</span>
          <span><i className="legend-dot legend-purple" /> 先问清楚</span>
        </div>
      </div>

      <form className="contribute-form" onSubmit={onSubmit} key={initialLocation?.id || 'new-location'}>
        {conflict && <div className="edit-conflict" role="alert"><h3>资料已更新，尚未保存你的草稿</h3><p>下面保留你的输入。请核对其他人的更新，再载入最新版重新编辑；不会直接覆盖对方的修改。</p>{conflict.latest && <><h4>别人已更新的内容</h4><ChangeList before={initialLocation} after={conflict.latest} /><h4>你的草稿改动</h4><ChangeList before={initialLocation} after={conflict.draft} /><button type="button" className="outline-action" onClick={onReloadLatest}>载入最新版重新编辑（替换当前草稿）</button></>}</div>}
        <div className="form-topline"><span>{initialLocation ? 'EDIT FIELD NOTE' : 'NEW FIELD NOTE'}</span><span>必填 *</span></div>
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
        <p className="form-footnote">资料仅保存在此浏览器，刷新后仍保留，尚未跨设备共享。只知道公寓地址也可以创建，门禁规则以后再补充。</p>
      </form>
    </section>
  )
}

export default App
