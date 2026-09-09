import { useEffect, useRef } from 'react'

/**
 * SmokeCursor v2 — premium "magic cursor".
 * Layers: thin silky smoke ribbon, fine rising wisps, twinkling sparkles,
 * bright core dot, and a slim lagging ring that stretches with velocity.
 * Zero dependencies. Auto-disabled on touch devices and for
 * prefers-reduced-motion users. pointer-events: none — never blocks UI.
 */
export function SmokeCursor({ color = [190, 95, 62] }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(hover: none)').matches
    ) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const H = color[0]
    const S = color[1]
    const L = color[2]
    const DPR = Math.min(window.devicePixelRatio || 1, 2)

    let width = 0
    let height = 0
    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * DPR)
      canvas.height = Math.floor(height * DPR)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const mouse = { x: -100, y: -100, px: -100, py: -100, speed: 0, active: false }
    const core = { x: -100, y: -100 }
    const ring = { x: -100, y: -100, vx: 0, vy: 0, scale: 1 }

    const trail = []
    const TRAIL_LIFE = 620

    const wisps = []
    const MAX_WISPS = 90

    const sparks = []
    const MAX_SPARKS = 18

    let lastMove = 0

    const onMove = (e) => {
      const now = performance.now()
      mouse.px = mouse.x
      mouse.py = mouse.y
      mouse.x = e.clientX
      mouse.y = e.clientY
      const dx = mouse.x - mouse.px
      const dy = mouse.y - mouse.py
      const dist = Math.hypot(dx, dy)
      mouse.speed = mouse.speed * 0.8 + dist * 0.2

      if (!mouse.active) {
        mouse.active = true
        core.x = ring.x = mouse.x
        core.y = ring.y = mouse.y
        mouse.px = mouse.x
        mouse.py = mouse.y
        return
      }

      const steps = Math.max(1, Math.min(6, Math.floor(dist / 9)))
      for (let i = 1; i <= steps; i++) {
        const f = i / steps
        trail.push({
          x: mouse.px + dx * f,
          y: mouse.py + dy * f,
          t: now,
          seed: Math.random() * Math.PI * 2,
        })
      }
      if (trail.length > 70) trail.splice(0, trail.length - 70)

      if (dist > 2 && wisps.length < MAX_WISPS) {
        const n = Math.min(3, 1 + Math.floor(dist / 26))
        for (let i = 0; i < n; i++) {
          const f = Math.random()
          wisps.push({
            x: mouse.px + dx * f + (Math.random() - 0.5) * 4,
            y: mouse.py + dy * f + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 0.35,
            vy: -0.25 - Math.random() * 0.4,
            r: 1 + Math.random() * 2.4,
            life: 0,
            maxLife: 650 + Math.random() * 550,
            seed: Math.random() * Math.PI * 2,
          })
        }
      }

      if (mouse.speed > 14 && sparks.length < MAX_SPARKS && Math.random() < 0.3) {
        sparks.push({
          x: mouse.x + (Math.random() - 0.5) * 26,
          y: mouse.y + (Math.random() - 0.5) * 26,
          life: 0,
          maxLife: 420 + Math.random() * 380,
          size: 2.5 + Math.random() * 3.5,
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.06,
        })
      }
      lastMove = now
    }

    const onLeave = () => {
      mouse.active = false
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)

    let raf = 0
    let prev = performance.now()

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const now = performance.now()
      const dt = Math.min(32, now - prev)
      prev = now

      ctx.clearRect(0, 0, width, height)

      if (now - lastMove > 90) mouse.speed *= 0.9

      // ---- 1) thin smoke ribbon ----
      while (trail.length && now - trail[0].t > TRAIL_LIFE) trail.shift()

      if (trail.length > 2) {
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        for (let pass = 0; pass < 2; pass++) {
          for (let i = 1; i < trail.length; i++) {
            const a = trail[i - 1]
            const b = trail[i]
            const age = (now - b.t) / TRAIL_LIFE
            const fade = 1 - age
            if (fade <= 0) continue
            if (Math.hypot(b.x - a.x, b.y - a.y) > 60) continue

            const ox = Math.sin(b.seed + now * 0.0018) * 14 * age
            const oy =
              -10 * age * age + Math.cos(b.seed * 1.7 + now * 0.0013) * 6 * age

            const w0 = pass === 0 ? 7 : 1.6
            const lw = Math.max(0.4, w0 * fade * fade)
            const alpha = (pass === 0 ? 0.05 : 0.22) * fade * fade
            const light = pass === 0 ? L : Math.min(92, L + 24)

            ctx.strokeStyle = 'hsla(' + H + ', ' + S + '%, ' + light + '%, ' + alpha + ')'
            ctx.lineWidth = lw
            ctx.beginPath()
            ctx.moveTo(a.x + ox, a.y + oy)
            ctx.lineTo(b.x + ox, b.y + oy)
            ctx.stroke()
          }
        }
        ctx.restore()
      }

      // ---- 2) fine wisps ----
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (let i = wisps.length - 1; i >= 0; i--) {
        const p = wisps[i]
        p.life += dt
        if (p.life >= p.maxLife) {
          wisps.splice(i, 1)
          continue
        }
        const f = p.life / p.maxLife
        p.vx += Math.sin(p.seed + now * 0.002 + p.y * 0.02) * 0.012
        p.vy -= 0.004
        p.x += p.vx * (dt / 16.7)
        p.y += p.vy * (dt / 16.7)
        const alpha = 0.28 * (1 - f) * (1 - f)
        const r = p.r * (1 + f * 1.6)
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3)
        g.addColorStop(0, 'hsla(' + H + ', ' + S + '%, ' + Math.min(94, L + 28) + '%, ' + alpha + ')')
        g.addColorStop(0.5, 'hsla(' + H + ', ' + S + '%, ' + L + '%, ' + alpha * 0.45 + ')')
        g.addColorStop(1, 'hsla(' + H + ', ' + S + '%, ' + L + '%, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // ---- 3) sparkles ----
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i]
        sp.life += dt
        if (sp.life >= sp.maxLife) {
          sparks.splice(i, 1)
          continue
        }
        const f = sp.life / sp.maxLife
        const tw = Math.sin(f * Math.PI)
        sp.rot += sp.spin * (dt / 16.7)
        const size = sp.size * tw
        const alpha = 0.85 * tw
        ctx.save()
        ctx.translate(sp.x, sp.y)
        ctx.rotate(sp.rot)
        ctx.fillStyle = 'hsla(' + H + ', ' + S + '%, 92%, ' + alpha + ')'
        ctx.beginPath()
        ctx.moveTo(0, -size * 2.4)
        ctx.quadraticCurveTo(size * 0.28, -size * 0.28, size * 2.4, 0)
        ctx.quadraticCurveTo(size * 0.28, size * 0.28, 0, size * 2.4)
        ctx.quadraticCurveTo(-size * 0.28, size * 0.28, -size * 2.4, 0)
        ctx.quadraticCurveTo(-size * 0.28, -size * 0.28, 0, -size * 2.4)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      ctx.restore()

      if (mouse.active) {
        // ---- 4) core dot ----
        core.x += (mouse.x - core.x) * 0.55
        core.y += (mouse.y - core.y) * 0.55
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        const pulse = 1 + Math.sin(now * 0.006) * 0.12
        const cg = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, 9 * pulse)
        cg.addColorStop(0, 'hsla(' + H + ', ' + S + '%, 96%, 0.95)')
        cg.addColorStop(0.35, 'hsla(' + H + ', ' + S + '%, ' + Math.min(90, L + 20) + '%, 0.5)')
        cg.addColorStop(1, 'hsla(' + H + ', ' + S + '%, ' + L + '%, 0)')
        ctx.fillStyle = cg
        ctx.beginPath()
        ctx.arc(core.x, core.y, 9 * pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // ---- 5) lagging ring ----
        const k = 0.09
        const damp = 0.72
        ring.vx = (ring.vx + (mouse.x - ring.x) * k) * damp
        ring.vy = (ring.vy + (mouse.y - ring.y) * k) * damp
        ring.x += ring.vx
        ring.y += ring.vy

        const v = Math.hypot(ring.vx, ring.vy)
        const stretch = Math.min(0.45, v * 0.02)
        const angle = Math.atan2(ring.vy, ring.vx)
        const targetScale = 1 + Math.min(0.5, mouse.speed * 0.012)
        ring.scale += (targetScale - ring.scale) * 0.12

        ctx.save()
        ctx.translate(ring.x, ring.y)
        ctx.rotate(angle)
        ctx.scale(1 + stretch, 1 - stretch * 0.55)
        const R = 15 * ring.scale
        ctx.strokeStyle = 'hsla(' + H + ', ' + S + '%, ' + Math.min(88, L + 16) + '%, 0.75)'
        ctx.lineWidth = 1.25
        ctx.shadowColor = 'hsla(' + H + ', ' + S + '%, ' + L + '%, 0.9)'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(0, 0, R, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [color])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}

export default SmokeCursor
