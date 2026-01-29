'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { ArrowRight, Users, DollarSign, BarChart3, Lock, Zap, MessageSquare, TrendingUp, Shield, Star, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  // Force light mode for landing page
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Subtle gradient background - clean and professional */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(22, 163, 74, 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(22, 163, 74, 0.05), transparent)
          `
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-3 group">
            <Image 
              src="/prylogo.png" 
              alt="Pryleaf" 
              width={40}
              height={40}
              className="group-hover:opacity-80 transition-opacity"
            />
            <span 
              className="text-2xl font-bold transition-opacity group-hover:opacity-80" 
              style={{ color: 'var(--interactive-primary)' }}
            >
              Pryleaf
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/">
                <button 
                  className="px-6 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105 shadow-lg"
                  style={{ 
                    backgroundColor: 'var(--interactive-primary)', 
                    color: 'white' 
                  }}
                >
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button 
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Log In
                  </button>
                </Link>
                <Link href="/register">
                  <button 
                    className="px-6 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105 shadow-lg"
                    style={{ 
                      backgroundColor: 'var(--interactive-primary)', 
                      color: 'white' 
                    }}
                  >
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 md:py-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              The modern platform for creator communities
            </span>
          </div>
          
          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Turn your expertise
            <br />
            <span style={{ color: 'var(--interactive-primary)' }}>into income.</span>
          </h1>
          <p 
            className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Share premium content. Build your community. Get paid.
          </p>
          <div className="flex flex-col items-center gap-4">
            {user ? (
              <Link href="/">
                <button 
                  className="px-10 py-5 text-xl font-semibold rounded-xl transition-all hover:scale-105 shadow-xl inline-flex items-center gap-2"
                  style={{ 
                    backgroundColor: 'var(--interactive-primary)', 
                    color: 'white' 
                  }}
                >
                  Go to Dashboard
                  <ArrowRight className="h-6 w-6" />
                </button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <button 
                    className="px-10 py-5 text-xl font-semibold rounded-xl transition-all hover:scale-105 shadow-xl inline-flex items-center gap-2"
                    style={{ 
                      backgroundColor: 'var(--interactive-primary)', 
                      color: 'white' 
                    }}
                  >
                    Create Your Community
                    <ArrowRight className="h-6 w-6" />
                  </button>
                </Link>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Create your first community in under 2 minutes
                </p>
              </>
            )}
          </div>

          {/* Key Benefits */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--interactive-primary)' }}>
                $0
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                To Start
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--interactive-primary)' }}>
                80%
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Revenue Share
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--interactive-primary)' }}>
                10K+
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Assets Tracked
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 px-6 py-20" style={{ backgroundColor: 'var(--surface-primary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Everything you need to succeed
            </h2>
            <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
              All the tools. One platform. Simple pricing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Creator Feature 1 */}
            <div 
              className="p-8 rounded-2xl border transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--surface-tertiary)' }}
              >
                <Star className="h-7 w-7" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Premium Content
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Share exclusive videos and insights. Control who sees what.
              </p>
            </div>

            {/* Creator Feature 2 */}
            <div 
              className="p-8 rounded-2xl border transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--surface-tertiary)' }}
              >
                <DollarSign className="h-7 w-7" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Flexible Monetization
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Set your price. Multiple tiers. Keep more earnings.
              </p>
            </div>

            {/* Creator Feature 3 */}
            <div 
              className="p-8 rounded-2xl border transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--surface-tertiary)' }}
              >
                <BarChart3 className="h-7 w-7" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Analytics & Insights
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Track growth and revenue. Make smarter decisions.
              </p>
            </div>

            {/* Creator Feature 4 */}
            <div 
              className="p-8 rounded-2xl border transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--surface-tertiary)' }}
              >
                <MessageSquare className="h-7 w-7" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Direct Communication
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Chat with members. Build deeper connections.
              </p>
            </div>

            {/* Creator Feature 5 */}
            <div 
              className="p-8 rounded-2xl border transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--surface-tertiary)' }}
              >
                <TrendingUp className="h-7 w-7" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Market Research Tools
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Share picks and analysis. Empower your community.
              </p>
            </div>

            {/* Creator Feature 6 */}
            <div 
              className="p-8 rounded-2xl border transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--surface-tertiary)' }}
              >
                <Shield className="h-7 w-7" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Full Control
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Your community, your rules. Complete customization.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Value Proposition for Creators */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div 
            className="p-10 rounded-2xl border-2"
            style={{ 
              backgroundColor: 'var(--surface-tertiary)',
              borderColor: 'var(--interactive-primary)'
            }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Give your subscribers more value
              </h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                Unlike Patreon or YouTube memberships, Pryleaf gives you professional tools to deliver serious value.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--interactive-primary)' }}
                  >
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Share live stock data
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Post tickers with real-time prices. Create watchlists. No screenshots needed.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--interactive-primary)' }}
                  >
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Interactive charts
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Members can explore the same data you're analyzing. All built-in.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--interactive-primary)' }}
                  >
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Portfolio transparency
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Share your holdings and performance. Build trust through transparency.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--interactive-primary)' }}
                  >
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Context-rich discussions
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Chat about specific stocks with data right there. Not just text messages.
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="mt-8 p-4 rounded-lg text-center"
              style={{ backgroundColor: 'var(--surface-primary)' }}
            >
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Your subscribers get a research platform, not just a content feed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Members Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Join investment communities
            </h2>
            <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
              Learn from experts with tools built for sharing insights.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div 
              className="p-6 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--surface-tertiary)' }}
              >
                <TrendingUp className="h-6 w-6" style={{ color: 'var(--interactive-primary)' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Built-in market tools
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Live stock data, charts, and watchlists. No switching between apps.
              </p>
            </div>

            <div 
              className="p-6 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--surface-tertiary)' }}
              >
                <Users className="h-6 w-6" style={{ color: 'var(--interactive-primary)' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Share insights easily
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Post analysis, discuss trades, share research. Purpose-built for investors.
              </p>
            </div>

            <div 
              className="p-6 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--surface-tertiary)' }}
              >
                <MessageSquare className="h-6 w-6" style={{ color: 'var(--interactive-primary)' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Real-time discussions
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Chat during market hours. Learn from the community's strategies.
              </p>
            </div>

            <div 
              className="p-6 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--surface-tertiary)' }}
              >
                <Star className="h-6 w-6" style={{ color: 'var(--interactive-primary)' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Premium content
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Exclusive videos and analysis from creators you trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Pryleaf Section */}
      <section className="relative z-10 px-6 py-20" style={{ backgroundColor: 'var(--surface-primary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Built for creators who mean business
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Reason 1 */}
            <div 
              className="p-6 rounded-xl border text-center"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div className="flex justify-center mb-4">
                <div 
                  className="w-14 h-14 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-tertiary)' }}
                >
                  <Zap className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                Launch in Minutes
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                No technical skills needed. Set up your community and start earning today.
              </p>
            </div>

            {/* Reason 2 */}
            <div 
              className="p-6 rounded-xl border text-center"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div className="flex justify-center mb-4">
                <div 
                  className="w-14 h-14 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-tertiary)' }}
                >
                  <DollarSign className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                Keep More Earnings
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Fair revenue split. No hidden fees. You keep 80% of what you earn.
              </p>
            </div>

            {/* Reason 3 */}
            <div 
              className="p-6 rounded-xl border text-center"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div className="flex justify-center mb-4">
                <div 
                  className="w-14 h-14 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-tertiary)' }}
                >
                  <BarChart3 className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                All-in-One Platform
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Videos, chat, analytics, payments. Everything you need in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div 
          className="max-w-4xl mx-auto rounded-3xl p-12 md:p-16 text-center"
          style={{ 
            backgroundColor: 'var(--interactive-primary)',
          }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Start building your community today
          </h2>
          <p className="text-xl mb-3 text-white/90">
            Setup takes 2 minutes. Start monetizing your expertise today.
          </p>
          <p className="text-base mb-8 text-white/80">
            Free forever • Keep 80% of revenue • Cancel anytime
          </p>
          <Link href={user ? "/" : "/register"}>
            <button 
              className="px-10 py-5 text-xl font-semibold rounded-xl transition-all hover:scale-105 shadow-xl inline-flex items-center gap-2"
              style={{ 
                backgroundColor: 'white', 
                color: 'var(--interactive-primary)' 
              }}
            >
              {user ? "Go to Your Dashboard" : "Start Building Your Community"}
              <ArrowRight className="h-6 w-6" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p style={{ color: 'var(--text-muted)' }}>
            © 2024 Pryleaf. Built for creators, by creators.
          </p>
        </div>
      </footer>

    </div>
  );
}

