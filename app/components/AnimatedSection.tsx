'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export default function AnimatedSection({ children, className = '', delay = 0 }: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      // Fallback: make visible immediately if ref fails
      setIsVisible(true)
      return
    }

    // Fallback timeout in case IntersectionObserver doesn't fire
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true)
    }, delay + 100)

    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            clearTimeout(fallbackTimer)
            setTimeout(() => setIsVisible(true), delay)
          }
        },
        { threshold: 0.1 }
      )

      observer.observe(element)

      return () => {
        clearTimeout(fallbackTimer)
        observer.unobserve(element)
      }
    } catch (error) {
      // If IntersectionObserver fails, just show content
      clearTimeout(fallbackTimer)
      setIsVisible(true)
    }
  }, [delay])

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  )
}

