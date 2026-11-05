import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import api from '../utils/axiosConfig';

/**
 * Enterprise Single Active Session & Cross-Tab Synchronization Hook
 * - Real-time Cross-Tab Sync via StorageEvent (Logout/New Login in another tab)
 * - Session Heartbeat Ping (/api/backoffice/auth/validate-session) on Tab Focus & every 30s
 */
export const useSingleSessionSync = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lastCheckTimeRef = useRef<number>(Date.now());
  const initialTokenRef = useRef<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    // 1. Cross-Tab Real-time Storage Event Listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        // Case A: Token was removed in another tab (Logout in another tab)
        if (!e.newValue) {
          sessionStorage.setItem(
            'auth_expired_message',
            'You have been logged out from another browser tab.'
          );
          dispatch(logout());
          navigate('/login');
        } 
        // Case B: Token was replaced with a new token in another tab (New Login in another tab)
        else if (e.newValue !== initialTokenRef.current) {
          sessionStorage.setItem(
            'auth_expired_message',
            'Your session has expired because a new login occurred in another browser tab.'
          );
          dispatch(logout());
          navigate('/login');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 2. Session Heartbeat Check Function
    const checkActiveSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        await api.get('/auth/validate-session');
      } catch (err: any) {
        // If 401 occurs, axiosConfig interceptor will automatically trigger handleAuthError,
        // store the message in sessionStorage, dispatch logout, and redirect to /login.
      }
    };

    // 3. Check on Window/Tab Focus (When user returns to this tab from another window/device)
    const handleWindowFocus = () => {
      const now = Date.now();
      // Throttle focus checks to at most once every 10 seconds
      if (now - lastCheckTimeRef.current > 10000) {
        lastCheckTimeRef.current = now;
        checkActiveSession();
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    // 4. Periodic background ping every 30 seconds
    const intervalId = setInterval(() => {
      checkActiveSession();
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(intervalId);
    };
  }, [dispatch, navigate]);
};

export default useSingleSessionSync;
