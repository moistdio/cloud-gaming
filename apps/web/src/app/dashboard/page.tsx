'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark via-gaming-darker to-black">
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                Cloud<span className="text-gaming-primary">Stream</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/streaming" 
                className="bg-gaming-primary hover:bg-gaming-secondary text-white px-4 py-2 rounded-lg transition-colors"
              >
                🎮 Start Gaming
              </Link>
              <span className="text-gray-300">Welcome to CloudStream!</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-6">Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-2">Game Library</h3>
                <p className="text-gray-300 mb-4">No games available yet.</p>
                <button className="text-gaming-primary hover:text-gaming-secondary transition-colors">
                  Browse Games →
                </button>
              </div>

              <Link href="/streaming" className="bg-gray-700/50 hover:bg-gray-600/50 rounded-lg p-6 transition-colors cursor-pointer">
                <h3 className="text-xl font-semibold text-white mb-2">🎮 Cloud Gaming</h3>
                <p className="text-gray-300 mb-4">Start your personal gaming session with isolated desktop environment.</p>
                <span className="text-gaming-primary hover:text-gaming-secondary transition-colors">
                  Start Session →
                </span>
              </Link>

              <div className="bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
                <p className="text-gray-300 mb-4">Configure your preferences.</p>
                <button className="text-gaming-primary hover:text-gaming-secondary transition-colors">
                  Open Settings →
                </button>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-gaming-primary/20 to-gaming-secondary/20 rounded-lg p-6 border border-gaming-primary/30">
              <h3 className="text-xl font-semibold text-white mb-2">🚀 Get Started</h3>
              <p className="text-gray-300 mb-4">
                CloudStream provides isolated gaming environments for each user. Click "Start Gaming" to launch your personal desktop with Steam and other applications.
              </p>
              <div className="flex space-x-4">
                <Link 
                  href="/streaming" 
                  className="bg-gaming-primary hover:bg-gaming-secondary text-white px-6 py-2 rounded-lg transition-colors"
                >
                  🎮 Launch Gaming Session
                </Link>
                <button className="border border-gaming-primary text-gaming-primary hover:bg-gaming-primary hover:text-white px-6 py-2 rounded-lg transition-colors">
                  📖 View Documentation
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 