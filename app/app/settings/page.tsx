/**
 * Settings Page
 * Basic profile settings
 */

import { currentUser } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { BusinessSettingsCard } from './business-settings'

export default async function SettingsPage() {
  const user = await currentUser()

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
              <p className="text-sm text-gray-500">Manage your account settings</p>
            </div>
            <UserButton />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.emailAddresses[0]?.emailAddress}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{user?.id}</p>
            </div>
          </div>
        </div>

        <BusinessSettingsCard />
      </div>
    </div>
  )
}

