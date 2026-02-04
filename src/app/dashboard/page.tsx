
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  favorite: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchContacts = useCallback(async (q?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = q ? `/api/contacts?q=${encodeURIComponent(q)}` : '/api/contacts';
      const res = await fetch(url);
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to load contacts');
        return;
      }
      const data = await res.json();
      setContacts(data);
    } catch {
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts(search || undefined);
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
  };

  const toggleFavorite = async (contact: Contact) => {
    const next = !contact.favorite;
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: contact.name,
        phone: contact.phone,
        email: contact.email ?? '',
        company: contact.company ?? '',
        favorite: next,
      }),
    });
    if (res.ok) {
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, favorite: next } : c))
      );
    }
  };

  return (
    <main className="dashboard-wrapper">
      <div className="dashboard-card">
        <header className="dashboard-header">
          <div className="logo">📇 ContactManager</div>

          <div className="header-actions">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search contacts..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="search-btn">Search</button>
            </form>
            <button
              type="button"
              onClick={handleLogout}
              className="logout-btn"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="dashboard-content">
          <div className="dashboard-title">
            <h2>Dashboard</h2>
            <Link href="/contacts" className="add-btn">Add New Contact</Link>
          </div>

          {error && <p className="error-text">{error}</p>}
          {loading ? (
            <p className="loading-text">Loading contacts...</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Favorite</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-cell">
                        No contacts yet. Add your first contact.
                      </td>
                    </tr>
                  ) : (
                    contacts.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <Link href={`/contacts/${c.id}`} className='name-link'>
                            {c.name}
                          </Link>
                        </td>
                        <td>{c.phone}</td>
                        <td className="email">{c.email ?? '—'}</td>
                        <td>
                          <button
                            type="button"
                            className={`star-btn ${c.favorite ? 'active' : ''}`}
                            onClick={() => toggleFavorite(c)}
                            aria-label={c.favorite ? 'Remove from favourites' : 'Add to favourites'}
                            title={c.favorite ? 'Remove from favourites' : 'Add to favourites'}
                          >
                            ★
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && contacts.length > 0 && (
            <div className="table-footer">
              <span>Showing {contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
