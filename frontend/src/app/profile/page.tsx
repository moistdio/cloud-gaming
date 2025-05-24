"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

interface User {
  email: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to fetch profile');
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const generateInviteCode = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/invite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteCode(response.data.inviteCode);
      toast.success('Invite code generated successfully');
    } catch (err) {
      console.error('Failed to generate invite code:', err);
      toast.error('Failed to generate invite code');
    }
  };

  return (
    <Layout>
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>

        <div className="mt-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Account Information</h3>
              <div className="mt-5 border-t border-gray-200">
                <dl className="divide-y divide-gray-200">
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Email address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {user?.email}
                    </dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Member since</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Invite Friends</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Generate an invite code to allow a friend to join the platform.</p>
              </div>
              <div className="mt-5">
                {inviteCode ? (
                  <div className="rounded-md bg-gray-50 px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Your invite code</p>
                        <p className="mt-1 text-sm text-gray-500">{inviteCode}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inviteCode);
                          toast.success('Copied to clipboard');
                        }}
                        className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={generateInviteCode}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Generate Invite Code
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 