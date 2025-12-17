/**
 * Pricing Page
 * Shows pricing tiers for the platform
 * Enhanced with animations, trust-building colors, and engaging UI
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '../components/Logo'
import AnimatedSection from '../components/AnimatedSection'
import FadeIn from '../components/FadeIn'

const pricingTiers = [
  {
    name: 'Tier One',
    price: '$70',
    period: 'per month',
    setupFee: '$99',
    description: 'Perfect for small teams getting started with AI automation',
    features: [
      'Up to 500 calls per month',
      'AI-powered call triage',
      'Basic appointment scheduling',
      'Email support',
      'Standard integrations',
      'Basic analytics dashboard',
    ],
    cta: 'Get Started',
    popular: false,
    color: 'blue',
  },
  {
    name: 'Tier Two',
    price: '$120',
    period: 'per month',
    setupFee: '$149',
    description: 'Ideal for growing businesses with higher call volumes',
    features: [
      'Up to 2,000 calls per month',
      'Advanced AI call triage',
      'Smart appointment scheduling',
      'Priority email support',
      'Advanced integrations',
      'Enhanced analytics dashboard',
      'Custom automation rules',
      'Multi-user access',
    ],
    cta: 'Get Started',
    popular: true,
    color: 'green',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    setupFee: 'Custom',
    description: 'Tailored solutions for large organizations with specific needs',
    features: [
      'Unlimited calls',
      'Custom AI training',
      'White-label solution',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom integrations',
      'Advanced security & compliance',
      'SLA guarantees',
      'On-premise deployment options',
    ],
    cta: 'Contact Sales',
    popular: false,
    color: 'purple',
  },
]

export default function PricingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

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
                  href="/industries"
                  className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  Industries
                </Link>
                <Link
                  href="/pricing"
                  className="text-gray-900 text-sm font-medium transition-colors border-b-2 border-blue-600 pb-1"
                >
                  Pricing
                </Link>
                <Link
                  href="/onboarding"
                  className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="/onboarding"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-full text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all hover:scale-105 shadow-lg"
                >
                  Start Now
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-green-50/30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16 relative">
          <div className="text-center">
            <FadeIn delay={300}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-black mb-6 leading-tight tracking-tight">
                Simple, Transparent Pricing
              </h1>
            </FadeIn>
            <FadeIn delay={500}>
              <p className="text-xl md:text-2xl text-black mb-12 max-w-3xl mx-auto leading-relaxed font-light opacity-80">
                Choose the plan that fits your business needs. All plans include professional setup and onboarding.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8">
            {pricingTiers.map((tier, index) => {
              const isHovered = hoveredCard === index
              const colorClasses = {
                blue: {
                  border: 'border-blue-200',
                  borderHover: 'border-blue-400',
                  bg: 'bg-blue-50',
                  text: 'text-blue-600',
                  button: 'bg-blue-600 hover:bg-blue-700',
                  badge: 'bg-blue-100 text-blue-800',
                },
                green: {
                  border: 'border-green-200',
                  borderHover: 'border-green-400',
                  bg: 'bg-green-50',
                  text: 'text-green-600',
                  button: 'bg-green-600 hover:bg-green-700',
                  badge: 'bg-green-100 text-green-800',
                },
                purple: {
                  border: 'border-purple-200',
                  borderHover: 'border-purple-400',
                  bg: 'bg-purple-50',
                  text: 'text-purple-600',
                  button: 'bg-purple-600 hover:bg-purple-700',
                  badge: 'bg-purple-100 text-purple-800',
                },
              }
              const colors = colorClasses[tier.color as keyof typeof colorClasses]

              return (
                <AnimatedSection key={tier.name} delay={index * 150}>
                  <div
                    className={`relative bg-white border-2 rounded-2xl p-8 transition-all duration-500 h-full flex flex-col ${
                      tier.popular
                        ? `${colors.borderHover} shadow-xl scale-105 ring-2 ring-offset-2 ${colors.text.replace('text-', 'ring-')}`
                        : `${colors.border} hover:${colors.borderHover} hover:shadow-xl`
                    } ${isHovered ? 'scale-105' : 'hover:scale-[1.02]'}`}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {tier.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 animate-bounce">
                        <span className={`${colors.badge} px-4 py-1 rounded-full text-xs font-semibold shadow-md`}>
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="text-center mb-8 flex-grow">
                      <div className={`inline-block ${colors.bg} rounded-lg px-3 py-1 mb-4`}>
                        <span className={`text-sm font-semibold ${colors.text}`}>{tier.name}</span>
                      </div>
                      <h3 className="text-2xl font-semibold text-black mb-2 tracking-tight">{tier.name}</h3>
                    <div className="mb-4">
                      <span className="text-5xl font-bold text-black">{tier.price}</span>
                      {tier.price !== 'Custom' && (
                        <span className="text-black text-lg font-light ml-2 opacity-80">{tier.period}</span>
                      )}
                    </div>
                    <div className="mb-4">
                      <span className="text-sm text-black font-light opacity-60">Setup Fee: </span>
                      <span className={`text-lg font-semibold ${colors.text}`}>{tier.setupFee}</span>
                    </div>
                    <p className="text-black font-light text-sm opacity-80">{tier.description}</p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow">
                      {tier.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start animate-fade-in"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <svg
                            className={`w-5 h-5 ${colors.text} mr-3 flex-shrink-0 mt-0.5`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-black font-light opacity-80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={tier.name === 'Enterprise' ? '/onboarding?plan=enterprise' : '/onboarding'}
                      className={`block w-full text-center py-3.5 px-6 rounded-full font-semibold transition-all duration-300 ${colors.button} text-white hover:scale-105 shadow-lg hover:shadow-xl transform`}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Secure & Compliant</h3>
                <p className="text-black font-light text-sm opacity-80">
                  Enterprise-grade security with SOC 2 compliance and data encryption
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">99.9% Uptime SLA</h3>
                <p className="text-black font-light text-sm opacity-80">
                  Reliable infrastructure with guaranteed uptime and 24/7 monitoring
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Expert Support</h3>
                <p className="text-black font-light text-sm opacity-80">
                  Dedicated support team ready to help you succeed with personalized guidance
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <h2 className="text-4xl font-semibold text-black mb-12 text-center tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-black/10 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                <h3 className="text-lg font-semibold text-black mb-2">Can I change plans later?</h3>
                <p className="text-black font-light opacity-80">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next
                  billing cycle.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-black/10 hover:shadow-lg transition-all duration-300 hover:border-green-300">
                <h3 className="text-lg font-semibold text-black mb-2">What happens if I exceed my call limit?</h3>
                <p className="text-black font-light opacity-80">
                  We&apos;ll notify you when you&apos;re approaching your limit. You can upgrade your plan or purchase additional
                  call credits as needed.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-black/10 hover:shadow-lg transition-all duration-300 hover:border-purple-300">
                <h3 className="text-lg font-semibold text-black mb-2">What does the setup fee include?</h3>
                <p className="text-black font-light opacity-80">
                  The setup fee covers professional configuration, integration assistance, team training, and initial
                  customization to ensure your platform is ready for production use.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-black/10 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                <h3 className="text-lg font-semibold text-black mb-2">Do you offer refunds?</h3>
                <p className="text-black font-light opacity-80">
                  We offer a 30-day money-back guarantee. If you&apos;re not satisfied within the first 30 days, we&apos;ll provide
                  a full refund of your subscription fee.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/50 to-green-800/50" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight">Ready to Get Started?</h2>
            <p className="text-xl text-blue-100 mb-10 font-light">
              Join thousands of businesses automating their customer interactions with Lattice AI
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/onboarding"
                className="inline-block bg-white text-blue-600 px-10 py-4 rounded-full text-base font-semibold hover:bg-blue-50 transition-all hover:scale-105 shadow-xl"
              >
                Get Started Now
              </Link>
              <Link
                href="/industries"
                className="inline-block bg-transparent border-2 border-white text-white px-10 py-4 rounded-full text-base font-semibold hover:bg-white hover:text-blue-600 transition-all"
              >
                View Industries
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
