import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isAuthenticated: localStorage.getItem('auth') === 'true',
  role: localStorage.getItem('role') || null,
  patientId: localStorage.getItem('patientId') || null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { role, patientId } = action.payload;
      state.isAuthenticated = true;
      state.role = role;
      state.patientId = patientId || null;
      localStorage.setItem('auth', 'true');
      localStorage.setItem('role', role);
      if (patientId) {
        localStorage.setItem('patientId', patientId);
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.role = null;
      state.patientId = null;
      localStorage.removeItem('auth');
      localStorage.removeItem('role');
      localStorage.removeItem('patientId');
      localStorage.removeItem('cases');
      localStorage.removeItem('stats');
      localStorage.removeItem('geminiEnabled');
      localStorage.removeItem('reviewQueue');
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
