import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth(redirectTo = '/login') {
  const navigate = useNavigate();

  const logout = useCallback((role?: string, message?: string) => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('role');
    if (role === 'admin') {
      navigate('/admin/login', { state: { message } });
    } else {
      navigate('/login', { state: { message } });
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (!token) {
      navigate(redirectTo);
      return;
    }

    // Periodically check if session is terminated
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/check-session', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          logout(localStorage.getItem('adminToken') ? 'admin' : 'user', 'You have been logged out due to inactivity.');
        }
      } catch {
        // Ignore network errors
      }
    };

    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, [navigate, redirectTo, logout]);

  return { logout };
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
}
