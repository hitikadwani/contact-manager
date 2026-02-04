
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function isPhoneTenDigits(phone: string): boolean {
  return /^\d{10}$/.test(phone.replace(/\D/g, ''));
}

export default function NewContactPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isPhoneTenDigits(phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    const emailTrim = email.trim();
    const companyTrim = company.trim();
    if (!emailTrim) {
      setError('Email is required');
      return;
    }
    if (!companyTrim) {
      setError('Company is required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: emailTrim, company: companyTrim }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to add contact');
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="contact-wrapper">
      <div className="contact-card">
        <div className="contact-header">
          <button
            type="button"
            className="back-btn"
            onClick={() => router.push('/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h2>Add New Contact</h2>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <label>
            Name *
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Phone * (10 digits)
            <input
              type="tel"
              inputMode="numeric"
              placeholder="e.g. 1234567890"
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setPhone(digits);
              }}
              maxLength={10}
              required
            />
          </label>
          <label>
            Email *
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Company *
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <div className="contact-actions">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <Link href="/dashboard" className="cancel-btn">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
