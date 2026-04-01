import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, workspaceId: null, workspaceName: null },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    setWorkspaceId(state, action) {
      state.workspaceId = action.payload;
    },
    setWorkspaceName(state, action) {
      state.workspaceName = action.payload;
    },
    clearUser(state) {
      state.user = null;
      state.workspaceId = null;
      state.workspaceName = null;
    },
  },
});

export const { setUser, setWorkspaceId, setWorkspaceName, clearUser } = authSlice.actions;
export default authSlice.reducer;
