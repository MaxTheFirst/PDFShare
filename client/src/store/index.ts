import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import foldersReducer from './slices/foldersSlice';
import filesReducer from './slices/filesSlice';
import subscriptionsReducer from './slices/subscriptionsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    folders: foldersReducer,
    files: filesReducer,
    subscriptions: subscriptionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
