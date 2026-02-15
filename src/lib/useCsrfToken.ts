'use client';
import { useEffect, useState } from 'react';

export function useCsrfToken(): string {
  const [token, setToken] = useState('');

  useEffect(() => {
    // Get CSRF token from cookie
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(c => c.trim().startsWith('csrf-token='));
    if (csrfCookie) {
      const tokenValue = csrfCookie.split('=')[1];
      setToken(tokenValue);
    }
  }, []);

  return token;
}
