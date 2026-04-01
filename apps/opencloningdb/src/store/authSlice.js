import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, workspaceId: null },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    setWorkspaceId(state, action) {
      state.workspaceId = action.payload;
    },
    clearUser(state) {
      state.user = null;
      state.workspaceId = null;
    },
  },
});

export const { setUser, setWorkspaceId, clearUser } = authSlice.actions;
export default authSlice.reducer;
