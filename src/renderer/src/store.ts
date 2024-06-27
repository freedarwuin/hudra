import { configureStore } from "@reduxjs/toolkit";
import {
  downloadSlice,
  windowSlice,
  librarySlice,
  searchSlice,
  userPreferencesSlice,
  toastSlice,
  userDetailsSlice,
  gameRunningSlice,
} from "@renderer/features";

export const store = configureStore({
  reducer: {
    search: searchSlice.reducer,
    window: windowSlice.reducer,
    library: librarySlice.reducer,
    userPreferences: userPreferencesSlice.reducer,
    download: downloadSlice.reducer,
    toast: toastSlice.reducer,
    userDetails: userDetailsSlice.reducer,
    gameRunning: gameRunningSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
