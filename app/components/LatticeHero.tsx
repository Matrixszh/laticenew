'use client'

import { useEffect, useRef, useState } from 'react'

interface Node {
  x: number
  y: number
  z: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  radius: number
  glow: number
  isPhone?: boolean
  isCalendar?: boolean
}

interface Link {
  from: number
  to: number
  strength: number
  pulse: number
}

export default function LatticeHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const nodesRef = useRef<Node[]>([])
  const linksRef = useRef<Link[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const mouseRef = useRef({ x: 0, y: 0 })
  const storyTimerRef = useRef<number>()
  const pulseRef = useRef<{ active: boolean; path: number[]; progress: number }>({
    active: false,
    path: [],
    progress: 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = Math.min(window.innerHeight * 0.8, 800)
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialize nodes (120-300 nodes in a loose grid)
    const nodeCount = Math.floor(Math.random() * 180 + 120)
    const nodes: Node[] = []
    const cols = Math.ceil(Math.sqrt(nodeCount))
    const rows = Math.ceil(nodeCount / cols)
    const spacingX = canvas.width / (cols + 1)
    const spacingY = canvas.height / (rows + 1)

    for (let i = 0; i < nodeCount; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const baseX = spacingX * (col + 1) + (Math.random() - 0.5) * spacingX * 0.3
      const baseY = spacingY * (row + 1) + (Math.random() - 0.5) * spacingY * 0.3
      const z = Math.random() * 100 - 50 // Depth from -50 to 50

      nodes.push({
        x: baseX,
        y: baseY,
        z,
        baseX,
        baseY,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: 2 + (50 + z) / 50, // Size varies by depth
        glow: 0,
        isPhone: i === Math.floor(nodeCount * 0.1), // Left edge phone node
        isCalendar: i === Math.floor(nodeCount * 0.9), // Right edge calendar node
      })
    }
    nodesRef.current = nodes

    // Create links (triangular/quad mesh)
    const links: Link[] = []
    const maxDistance = Math.min(spacingX, spacingY) * 1.5

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].baseX - nodes[j].baseX
        const dy = nodes[i].baseY - nodes[j].baseY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < maxDistance && Math.random() > 0.7) {
          links.push({
            from: i,
            to: j,
            strength: 1 - dist / maxDistance,
            pulse: 0,
          })
        }
      }
    }
    linksRef.current = links

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
    canvas.addEventListener('mousemove', handleMouseMove)

    // Story mode: pulse animation every 8-12 seconds
    const triggerStory = () => {
      if (pulseRef.current.active) return

      const phoneNode = nodes.findIndex((n) => n.isPhone)
      const calendarNode = nodes.findIndex((n) => n.isCalendar)
      if (phoneNode === -1 || calendarNode === -1) return

      // Simple pathfinding: find shortest path
      const visited = new Set<number>()
      const queue: { node: number; path: number[] }[] = [{ node: phoneNode, path: [phoneNode] }]

      while (queue.length > 0) {
        const { node, path } = queue.shift()!
        if (node === calendarNode) {
          pulseRef.current = { active: true, path, progress: 0 }
          break
        }
        if (visited.has(node)) continue
        visited.add(node)

        // Add neighbors to queue
        links.forEach((link) => {
          if (link.from === node && !visited.has(link.to)) {
            queue.push({ node: link.to, path: [...path, link.to] })
          } else if (link.to === node && !visited.has(link.from)) {
            queue.push({ node: link.from, path: [...path, link.from] })
          }
        })
      }
    }

    storyTimerRef.current = window.setInterval(triggerStory, 10000 + Math.random() * 4000)

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Vignette and center clarity window
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      )
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const nodes = nodesRef.current
      const links = linksRef.current

      // Update nodes (drift + mouse attraction)
      nodes.forEach((node, i) => {
        // Idle drift
        node.x += node.vx
        node.y += node.vy

        // Boundary bounce
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1

        // Mouse attraction (spring physics)
        const dx = mouseRef.current.x - node.x
        const dy = mouseRef.current.y - node.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150
          node.x += dx * force * 0.02
          node.y += dy * force * 0.02
        }

        // Return to base position (spring)
        node.x += (node.baseX - node.x) * 0.02
        node.y += (node.baseY - node.y) * 0.02

        // Decay glow
        node.glow *= 0.95
      })

      // Update links
      links.forEach((link) => {
        link.pulse *= 0.9
      })

      // Story mode pulse
      if (pulseRef.current.active) {
        const { path, progress } = pulseRef.current
        const segmentProgress = progress * (path.length - 1)
        const currentSegment = Math.floor(segmentProgress)
        const t = segmentProgress - currentSegment

          if (currentSegment < path.length - 1) {
          const fromNode = nodes[path[currentSegment]]
          const toNode = nodes[path[currentSegment + 1]]
          const link = links.find(
            (l) =>
              (l.from === path[currentSegment] && l.to === path[currentSegment + 1]) ||
              (l.to === path[currentSegment] && l.from === path[currentSegment + 1])
          )

          if (link) {
            link.pulse = 1
            fromNode.glow = 1 - t
            toNode.glow = t
          }

          pulseRef.current.progress += 0.02
          if (pulseRef.current.progress >= 1) {
            // Pulse complete - show calendar shape and trigger CTA glow
            const calendarNode = nodes[path[path.length - 1]]
            calendarNode.glow = 1
            
            // Trigger CTA glow
            const cta = document.getElementById('hero-cta')
            if (cta) {
              cta.classList.add('animate-pulse')
              setTimeout(() => cta.classList.remove('animate-pulse'), 2000)
            }
            
            setTimeout(() => {
              pulseRef.current = { active: false, path: [], progress: 0 }
            }, 1000)
          }
        }
      }

      // Draw links (graphite lines, fade with distance)
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.15)'
      ctx.lineWidth = 0.5
      links.forEach((link) => {
        const from = nodes[link.from]
        const to = nodes[link.to]

        // Calculate depth-based opacity
        const avgZ = (from.z + to.z) / 2
        const opacity = Math.max(0.05, 0.2 - Math.abs(avgZ) / 200)

        // Pulse color
        if (link.pulse > 0) {
          const pulseColor = `rgba(59, 130, 246, ${opacity + link.pulse * 0.8})` // Blue pulse
          ctx.strokeStyle = pulseColor
        } else {
          ctx.strokeStyle = `rgba(100, 100, 100, ${opacity})`
        }

        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
      })

      // Draw nodes (with glow and size by depth)
      nodes.forEach((node) => {
        const size = node.radius * (1 + Math.abs(node.z) / 100)
        const glowIntensity = node.glow

        // Glow effect
        if (glowIntensity > 0) {
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 3)
          gradient.addColorStop(0, `rgba(59, 130, 246, ${glowIntensity * 0.8})`)
          gradient.addColorStop(0.5, `rgba(59, 130, 246, ${glowIntensity * 0.4})`)
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(node.x, node.y, size * 3, 0, Math.PI * 2)
          ctx.fill()
        }

        // Node circle
        ctx.fillStyle = node.isPhone || node.isCalendar
          ? `rgba(59, 130, 246, ${0.6 + glowIntensity * 0.4})`
          : `rgba(150, 150, 150, ${0.3 + Math.abs(node.z) / 200})`
        ctx.beginPath()
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
        ctx.fill()

        // Icon for phone/calendar
        if (node.isPhone && glowIntensity > 0.5) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.font = `${size * 2}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('📞', node.x, node.y)
        }
        if (node.isCalendar && glowIntensity > 0.5) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.font = `${size * 2}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('📅', node.x, node.y)
        }
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()
    setIsLoaded(true)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (storyTimerRef.current) clearInterval(storyTimerRef.current)
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: '#0a0a0a' }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

