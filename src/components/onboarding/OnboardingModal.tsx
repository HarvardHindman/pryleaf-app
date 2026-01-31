'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Users, Crown, ArrowRight, Link2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const { user, completeOnboarding } = useAuth();
  const router = useRouter();

  if (!isOpen) return null;

  const handleJoinViaInvite = () => {
    // Navigate first, then close modal after a brief delay
    router.push('/invite');
    setTimeout(() => {
      onClose();
      completeOnboarding();
    }, 100);
  };

  const handleCreateCommunity = () => {
    // Navigate first, then close modal after a brief delay
    router.push('/community/create');
    setTimeout(() => {
      onClose();
      completeOnboarding();
    }, 100);
  };

  const handleSkip = async () => {
    onClose();
    // Don't mark as completed - user will see dashboard banner instead
  };

  const handleNext = () => {
    setStep(2);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
    >
      <div 
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          border: '1px solid var(--border-default)'
        }}
      >
        {/* Header with close button and progress */}
        <div className="px-8 pt-6">
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={handleSkip}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div 
              className="h-1.5 flex-1 rounded-full transition-all"
              style={{ 
                backgroundColor: step >= 1 ? 'var(--interactive-primary)' : 'var(--surface-tertiary)'
              }}
            />
            <div 
              className="h-1.5 flex-1 rounded-full transition-all"
              style={{ 
                backgroundColor: step >= 2 ? 'var(--interactive-primary)' : 'var(--surface-tertiary)'
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {step === 1 && (
            <div className="text-center">
              <h2 
                className="text-3xl font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Welcome to Pryleaf{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
              </h2>
              <p 
                className="text-lg mb-8"
                style={{ color: 'var(--text-secondary)' }}
              >
                Pryleaf combines powerful investment tracking with creator communities,
                helping you learn from experienced investors and share your own insights.
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{ 
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent'
                  }}
                >
                  Skip for now
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
                  style={{ 
                    backgroundColor: 'var(--interactive-primary)',
                    color: 'white'
                  }}
                >
                  Let's get started
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <h2 
                  className="text-3xl font-bold mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Join or Create a Community
                </h2>
                <p 
                  className="text-lg"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Communities are the heart of Pryleaf. Get started by joining one or creating your own.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Join via Invite Card */}
                <div 
                  className="p-6 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer flex flex-col"
                  style={{ 
                    backgroundColor: 'var(--surface-secondary)',
                    borderColor: 'var(--border-default)'
                  }}
                  onClick={handleJoinViaInvite}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
                  >
                    <Link2 
                      className="h-6 w-6"
                      style={{ color: 'var(--interactive-primary)' }}
                    />
                  </div>
                  <h3 
                    className="text-xl font-bold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Join via Invite
                  </h3>
                  <p 
                    className="text-sm mb-4 flex-grow"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Have an invite code? Join an existing community and start connecting with members
                  </p>
                  <button
                    className="w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                    style={{ 
                      backgroundColor: '#000000',
                      color: 'white'
                    }}
                  >
                    Enter Invite Code
                  </button>
                </div>

                {/* Create Community Card */}
                <div 
                  className="p-6 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer flex flex-col"
                  style={{ 
                    backgroundColor: 'var(--surface-secondary)',
                    borderColor: 'var(--border-default)'
                  }}
                  onClick={handleCreateCommunity}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
                  >
                    <Crown 
                      className="h-6 w-6"
                      style={{ color: 'var(--interactive-primary)' }}
                    />
                  </div>
                  <h3 
                    className="text-xl font-bold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Create Your Own
                  </h3>
                  <p 
                    className="text-sm mb-4 flex-grow"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Build your own community, share insights, and grow your following
                  </p>
                  <button
                    className="w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                    style={{ 
                      backgroundColor: '#000000',
                      color: 'white'
                    }}
                  >
                    Start Creating
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleSkip}
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  I'll do this later
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
