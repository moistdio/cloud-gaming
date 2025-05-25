import React from 'react';
import Link from 'next/link';
import { Play, Gamepad2, Monitor, Zap, Shield, Users, ArrowRight, Github, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CloudStream</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                How it Works
              </Link>
              <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/docs" className="text-gray-300 hover:text-white transition-colors">
                Docs
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                href="/auth/login" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/register" 
                className="gaming-button px-4 py-2 rounded-lg text-white font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Stream Your Games
              <span className="block bg-gradient-to-r from-gaming-primary to-gaming-secondary bg-clip-text text-transparent">
                From Anywhere
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              CloudStream brings your entire Steam library to any device. 
              Self-hosted, secure, and blazingly fast cloud gaming platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/auth/register" 
                className="gaming-button px-8 py-4 rounded-lg text-white font-semibold text-lg flex items-center gap-2"
              >
                Start Gaming Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link 
                href="/demo" 
                className="px-8 py-4 rounded-lg border border-gray-600 text-white font-semibold text-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>10K+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                <span>Open Source</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose CloudStream?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Built for gamers, by gamers. Experience the future of cloud gaming with our cutting-edge platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="gaming-card p-8 text-center group hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Ultra Low Latency</h3>
              <p className="text-gray-300">
                Experience gaming with minimal input lag. Our optimized streaming technology delivers near-native performance.
              </p>
            </div>

            <div className="gaming-card p-8 text-center group hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Any Device</h3>
              <p className="text-gray-300">
                Play on desktop, mobile, tablet, or smart TV. Your games follow you wherever you go.
              </p>
            </div>

            <div className="gaming-card p-8 text-center group hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Self-Hosted</h3>
              <p className="text-gray-300">
                Keep your data private and secure. Host on your own infrastructure with full control.
              </p>
            </div>

            <div className="gaming-card p-8 text-center group hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Steam Integration</h3>
              <p className="text-gray-300">
                Seamlessly sync your entire Steam library. All your games, saves, and achievements in one place.
              </p>
            </div>

            <div className="gaming-card p-8 text-center group hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Multi-User</h3>
              <p className="text-gray-300">
                Share your gaming server with family and friends. Manage users and permissions easily.
              </p>
            </div>

            <div className="gaming-card p-8 text-center group hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">4K Streaming</h3>
              <p className="text-gray-300">
                Stream in up to 4K resolution at 60fps. Experience your games in stunning detail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get started with CloudStream in just a few simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Deploy Server</h3>
              <p className="text-gray-300">
                Set up your CloudStream server using Docker. One command deployment with our automated installer.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Connect Steam</h3>
              <p className="text-gray-300">
                Link your Steam account to automatically sync your game library and preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Start Gaming</h3>
              <p className="text-gray-300">
                Access your games from any device through our web interface or mobile app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Gaming?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of gamers who have already made the switch to cloud gaming with CloudStream.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register" 
                className="gaming-button px-8 py-4 rounded-lg text-white font-semibold text-lg"
              >
                Get Started Free
              </Link>
              <Link 
                href="/docs" 
                className="px-8 py-4 rounded-lg border border-gray-600 text-white font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-gaming-primary to-gaming-secondary rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">CloudStream</span>
              </div>
              <p className="text-gray-400">
                The future of cloud gaming is here. Stream your games from anywhere, anytime.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="/roadmap" className="hover:text-white transition-colors">Roadmap</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CloudStream. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 