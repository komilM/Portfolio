import React, { useEffect, useRef, useState } from 'react'
import "./App.css"
import logo from "./assets/Group 1 (1).png"
import headimg from "./assets/Gleb.png"
import cardpen from "./assets/bi_vector-pen.png"
import cardui from "./assets/UI.png"
import card from "./assets/fontisto_nav-icon-list.png"
import cradicon from "./assets/carbon_logo-delicious.png"
import cradfront from "./assets/bi_display.png"

/* =====================================================
   1. DOT GRID (faqat o'z kartasi ichida ishlaydi)
===================================================== */

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function DotGrid({
  dotSize = 4,
  gap = 28,
  baseColor = '#2f2a3d',
  activeColor = null,
  proximity = 120,
  pushStrength = 0.15,
  shockRadius = 220,
  shockStrength = 12,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const parent = canvas.parentElement
    const accent =
      activeColor ||
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() ||
      '#8b6cff'
    const base = hexToRgb(baseColor)
    const active = hexToRgb(accent)
    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0 }
    let dots = []
    let w = 0
    let h = 0
    let raf
    let visible = true

    const build = () => {
      const dpr = window.devicePixelRatio || 1
      w = parent.clientWidth
      h = parent.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const cols = Math.floor(w / gap)
      const rows = Math.floor(h / gap)
      const startX = (w - (cols - 1) * gap) / 2
      const startY = (h - (rows - 1) * gap) / 2
      dots = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({ x: startX + c * gap, y: startY + r * gap, ox: 0, oy: 0, vx: 0, vy: 0 })
        }
      }
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (mouse.x > -9000) {
        mouse.vx = x - mouse.x
        mouse.vy = y - mouse.y
      }
      mouse.x = x
      mouse.y = y
    }

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      for (const d of dots) {
        const dx = d.x - cx
        const dy = d.y - cy
        const dist = Math.hypot(dx, dy) || 1
        if (dist < shockRadius) {
          const f = 1 - dist / shockRadius
          d.vx += (dx / dist) * shockStrength * f
          d.vy += (dy / dist) * shockStrength * f
        }
      }
    }

    const tick = () => {
      if (!visible) {
        raf = requestAnimationFrame(tick)
        return
      }
      ctx.clearRect(0, 0, w, h)
      for (const d of dots) {
        const px = d.x + d.ox
        const py = d.y + d.oy
        const dist = Math.hypot(px - mouse.x, py - mouse.y)
        const t = dist < proximity ? 1 - dist / proximity : 0

        if (t > 0) {
          d.vx += mouse.vx * t * pushStrength
          d.vy += mouse.vy * t * pushStrength
        }

        d.vx += -d.ox * 0.06
        d.vy += -d.oy * 0.06
        d.vx *= 0.9
        d.vy *= 0.9
        d.ox += d.vx
        d.oy += d.vy

        const r = Math.round(base[0] + (active[0] - base[0]) * t)
        const g = Math.round(base[1] + (active[1] - base[1]) * t)
        const b = Math.round(base[2] + (active[2] - base[2]) * t)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.beginPath()
        ctx.arc(d.x + d.ox, d.y + d.oy, dotSize / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      mouse.vx *= 0.8
      mouse.vy *= 0.8
      raf = requestAnimationFrame(tick)
    }

    build()
    tick()
    const ro = new ResizeObserver(build)
    ro.observe(parent)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
    }
  }, [dotSize, gap, baseColor, activeColor, proximity, pushStrength, shockRadius, shockStrength])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}

/* =====================================================
   2. SPOTLIGHT CARD
===================================================== */

function SpotlightCard({ children, className = '', spotlightColor, tilt = 6, onClick }) {
  const ref = useRef(null)

  const handleMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    el.style.setProperty('--mx', `${x}px`)
    el.style.setProperty('--my', `${y}px`)
    el.style.setProperty('--rx', `${(y / rect.height - 0.5) * -tilt}deg`)
    el.style.setProperty('--ry', `${(x / rect.width - 0.5) * tilt}deg`)
  }

  const handleLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <div
      ref={ref}
      className={`sp-card ${className}`}
      style={spotlightColor ? { '--spot': spotlightColor } : undefined}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      <div className="sp-card-inner">{children}</div>
    </div>
  )
}

/* =====================================================
   3. TECH TEXT
===================================================== */

function TechLetter({ char, box }) {
  const ref = useRef(null)
  const [info, setInfo] = useState(null)
  const [on, setOn] = useState(false)

  const enter = () => {
    const r = ref.current.getBoundingClientRect()
    setInfo({ w: Math.round(r.width), h: Math.round(r.height) })
    setOn(true)
  }

  return (
    <span
      ref={ref}
      className={`tt-letter${on ? ' tt-on' : ''}`}
      onMouseEnter={enter}
      onMouseLeave={() => setOn(false)}
    >
      <span className="tt-glyph">{char}</span>
      {info && (
        <>
          <svg className="tt-svg" aria-hidden="true">
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
              {char}
            </text>
          </svg>
          {box && (
            <span className="tt-box">
              <i /><i /><i /><i />
              <span className="tt-label">
                {char}&nbsp;&nbsp;{info.w} x {info.h}
              </span>
            </span>
          )}
        </>
      )}
    </span>
  )
}

function TechText({ text, box = false, color }) {
  return (
    <span className="tt" style={color ? { '--tt-color': color } : undefined}>
      <span className="tt-sr">{text}</span>
      <span aria-hidden="true">
        {text.split(' ').map((word, i) => (
          <React.Fragment key={i}>
            {i > 0 && ' '}
            <span className="tt-word">
              {[...word].map((ch, j) => (
                <TechLetter key={j} char={ch} box={box} />
              ))}
            </span>
          </React.Fragment>
        ))}
      </span>
    </span>
  )
}

/* =====================================================
   4. REVEAL (scroll qilganda silliq paydo bo'lish)
===================================================== */

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(true)
        io.disconnect()
      }
    }, { threshold: 0.15 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`reveal${shown ? ' in' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/* =====================================================
   5. SAYT MA'LUMOTLARI (matnlarni shu yerdan o'zgartiring)
===================================================== */

const NAV = [
  ['Home', '#home'],
  ['About me', '#about'],
  ['My sites', '#sites'],
  ['Contact', '#contact'],
]

const SKILLS = [
  { img: cardpen, title: 'Product Design', text: 'From first idea to a finished, polished product.' },
  { img: cardui, title: 'UX/UI Design', text: 'Clear, modern interfaces that are easy to use.' },
  { img: card, title: 'Icon Design', text: 'Crisp custom icons that fit your brand.' },
  { img: cradicon, title: 'Logo Design', text: 'Simple, memorable logos with character.' },
  { img: cradfront, title: 'Frontend', text: 'Fast, responsive websites built with React.' },
]

const SITE_URL1 = "https://car-rental-blond-beta.vercel.app/"
const SITE_URL2 = "https://faceter.vercel.app/"
const EMAIL = ""
const TELEGRAM = "https://t.me/Its_Komil"

/* =====================================================
   6. SAYT
===================================================== */

const App = () => {
  return (
    <div className="app">
      <div className="page">

        {/* ---------- NAV ---------- */}
        <nav className="nav">
          <a href="#home" className="nav-logo">
            <img src={logo} alt="Logo" />
          </a>
          <div className="nav-links">
            {NAV.map(([label, href]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </div>
          <a href="#contact" className="btn btn-primary btn-sm">Contact me</a>
        </nav>

        {/* ---------- HERO: bitta katta karta, nuqtalar ichida ---------- */}
        <header id="home" className="hero">
          <div className="dots-layer">
            <DotGrid />
          </div>

          <div className="hero-grid">
            <div className="hero-text">
              <span className="pill">Web design · Front-end </span>
              <p className="hero-kicker">Hello</p>
              <h1><TechText text="I'M Komil Meliyev" box /></h1>
              <p className="hero-desc">
                I've been doing web design, front-end and back-end development for a year now.
                Do you need a website design, site layout, or maybe a turnkey website? Then contact me
              </p>
              <div className="hero-actions">
                <a href="#contact" className="btn btn-primary">Contact me</a>
                <a href="#sites" className="btn btn-ghost">My sites</a>
              </div>
              <div className="hero-chips">
                <span className="chip">UI</span>
                <span className="chip">UX</span>
                <span className="chip">Photoshop</span>
                <span className="chip">React</span>
              </div>
            </div>

            <div className="hero-img">
              <img src={headimg} alt="Komil Meliyev" />
            </div>
          </div>
        </header>

        {/* ---------- ABOUT: bento kartalar ---------- */}
        <section id="about" className="block">
          <div className="block-head">
            <span className="pill">About me</span>
            <h2><TechText text="What I do" box /></h2>
            <p>Design and development, from the first sketch to a live website.</p>
          </div>

          <div className="bento">
            {SKILLS.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <SpotlightCard>
                  <div className="bento-icon">
                    <img src={s.img} alt={s.title} />
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- MY SITES ---------- */}
        <section id="sites" className="block">
          <div className="block-head">
            <span className="pill">Portfolio</span>
            <h2><TechText text="My sites" box /></h2>
            <p>A selection of websites I've built.</p>
          </div>

          <Reveal>
            <SpotlightCard className="project" tilt={3} onClick={() => window.open(SITE_URL1, "_blank")}>
              <div className="project-text">
                <h3>Car rental</h3>
                <p>A car rental website for desktop.</p>
                <div className="project-tags">
                  <span className="chip">React</span>
                  <span className="chip">Responsive</span>
                  <span className="chip">UI design</span>
                  <span className="chip">Frontent</span>
                </div>
                <span className="btn btn-primary btn-sm">Visit site ↗</span>
              </div>

              <div className="mock" aria-hidden="true">
                <div className="mock-bar"><i /><i /><i /></div>
                <div className="mock-line accent" />
                <div className="mock-line" />
                <div className="mock-line" style={{ width: '80%' }} />
                <div className="mock-block" />
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal>
            <SpotlightCard className="project" tilt={3} onClick={() => window.open(SITE_URL2, "_blank")}>
              <div className="project-text">
                <h3>Faceter</h3>
                <p>A camera website for desktop.</p>
                <div className="project-tags">
                  <span className="chip">React</span>
                  <span className="chip">UI design</span>
                  <span className="chip">Mock API</span>
                  <span className="chip">Frontent</span>
                </div>
                <span className="btn btn-primary btn-sm">Visit site ↗</span>
              </div>

              <div className="mock" aria-hidden="true">
                <div className="mock-bar"><i /><i /><i /></div>
                <div className="mock-line accent" />
                <div className="mock-line" />
                <div className="mock-line" style={{ width: '80%' }} />
                <div className="mock-block" />
              </div>
            </SpotlightCard>
          </Reveal>

        </section>

        {/* ---------- CONTACT: karta ichida nuqtalar ---------- */}
        <section id="contact" className="block">
          <div className="contact">
            <div className="dots-layer">
              <DotGrid />
            </div>

            <div className="contact-inner">
              <span className="pill">Contact</span>
              <h2><TechText text="Let's work together" box /></h2>
              <p>Need a website, a design or a full project? Write to me and we'll make it happen.</p>
              <div className="hero-actions">
                <a href={`mailto:${EMAIL}`} className="btn btn-primary">Email me</a>
                <a href={TELEGRAM} target="_blank" rel="noreferrer" className="btn btn-ghost">Telegram</a>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">© 2026 Komil Meliyev</footer>
      </div>
    </div>
  )
}

export default App