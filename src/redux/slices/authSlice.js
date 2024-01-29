import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: false,
  token: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginHandler: (state) => {
      state.value = true;
    },
    logoutHandler: (state) => {
      state.value = false;
    },
    tokenHandler: (state, action) => {
      state.token = action.payload; // Set the token with the payload value
    },
  },
});

// Action creators are generated for each case reducer function
export const { loginHandler, logoutHandler, tokenHandler } = authSlice.actions;

export default authSlice.reducer;
