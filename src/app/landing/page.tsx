'use client';

import Link from 'next/link';
import { ArrowRight, Users, DollarSign, BarChart3, Lock, Zap, Video, MessageSquare, TrendingUp, Shield, Star, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Animated Green Dotted Grid Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div 
          className="absolute inset-0 animate-grid-flow"
          style={{
            backgroundImage: `radial-gradient(circle, var(--interactive-primary) 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
            animation: 'gridFlow 20s linear infinite'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 group">
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
          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Your community,
            <br />
            <span style={{ color: 'var(--interactive-primary)' }}>monetized.</span>
          </h1>
          <p 
            className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Create, share, earn. All in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link href="/">
                  <button 
                    className="px-8 py-4 text-lg font-semibold rounded-xl transition-all hover:scale-105 shadow-xl flex items-center gap-2 justify-center"
                    style={{ 
                      backgroundColor: 'var(--interactive-primary)', 
                      color: 'white' 
                    }}
                  >
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
                <Link href="/community">
                  <button 
                    className="px-8 py-4 text-lg font-semibold rounded-xl transition-all hover:scale-105 border-2"
                    style={{ 
                      borderColor: 'var(--interactive-primary)',
                      color: 'var(--interactive-primary)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    Explore Communities
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register">
                  <button 
                    className="px-8 py-4 text-lg font-semibold rounded-xl transition-all hover:scale-105 shadow-xl flex items-center gap-2 justify-center"
                    style={{ 
                      backgroundColor: 'var(--interactive-primary)', 
                      color: 'white' 
                    }}
                  >
                    Start Creating
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
                <Link href="/community">
                  <button 
                    className="px-8 py-4 text-lg font-semibold rounded-xl transition-all hover:scale-105 border-2"
                    style={{ 
                      borderColor: 'var(--interactive-primary)',
                      color: 'var(--interactive-primary)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    Explore Communities
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* For Creators Section */}
      <section className="relative z-10 px-6 py-20" style={{ backgroundColor: 'var(--surface-primary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: 'var(--interactive-bg-muted)' }}>
              <Crown className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--interactive-primary)' }}>For Creators</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Build your empire
            </h2>
            <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
              Monetize your expertise. Grow your audience.
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
                style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
              >
                <Video className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
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
                style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
              >
                <DollarSign className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
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
                style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
              >
                <BarChart3 className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
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
                style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
              >
                <MessageSquare className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
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
                style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
              >
                <TrendingUp className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
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
                style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
              >
                <Shield className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Full Control
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Your community, your rules. Complete customization.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href={user ? "/" : "/register"}>
              <button 
                className="px-8 py-4 text-lg font-semibold rounded-xl transition-all hover:scale-105 shadow-xl inline-flex items-center gap-2"
                style={{ 
                  backgroundColor: 'var(--interactive-primary)', 
                  color: 'white' 
                }}
              >
                {user ? "Go to Dashboard" : "Start Your Community"}
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Members Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: 'var(--interactive-bg-muted)' }}>
              <Users className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--interactive-primary)' }}>For Members</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Learn from the best
            </h2>
            <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
              Exclusive content from top creators.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Member Benefit 1 */}
            <div 
              className="p-8 rounded-2xl border transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
              >
                <Star className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Exclusive Content
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Premium insights you won't find elsewhere.
              </p>
            </div>

            {/* Member Benefit 2 */}
            <div 
              className="p-8 rounded-2xl border transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
              >
                <Users className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Join Communities
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Connect and grow with like-minded people.
              </p>
            </div>

            {/* Member Benefit 3 */}
            <div 
              className="p-8 rounded-2xl border transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
              >
                <Lock className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Tiered Access
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Choose your level. Upgrade anytime.
              </p>
            </div>

            {/* Member Benefit 4 */}
            <div 
              className="p-8 rounded-2xl border transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
              >
                <Zap className="h-7 w-7" style={{ color: 'var(--interactive-primary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Real-Time Updates
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Instant notifications for new content.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/community">
              <button 
                className="px-8 py-4 text-lg font-semibold rounded-xl transition-all hover:scale-105 shadow-xl inline-flex items-center gap-2"
                style={{ 
                  backgroundColor: 'var(--interactive-primary)', 
                  color: 'white' 
                }}
              >
                Explore Communities
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div 
          className="max-w-5xl mx-auto rounded-3xl p-12 md:p-20 text-center border"
          style={{ 
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--interactive-border)'
          }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Ready to get started?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Join thousands building the future.
          </p>
          <Link href={user ? "/" : "/register"}>
            <button 
              className="px-10 py-5 text-xl font-semibold rounded-xl transition-all hover:scale-105 shadow-xl inline-flex items-center gap-2"
              style={{ 
                backgroundColor: 'var(--interactive-primary)', 
                color: 'white' 
              }}
            >
              {user ? "Go to Dashboard" : "Sign Up Free"}
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

      {/* CSS for grid animation */}
      <style jsx>{`
        @keyframes gridFlow {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(30px, 30px);
          }
        }
      `}</style>
    </div>
  );
}

