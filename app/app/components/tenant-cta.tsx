'use client'

export function TenantLinkCallout({ message }: { message?: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 space-y-2">
      <p className="text-sm font-semibold">
        {message || 'You are not linked to a business yet.'}
      </p>
      <p className="text-sm">
        To continue, complete onboarding or finish setup:
        <span className="ml-2 space-x-3">
          <a href="/onboarding" className="text-amber-900 underline">
            Go to onboarding
          </a>
          <a href="/setup" className="text-amber-900 underline">
            Go to setup
          </a>
        </span>
      </p>
    </div>
  )
}
