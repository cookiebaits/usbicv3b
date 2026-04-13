import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth(redirectTo = '/login') {
  const navigate = useNavigate();

  const logout = useCallback((role?: string) => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    if (role === 'admin') {
      navigate('/admin/login');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate(redirectTo);
    }
  }, [navigate, redirectTo]);

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
