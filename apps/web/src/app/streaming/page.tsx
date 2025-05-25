'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StreamingSession {
  sessionId: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped';
  vncPort: number;
  sunshinePort: number;
  createdAt: string;
  lastActivity: string;
}

export default function StreamingPage() {
  const [sessions, setSessions] = useState<StreamingSession[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');
  const [currentSession, setCurrentSession] = useState<StreamingSession | null>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:7001`;
  const ORCHESTRATOR_URL = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:7003`;
  const SERVER_IP = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${ORCHESTRATOR_URL}/api/streaming/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
        
        // Set current session if there's an active one
        const activeSession = data.sessions.find((s: StreamingSession) => 
          s.status === 'running' || s.status === 'starting'
        );
        setCurrentSession(activeSession || null);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const startSession = async () => {
    setIsStarting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${ORCHESTRATOR_URL}/api/streaming/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quality: '1080p',
          fps: 60
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSession({
          sessionId: data.sessionId,
          status: data.status,
          vncPort: data.vncPort,
          sunshinePort: data.sunshinePort,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        });
        fetchSessions();
      } else {
        setError(data.error || 'Failed to start session');
      }
    } catch (error) {
      setError('Failed to start streaming session');
      console.error('Error starting session:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const stopSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${ORCHESTRATOR_URL}/api/streaming/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        setCurrentSession(null);
        fetchSessions();
      }
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  };

  const openVNC = (port: number) => {
    window.open(`http://${SERVER_IP}:${port}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-500';
      case 'starting': return 'text-yellow-500';
      case 'stopping': return 'text-orange-500';
      case 'stopped': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🟢';
      case 'starting': return '🟡';
      case 'stopping': return '🟠';
      case 'stopped': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎮 CloudStream Gaming
          </h1>
          <p className="text-slate-300 text-lg">
            Your personal cloud gaming instance
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Current Session */}
        {currentSession ? (
          <div className="gaming-card p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Active Session</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getStatusIcon(currentSession.status)}</span>
                  <span className={`font-semibold ${getStatusColor(currentSession.status)}`}>
                    {currentSession.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="text-slate-300">
                  <p><strong>Session ID:</strong> {currentSession.sessionId.slice(0, 8)}...</p>
                  <p><strong>VNC Port:</strong> {currentSession.vncPort}</p>
                  <p><strong>Sunshine Port:</strong> {currentSession.sunshinePort}</p>
                </div>

                {currentSession.status === 'running' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => openVNC(currentSession.vncPort)}
                      className="w-full gaming-button text-white font-semibold py-3 px-6 rounded-lg"
                    >
                      🖥️ Connect via VNC
                    </button>
                    
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>VNC URL: {SERVER_IP}:{currentSession.vncPort}</p>
                      <p>Sunshine URL: {SERVER_IP}:{currentSession.sunshinePort}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => stopSession(currentSession.sessionId)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  🛑 Stop Session
                </button>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Connection Info</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Server:</span>
                    <span className="font-mono">{SERVER_IP}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VNC Port:</span>
                    <span className="font-mono">{currentSession.vncPort}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunshine Port:</span>
                    <span className="font-mono">{currentSession.sunshinePort}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span>1080p @ 60fps</span>
                  </div>
                </div>

                {currentSession.status === 'running' && (
                  <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <p className="text-green-200 text-sm">
                      ✅ Your gaming session is ready! Use VNC to connect to your desktop.
                    </p>
                  </div>
                )}

                {currentSession.status === 'starting' && (
                  <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                    <p className="text-yellow-200 text-sm">
                      ⏳ Starting your gaming session... This may take up to 30 seconds.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="gaming-card p-8 text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">No Active Session</h2>
            <p className="text-slate-300 mb-6">
              Start a new gaming session to access your personal cloud desktop
            </p>
            <button
              onClick={startSession}
              disabled={isStarting}
              className="gaming-button text-white font-semibold py-4 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? '🚀 Starting Session...' : '🎮 Start Gaming Session'}
            </button>
          </div>
        )}

        {/* Session History */}
        {sessions.length > 0 && (
          <div className="gaming-card p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Session History</h2>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-xl">{getStatusIcon(session.status)}</span>
                    <div>
                      <p className="text-white font-medium">
                        Session {session.sessionId.slice(0, 8)}...
                      </p>
                      <p className="text-slate-400 text-sm">
                        Created: {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getStatusColor(session.status)}`}>
                      {session.status.toUpperCase()}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Port: {session.vncPort}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="gaming-card p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">How to Connect</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🖥️ VNC Connection</h3>
              <ul className="space-y-2 text-sm">
                <li>• Click "Connect via VNC" button above</li>
                <li>• Or use any VNC client with the provided URL</li>
                <li>• No password required</li>
                <li>• Full desktop access with applications</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🎮 Gaming Features</h3>
              <ul className="space-y-2 text-sm">
                <li>• Steam pre-installed</li>
                <li>• Hardware-accelerated graphics</li>
                <li>• Low-latency streaming</li>
                <li>• Isolated personal environment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 