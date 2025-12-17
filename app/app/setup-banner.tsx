/**
 * Setup Banner Component
 * Shows when setup is incomplete
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SetupBanner() {
  const [setupReady, setSetupReady] = useState(true)

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch('/api/health')
        const data = await response.json()
        setSetupReady(data.setupReady ?? false)
      } catch {
        setSetupReady(false)
      }
    }

    checkStatus()
  }, [])

  if (setupReady) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-yellow-800 text-sm font-medium">
              Setup incomplete →
            </span>
            <span className="ml-2 text-yellow-700 text-sm">
              Configure environment variables to enable full functionality
            </span>
          </div>
          <Link
            href="/setup"
            className="ml-4 bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
          >
            Go to Setup
          </Link>
        </div>
      </div>
    </div>
  )
}

