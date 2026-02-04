
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

function isPhoneTenDigits(phone: string): boolean {
  return /^\d{10}$/.test(phone.replace(/\D/g, ''));
}

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
};

export default function ContactDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/contacts/${id}`);
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        if (res.status === 404 || !res.ok) {
          setError('Contact not found');
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setContact(data);
          setName(data.name ?? '');
          setPhone(data.phone ?? '');
          setEmail(data.email ?? '');
          setCompany(data.company ?? '');
        }
      } catch {
        if (!cancelled) setError('Failed to load contact');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, router]);

  const handleSave = async (e: React.FormEvent) => {
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
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: emailTrim,
          company: companyTrim,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }
      setContact((c) => (c ? { ...c, name, phone, email: emailTrim, company: companyTrim } : null));
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this contact?')) return;
    setError('');
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete');
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Failed to delete');
    }
  };

  if (loading) {
    return (
      <main className="contact-wrapper">
        <div className="contact-card">
          <p className="loading-text">Loading contact...</p>
          <button type="button" className="back-btn" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  if (error && !contact) {
    return (
      <main className="contact-wrapper">
        <div className="contact-card">
          <p className="error-text">{error}</p>
          <button type="button" className="back-btn" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

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
          <h2>Contact Details</h2>
        </div>

        <form className="contact-form" onSubmit={handleSave}>
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
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <Link href="/dashboard" className="cancel-btn">
              Cancel
            </Link>
            <button
              type="button"
              className="delete-btn"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
