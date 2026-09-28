import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  username: string | null;
  email: string | null; // <--- အသစ်ထည့်ထားသည်
  role: string | null;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  email: localStorage.getItem('email'), // <--- အသစ်ထည့်ထားသည်
  role: localStorage.getItem('role'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; username: string; email: string; role: string }>) => {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.email = action.payload.email; // <--- အသစ်ထည့်ထားသည်
      state.role = action.payload.role;
      
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('username', action.payload.username);
      localStorage.setItem('email', action.payload.email); // <--- အသစ်ထည့်ထားသည်
      localStorage.setItem('role', action.payload.role);
    },
    logout: (state) => {
      state.token = null;
      state.username = null;
      state.email = null; // <--- အသစ်ထည့်ထားသည်
      state.role = null;
      localStorage.clear();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;