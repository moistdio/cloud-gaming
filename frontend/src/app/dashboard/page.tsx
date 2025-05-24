"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import Layout from '../components/Layout';
import { getApiUrl } from '@/utils/api';

interface Instance {
  id: string;
  status: string;
  containerId: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInstanceStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(getApiUrl('/api/instances/status'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInstance(response.data);
    } catch (err) {
      console.error('Error fetching instance status:', err);
      toast.error('Failed to fetch instance status');
    }
  }, [router]);

  useEffect(() => {
    fetchInstanceStatus();
    const interval = setInterval(fetchInstanceStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchInstanceStatus]);

  const startInstance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        getApiUrl('/api/instances/start'),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Starting Steam instance...');
      await fetchInstanceStatus();
    } catch (err) {
      console.error('Failed to start instance:', err);
      toast.error('Failed to start instance');
    }
    setLoading(false);
  };

  const stopInstance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        getApiUrl('/api/instances/stop'),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Stopping Steam instance...');
      await fetchInstanceStatus();
    } catch (err) {
      console.error('Failed to stop instance:', err);
      toast.error('Failed to stop instance');
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Steam Instance Dashboard</h1>
        
        <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Instance Status</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {instance?.status ? instance.status.charAt(0).toUpperCase() + instance.status.slice(1) : 'Loading...'}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={startInstance}
                  disabled={loading || instance?.status === 'running'}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading || instance?.status === 'running'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Start
                </button>
                <button
                  onClick={stopInstance}
                  disabled={loading || instance?.status !== 'running'}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading || instance?.status !== 'running'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <StopIcon className="h-5 w-5 mr-2" />
                  Stop
                </button>
              </div>
            </div>
          </div>
        </div>

        {instance?.status === 'running' && (
          <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Connection Information</h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Your Steam instance is running. You can connect using either Moonlight or VNC:
                </p>
                <div className="mt-4 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900">Moonlight Connection</h4>
                    <ul className="mt-2 list-disc list-inside text-sm text-gray-500">
                      <li>Open Moonlight on your device</li>
                      <li>Add your server&apos;s IP address: <span className="font-mono bg-gray-100 px-2 py-1 rounded">148.251.51.138</span></li>
                      <li>Connection port: <span className="font-mono bg-gray-100 px-2 py-1 rounded">7600</span></li>
                      <li>Select the Steam streaming session</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900">VNC Connection (Alternative)</h4>
                    <ul className="mt-2 list-disc list-inside text-sm text-gray-500">
                      <li>Use any VNC client</li>
                      <li>Connect to: <span className="font-mono bg-gray-100 px-2 py-1 rounded">148.251.51.138:7700</span></li>
                      <li>No password required</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-yellow-800">⚠️ Note</h4>
                    <p className="mt-1 text-sm text-yellow-700">
                      For the best gaming experience, we recommend using Moonlight over VNC. VNC is provided as a fallback option for troubleshooting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 