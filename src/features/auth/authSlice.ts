import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  username: string | null;
  email: string | null;
  role: string | null;
  permissions: string[];
  mustChangePassword: boolean;
}

const safeParseJson = (str: string | null): string[] => {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
};

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  email: localStorage.getItem('email'),
  role: localStorage.getItem('role'),
  permissions: safeParseJson(localStorage.getItem('permissions')),
  mustChangePassword: localStorage.getItem('mustChangePassword') === 'true',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        username: string;
        email: string;
        role: string;
        permissions?: string[];
        mustChangePassword?: boolean;
      }>
    ) => {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.permissions = action.payload.permissions || [];
      state.mustChangePassword = Boolean(action.payload.mustChangePassword);

      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('username', action.payload.username);
      localStorage.setItem('email', action.payload.email);
      localStorage.setItem('role', action.payload.role);
      localStorage.setItem(
        'permissions',
        JSON.stringify(action.payload.permissions || [])
      );
      localStorage.setItem('mustChangePassword', String(Boolean(action.payload.mustChangePassword)));
    },
    clearMustChangePassword: (state) => {
      state.mustChangePassword = false;
      localStorage.setItem('mustChangePassword', 'false');
    },
    logout: (state) => {
      state.token = null;
      state.username = null;
      state.email = null;
      state.role = null;
      state.permissions = [];
      state.mustChangePassword = false;

      // Remove authentication session keys only - PRESERVE user avatars and local settings
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      localStorage.removeItem('permissions');
      localStorage.removeItem('mustChangePassword');
      localStorage.removeItem('currentUserAvatar');
    },
  },
});

export const { setCredentials, clearMustChangePassword, logout } = authSlice.actions;
export default authSlice.reducer;
