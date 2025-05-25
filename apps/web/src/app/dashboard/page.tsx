'use client';

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
                <p className="text-gray-300">No games available yet.</p>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-2">Streaming</h3>
                <p className="text-gray-300">Start a gaming session.</p>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
                <p className="text-gray-300">Configure your preferences.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 