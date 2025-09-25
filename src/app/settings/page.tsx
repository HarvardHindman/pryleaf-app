// Server component for better SEO and performance
import ThemeToggle from "@/components/ThemeToggle";

export default function SettingsPage() {
  return (
    <div className="h-full p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--clr-primary-a50)' }}
            >
              Settings
            </h1>
            <p 
              className="text-lg"
              style={{ color: 'var(--clr-primary-a40)' }}
            >
              Customize your Pryleaf experience
            </p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-8">
            {/* Appearance Section */}
            <div 
              className="rounded-lg shadow-sm border p-6"
              style={{ 
                backgroundColor: 'var(--clr-surface-a0)',
                borderColor: 'var(--clr-surface-a30)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 
                    className="text-xl font-semibold mb-2"
                    style={{ color: 'var(--clr-primary-a50)' }}
                  >
                    Appearance
                  </h2>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--clr-primary-a40)' }}
                  >
                    Customize how Pryleaf looks and feels
                  </p>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 
                      className="text-base font-medium"
                      style={{ color: 'var(--clr-primary-a50)' }}
                    >
                      Theme
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--clr-primary-a40)' }}
                    >
                      Switch between light and dark mode
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div 
              className="rounded-lg shadow-sm border p-6"
              style={{ 
                backgroundColor: 'var(--clr-surface-a0)',
                borderColor: 'var(--clr-surface-a30)'
              }}
            >
              <h2 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--clr-primary-a50)' }}
              >
                Notifications
              </h2>
              <p 
                className="text-sm mb-6"
                style={{ color: 'var(--clr-primary-a40)' }}
              >
                Manage your notification preferences
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 
                      className="text-base font-medium"
                      style={{ color: 'var(--clr-primary-a50)' }}
                    >
                      Trading Alerts
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--clr-primary-a40)' }}
                    >
                      Get notified about market movements
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 
                      className="text-base font-medium"
                      style={{ color: 'var(--clr-primary-a50)' }}
                    >
                      Chat Messages
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--clr-primary-a40)' }}
                    >
                      Get notified about new chat messages
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy Section */}
            <div 
              className="rounded-lg shadow-sm border p-6"
              style={{ 
                backgroundColor: 'var(--clr-surface-a0)',
                borderColor: 'var(--clr-surface-a30)'
              }}
            >
              <h2 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--clr-primary-a50)' }}
              >
                Privacy & Security
              </h2>
              <p 
                className="text-sm mb-6"
                style={{ color: 'var(--clr-primary-a40)' }}
              >
                Control your privacy and security settings
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 
                      className="text-base font-medium"
                      style={{ color: 'var(--clr-primary-a50)' }}
                    >
                      Profile Visibility
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--clr-primary-a40)' }}
                    >
                      Make your profile visible to other users
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}