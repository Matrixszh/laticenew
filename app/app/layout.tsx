import { ClerkProvider } from '@clerk/nextjs'
import { isAuthReady, isSetupReady } from '@/lib/config'
import '../globals.css'
import SetupBanner from './setup-banner'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authReady = isAuthReady()
  const setupReady = isSetupReady()

  const content = (
    <div className="min-h-screen bg-gray-50">
      {!setupReady && <SetupBanner />}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Lattice AI Platform</h1>
            </div>
            <div className="flex items-center">
              <a
                href="/app/settings"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Settings
              </a>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )

  // Only wrap with ClerkProvider if auth is configured
  if (authReady) {
    return <ClerkProvider>{content}</ClerkProvider>
  }

  return content
}

