'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Link2, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Users,
  Play,
  MessageSquare
} from 'lucide-react';

export default function InvitePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length < 8) {
      setError('Please enter the complete 8-character invite code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invite/${code}`);
      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid invite code');
        setLoading(false);
        return;
      }

      router.push(`/invite/${code}`);
    } catch (err) {
      setError('Failed to validate invite code');
      setLoading(false);
    }
  };

  const isCodeComplete = code.length === 8;

  return (
    <div 
      className="min-h-full flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundColor: 'var(--surface-secondary)' }}
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--interactive-primary)' }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--interactive-primary)' }}
        />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ 
              background: 'linear-gradient(135deg, var(--interactive-primary) 0%, var(--interactive-hover) 100%)'
            }}
          >
            <Link2 className="h-8 w-8 text-white" />
          </div>
          <h1 
            className="text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Join a Community
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
            Enter your invite code to get access
          </p>
        </div>

        {/* Code Input Card */}
        <div 
          className="rounded-2xl border p-8"
          style={{ 
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                className="block text-sm font-medium mb-3 text-center"
                style={{ color: 'var(--text-primary)' }}
              >
                Enter your 8-character invite code
              </label>
              
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="ABCD1234"
                className="w-full h-14 text-center text-2xl font-bold tracking-[0.25em] rounded-xl border-2 transition-colors duration-200 focus:outline-none uppercase"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: error ? 'var(--error-border)' : isCodeComplete ? 'var(--interactive-primary)' : 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
                maxLength={8}
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && (
              <div 
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ 
                  backgroundColor: 'var(--error-background)',
                  color: 'var(--error-text)'
                }}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isCodeComplete}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isCodeComplete ? 'var(--interactive-primary)' : 'var(--surface-tertiary)',
                color: isCodeComplete ? 'white' : 'var(--text-muted)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  Join Community
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Help text */}
        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Don't have an invite code?{' '}
            <Link 
              href="/community/create"
              className="font-medium hover:underline"
              style={{ color: 'var(--interactive-primary)' }}
            >
              Create your own community
            </Link>
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {[
            { icon: Play, label: 'Videos', desc: 'Exclusive' },
            { icon: MessageSquare, label: 'Chat', desc: 'Real-time' },
            { icon: Users, label: 'Community', desc: 'Connect' }
          ].map(({ icon: Icon, label, desc }) => (
            <div 
              key={label} 
              className="p-4 rounded-xl text-center transition-transform duration-300 ease-out hover:-translate-y-1"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-default)'
              }}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: 'var(--surface-secondary)' }}
              >
                <Icon className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
