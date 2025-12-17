/**
 * Public Landing/Marketing Page
 * Platform-facing: Always accessible, no authentication required
 * Design inspired by Apple.com - clean, minimal, elegant with animations
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from './components/Logo'
import AnimatedSection from './components/AnimatedSection'
import FadeIn from './components/FadeIn'

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`bg-white/90 backdrop-blur-md border-b border-black/10 sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <FadeIn delay={100}>
                <Logo />
              </FadeIn>
            </Link>
            <FadeIn delay={200}>
              <div className="flex items-center space-x-8">
                <Link
                  href="/"
                  className="text-blue-600 text-sm font-semibold transition-colors border-b-2 border-blue-600 pb-1"
                >
                  Home
                </Link>
                <Link
                  href="/industries"
                  className="text-black hover:text-blue-600 text-sm font-medium transition-colors"
                >
                  Industries
                </Link>
                <Link
                  href="/pricing"
                  className="text-black hover:text-blue-600 text-sm font-medium transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/onboarding"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all hover:scale-105 shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-32">
          <div className="text-center">
            <FadeIn delay={300}>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold text-white mb-6 leading-tight tracking-tight">
                AI Triage
                <br />
                <span className="text-white">Booking</span>
                <br />
                <span className="text-white">Handover</span>
              </h1>
            </FadeIn>
            <FadeIn delay={500}>
              <p className="text-xl md:text-2xl text-white mb-12 max-w-2xl mx-auto leading-relaxed font-light opacity-90">
                Automate customer interactions with AI-powered triage, intelligent booking,
                and seamless handover to your team.
              </p>
            </FadeIn>
            <FadeIn delay={700}>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link
                  href="/onboarding"
                  className="bg-white text-black px-8 py-3.5 rounded-full text-base font-semibold hover:bg-white/90 transition-all hover:scale-105 shadow-xl"
                >
                  Get Started
                </Link>
                <Link
                  href="#features"
                  className="text-white hover:text-white/80 px-8 py-3.5 text-base font-medium transition-colors border-2 border-white/30 hover:border-white/60 rounded-full"
                >
                  Learn more
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-semibold text-black mb-4 tracking-tight">
                Everything you need
              </h2>
              <p className="text-xl text-black max-w-2xl mx-auto font-light opacity-80">
                A complete platform for managing customer interactions from first contact to handover
              </p>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <AnimatedSection delay={100}>
              <div className="group bg-white rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="h-1 w-16 bg-blue-600 mb-6 transition-all duration-500 group-hover:w-24 rounded-full" />
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-black mb-4 tracking-tight group-hover:text-blue-600 transition-colors">
                  AI Triage
                </h3>
                <p className="text-lg text-black leading-relaxed font-light opacity-80">
                  Intelligent call routing and qualification using AI to understand customer intent
                  and route to the right team member automatically.
                </p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <div className="group bg-white rounded-2xl p-8 border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="h-1 w-16 bg-green-600 mb-6 transition-all duration-500 group-hover:w-24 rounded-full" />
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-black mb-4 tracking-tight group-hover:text-green-600 transition-colors">
                  Smart Booking
                </h3>
                <p className="text-lg text-black leading-relaxed font-light opacity-80">
                  Automated appointment scheduling with conflict detection, timezone-aware
                  calendar management, and intelligent slot suggestions.
                </p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={300}>
              <div className="group bg-white rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="h-1 w-16 bg-purple-600 mb-6 transition-all duration-500 group-hover:w-24 rounded-full" />
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-black mb-4 tracking-tight group-hover:text-purple-600 transition-colors">
                  Human Handover
                </h3>
                <p className="text-lg text-black leading-relaxed font-light opacity-80">
                  Seamless transition from AI to human agents with full context, conversation
                  history, and intelligent routing preserved.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-semibold text-black mb-4 tracking-tight">
                How it works
              </h2>
              <p className="text-xl text-black font-light opacity-80">Simple, powerful, and seamless</p>
            </div>
          </AnimatedSection>
          <div className="space-y-24 max-w-4xl mx-auto">
            <AnimatedSection delay={100}>
              <div className="flex flex-col md:flex-row items-start gap-12 group bg-white rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-2xl transition-transform duration-300 group-hover:scale-110 shadow-lg">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-semibold text-black mb-4 tracking-tight group-hover:text-blue-600 transition-colors">AI Handles Initial Contact</h3>
                  <p className="text-lg text-black leading-relaxed font-light opacity-80">
                    When a customer calls, our AI agent answers, understands their needs through natural
                    conversation, and collects all relevant information automatically.
                  </p>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <div className="flex flex-col md:flex-row items-start gap-12 group bg-white rounded-2xl p-8 border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-lg">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-2xl transition-transform duration-300 group-hover:scale-110 shadow-lg">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-semibold text-black mb-4 tracking-tight group-hover:text-green-600 transition-colors">Intelligent Routing</h3>
                  <p className="text-lg text-black leading-relaxed font-light opacity-80">
                    Based on the conversation context, the AI routes the call to the right team member
                    or schedules an appointment at the optimal time for both parties.
                  </p>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={300}>
              <div className="flex flex-col md:flex-row items-start gap-12 group bg-white rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-lg">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-2xl transition-transform duration-300 group-hover:scale-110 shadow-lg">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-semibold text-black mb-4 tracking-tight group-hover:text-purple-600 transition-colors">Seamless Handover</h3>
                  <p className="text-lg text-black leading-relaxed font-light opacity-80">
                    Your team receives the full conversation transcript, context, and customer information,
                    allowing them to pick up exactly where the AI left off with zero friction.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-black text-white relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-5xl md:text-6xl font-semibold mb-6 tracking-tight">Ready to get started?</h2>
            <p className="text-xl text-white mb-12 font-light opacity-90">
              Set up your Lattice AI platform in minutes and start automating your customer interactions today.
            </p>
            <Link
              href="/onboarding"
              className="inline-block bg-white text-black px-10 py-4 rounded-full text-base font-semibold hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
            >
              Start Onboarding
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-black/10 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo />
            <div className="flex space-x-8 mt-4 md:mt-0">
              <Link href="/" className="text-black hover:text-blue-600 text-sm font-light transition-colors">
                Home
              </Link>
              <Link href="/industries" className="text-black hover:text-blue-600 text-sm font-light transition-colors">
                Industries
              </Link>
              <Link href="/pricing" className="text-black hover:text-blue-600 text-sm font-light transition-colors">
                Pricing
              </Link>
              <Link href="/onboarding" className="text-black hover:text-blue-600 text-sm font-light transition-colors">
                Get Started
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-black/10 text-center text-black text-sm font-light opacity-60">
            <p>Copyright © 2025 Lattice AI Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
