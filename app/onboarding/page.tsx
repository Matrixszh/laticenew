/**
 * Onboarding Page
 * Platform-facing: Public page for new users to sign up and get started
 * Enhanced with animations and engaging UI
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '../components/Logo'
import FadeIn from '../components/FadeIn'
import AnimatedSection from '../components/AnimatedSection'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    industry: '',
    useCase: '',
    teamSize: '',
    expectedVolume: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const steps = [
    {
      title: 'Welcome to Lattice AI',
      description: 'Let&apos;s get you set up in just a few steps',
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            Lattice AI helps you automate customer interactions, manage appointments, and seamlessly
            hand over conversations to your team.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 font-light">
              <strong className="font-medium">What you&apos;ll need:</strong> About 10 minutes and basic information about your business.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Tell Us About Your Business',
      description: 'Help us understand your needs',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/80 text-gray-900 placeholder-gray-400 caret-black focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder="Acme Inc."
              required
            />
            {fieldErrors.companyName && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.companyName[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/80 text-gray-900 placeholder-gray-400 caret-black focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder="you@company.com"
              required
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/80 text-gray-900 placeholder-gray-400 caret-black focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/80 text-gray-900 caret-black focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
            >
              <option value="">Select an industry</option>
              <option value="healthcare">Healthcare</option>
              <option value="legal">Legal</option>
              <option value="real-estate">Real Estate</option>
              <option value="financial">Financial Services</option>
              <option value="education">Education</option>
              <option value="retail">Retail</option>
              <option value="other">Other</option>
            </select>
            {fieldErrors.industry && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.industry[0]}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'How Will You Use Lattice?',
      description: 'Help us customize your experience',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Use Case <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/80 text-gray-900 caret-black focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
            >
              <option value="">Select a use case</option>
              <option value="appointments">Appointment Scheduling</option>
              <option value="support">Customer Support</option>
              <option value="sales">Sales Qualification</option>
              <option value="intake">Client Intake</option>
              <option value="other">Other</option>
            </select>
            {fieldErrors.useCase && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.useCase[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Size <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.teamSize}
              onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/80 text-gray-900 caret-black focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
            >
              <option value="">Select team size</option>
              <option value="1-5">1-5 people</option>
              <option value="6-20">6-20 people</option>
              <option value="21-50">21-50 people</option>
              <option value="51-100">51-100 people</option>
              <option value="100+">100+ people</option>
            </select>
            {fieldErrors.teamSize && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.teamSize[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Call Volume <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.expectedVolume}
              onChange={(e) => setFormData({ ...formData, expectedVolume: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/80 text-gray-900 caret-black focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
            >
              <option value="">Select volume</option>
              <option value="<10">Less than 10 calls/day</option>
              <option value="10-50">10-50 calls/day</option>
              <option value="50-100">50-100 calls/day</option>
              <option value="100+">100+ calls/day</option>
            </select>
            {fieldErrors.expectedVolume && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.expectedVolume[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/80 text-gray-900 placeholder-gray-400 caret-black focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              rows={4}
              placeholder="Tell us anything else that would help us serve you better..."
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Next Steps',
      description: 'What happens after you submit',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 font-light leading-relaxed">
            After you submit this form, you&apos;ll receive:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 font-light">
            <li>Access to the setup guide with step-by-step instructions</li>
            <li>Your onboarding data will be stored in Airtable (if configured)</li>
            <li>You&apos;ll appear as a new lead in the dashboard</li>
            <li>Our team will reach out to help you get started</li>
          </ul>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 font-light">
              <strong className="font-medium">Note:</strong> Your information will be stored securely and used only to help you get started with Lattice AI.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const handleSubmit = async () => {
    // Client-side validation mirroring server schema
    const newFieldErrors: Record<string, string[]> = {}
    if (!formData.companyName?.trim()) {
      newFieldErrors.companyName = ['Company name is required']
    }
    if (!formData.email?.trim()) {
      newFieldErrors.email = ['Valid email is required']
    }
    if (!formData.industry) {
      newFieldErrors.industry = ['Industry is required']
    }
    if (!formData.useCase) {
      newFieldErrors.useCase = ['Use case is required']
    }
    if (!formData.teamSize) {
      newFieldErrors.teamSize = ['Team size is required']
    }
    if (!formData.expectedVolume) {
      newFieldErrors.expectedVolume = ['Expected volume is required']
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors)
      return
    }

    setFieldErrors({})

    setSubmitting(true)
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API error:', errorData)
        if (errorData.fieldErrors) {
          setFieldErrors(errorData.fieldErrors)
        } else {
          alert(`Error: ${errorData.error || 'Failed to submit form. Please try again.'}`)
        }
        return
      }

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
      } else {
        console.error('Submission failed:', data)
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors)
        } else {
          alert(data.error || 'There was an error submitting your form. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('There was an error submitting your form. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <FadeIn>
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-lg">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 tracking-tight">Thank You</h2>
            <p className="text-gray-600 mb-8 font-light leading-relaxed">
              We&apos;ve received your information and will be in touch soon.
            </p>
            <div className="space-y-3">
              <Link
                href="/setup"
                className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all hover:scale-105 shadow-lg"
              >
                Go to Setup Guide
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-full font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors border-2 border-gray-200 hover:border-blue-300"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <Logo />
            </Link>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Onboarding Content */}
      <div className="relative max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-100/70 via-white to-gray-50/80 blur-3xl" />

        {/* Progress */}
        <AnimatedSection>
          <div className="mb-12">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-500 font-light">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div
                className="bg-black h-1 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </AnimatedSection>

        {/* Current Step */}
        <AnimatedSection key={currentStep}>
          <div className="relative bg-white/90 border border-gray-200 rounded-3xl p-12 mb-8 shadow-xl shadow-gray-200/60 backdrop-blur">
            <div className="absolute inset-0 rounded-3xl border border-white/60 pointer-events-none" />
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-3 tracking-tight">
              {steps[currentStep].title}
            </h2>
            <p className="text-xl text-gray-600 mb-10 font-light">{steps[currentStep].description}</p>
            <div className="prose max-w-none">{steps[currentStep].content}</div>
          </div>
        </AnimatedSection>

        {/* Navigation Buttons */}
        <AnimatedSection>
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
            >
              Previous
            </button>
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => {
                  // Basic validation for step 1 (business info)
                  if (currentStep === 1) {
                    if (!formData.companyName?.trim() || !formData.email?.trim()) {
                      alert('Please fill in Company Name and Email before continuing')
                      return
                    }
                  }
                  setCurrentStep(currentStep + 1)
                }}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all hover:scale-105 shadow-lg"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
