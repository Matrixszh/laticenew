/**
 * Industries Page
 * Shows the industries we're targeting
 * Enhanced with animations and engaging UI
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '../components/Logo'
import AnimatedSection from '../components/AnimatedSection'
import FadeIn from '../components/FadeIn'

const industries = [
  {
    name: 'Healthcare',
    description: 'Streamline patient intake, appointment scheduling, and triage calls with AI-powered automation.',
    features: ['HIPAA-compliant handling', 'Appointment scheduling', 'Patient triage', 'Follow-up automation'],
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    name: 'Legal Services',
    description: 'Automate client intake, consultation scheduling, and case qualification calls.',
    features: ['Client intake forms', 'Consultation booking', 'Case qualification', 'Document collection'],
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: 'Real Estate',
    description: 'Handle property inquiries, schedule showings, and qualify leads automatically.',
    features: ['Property inquiries', 'Showing scheduling', 'Lead qualification', 'Follow-up automation'],
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Financial Services',
    description: 'Automate client onboarding, consultation scheduling, and account inquiries.',
    features: ['Client onboarding', 'Consultation booking', 'Account inquiries', 'Compliance tracking'],
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Education',
    description: 'Handle enrollment inquiries, schedule campus tours, and manage student communications.',
    features: ['Enrollment inquiries', 'Campus tour scheduling', 'Student communications', 'Parent outreach'],
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    name: 'Professional Services',
    description: 'Automate client consultations, project inquiries, and service bookings.',
    features: ['Consultation scheduling', 'Project inquiries', 'Service booking', 'Client management'],
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export default function IndustriesPage() {
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
                  className="text-black hover:text-blue-600 text-sm font-medium transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/industries"
                  className="text-blue-600 text-sm font-semibold transition-colors border-b-2 border-blue-600 pb-1"
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
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16 relative">
          <div className="text-center">
            <FadeIn delay={300}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-black mb-6 leading-tight tracking-tight">
                Industries We Serve
              </h1>
            </FadeIn>
            <FadeIn delay={500}>
              <p className="text-xl md:text-2xl text-black mb-12 max-w-3xl mx-auto leading-relaxed font-light opacity-80">
                Tailored AI solutions for industries that rely on customer communication and appointment scheduling
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry, index) => {
              const colors = [
                { border: 'border-blue-200', borderHover: 'border-blue-400', icon: 'text-blue-600', check: 'text-blue-600', bg: 'bg-blue-50/50' },
                { border: 'border-green-200', borderHover: 'border-green-400', icon: 'text-green-600', check: 'text-green-600', bg: 'bg-green-50/50' },
                { border: 'border-purple-200', borderHover: 'border-purple-400', icon: 'text-purple-600', check: 'text-purple-600', bg: 'bg-purple-50/50' },
                { border: 'border-blue-200', borderHover: 'border-blue-400', icon: 'text-blue-600', check: 'text-blue-600', bg: 'bg-blue-50/50' },
                { border: 'border-green-200', borderHover: 'border-green-400', icon: 'text-green-600', check: 'text-green-600', bg: 'bg-green-50/50' },
                { border: 'border-purple-200', borderHover: 'border-purple-400', icon: 'text-purple-600', check: 'text-purple-600', bg: 'bg-purple-50/50' },
              ][index % 6]
              return (
                <AnimatedSection key={industry.name} delay={index * 100}>
                  <div className={`group bg-white border-2 ${colors.border} rounded-2xl p-8 hover:shadow-xl hover:${colors.borderHover} transition-all duration-300 hover:scale-105`}>
                    <div className={`${colors.icon} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      {industry.icon}
                    </div>
                    <h3 className={`text-2xl font-semibold text-black mb-3 tracking-tight group-hover:${colors.icon.replace('text-', 'text-')} transition-colors`}>
                      {industry.name}
                    </h3>
                    <p className="text-black leading-relaxed font-light mb-6 opacity-80">{industry.description}</p>
                    <ul className="space-y-2">
                      {industry.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-black opacity-80">
                          <svg
                            className={`w-5 h-5 ${colors.check} mr-2 flex-shrink-0 mt-0.5`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-light">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight">
              Ready to Transform Your Customer Experience?
            </h2>
            <p className="text-xl text-white mb-10 font-light opacity-90">
              See how Lattice AI can help your industry automate customer interactions and boost efficiency.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/onboarding"
                className="inline-block bg-white text-blue-600 px-10 py-4 rounded-full text-base font-semibold hover:bg-blue-50 transition-all hover:scale-105 shadow-lg"
              >
                Get Started Now
              </Link>
              <Link
                href="/pricing"
                className="inline-block bg-transparent border-2 border-white text-white px-10 py-4 rounded-full text-base font-medium hover:bg-white hover:text-black transition-all"
              >
                View Pricing
              </Link>
            </div>
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

