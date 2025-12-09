'use client';

import { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void; // you can store logged‑in user
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const sendOtp = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to send code');
        return;
      }
      setStep('otp');
      alert('A login code has been sent to your email.');
    } catch {
      alert('Network error. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Invalid code');
        return;
      }
      onSuccess(email);
      onClose();
    } catch {
      alert('Network error. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {step === 'email' ? 'Login with Email' : 'Enter Verification Code'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 'email' ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
                <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

              <button
                type="button"
                onClick={sendOtp}
                disabled={isLoading || !email}
                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {isLoading ? 'Sending...' : 'Send Login Code'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Enter the 6‑digit code sent to <span className="font-semibold">{email}</span>.
              </p>
                <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 tracking-[0.4em] text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

              <button
                type="button"
                onClick={verifyOtp}
                disabled={isLoading || otp.length < 4}
                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {isLoading ? 'Verifying...' : 'Login'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
