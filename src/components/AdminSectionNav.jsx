import { useLayoutEffect, useRef } from 'react'

export default function AdminSectionNav({ items }) {
  const navRef = useRef(null)
  useLayoutEffect(() => {
    const nav = navRef.current
    const owner = nav?.closest('.admin-layout')
    if (!owner) return
    const measure = () => {
      const height = nav.getBoundingClientRect().height
      if (height > 0) owner.style.setProperty('--admin-section-offset', `${Math.ceil(height) + 28}px`)
    }
    measure()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(nav)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
      owner.style.removeProperty('--admin-section-offset')
    }
  }, [])

  function jumpTo(id) {
    const heading = document.getElementById(id)
    if (!heading) return
    heading.focus({ preventScroll: true })
    heading.scrollIntoView?.({ block: 'start' })
  }

  return <nav className="admin-section-nav" aria-label="后台模块直达" ref={navRef} style={{ '--admin-section-count': items.length }}>
    {items.map(item => <button key={item.id} type="button" aria-controls={item.id} aria-label={`前往${item.label}`} title={item.label} onClick={() => jumpTo(item.id)}><span className="admin-section-full">{item.label}</span><span className="admin-section-short" aria-hidden="true">{item.shortLabel}</span></button>)}
  </nav>
}
