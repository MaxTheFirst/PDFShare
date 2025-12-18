import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Subscription } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface SubscriptionsState {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionsState = {
  subscriptions: [],
  loading: false,
  error: null,
};

export const fetchSubscriptions = createAsyncThunk(
  'subscriptions/fetchAll',
  async () => {
    const response = await fetch('/api/subscriptions');
    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions');
    }
    return response.json();
  }
);

export const subscribe = createAsyncThunk(
  'subscriptions/subscribe',
  async (data: { folderId?: string; fileId?: string }) => {
    return await apiRequest('POST', '/api/subscriptions', data);
  }
);

export const unsubscribe = createAsyncThunk(
  'subscriptions/unsubscribe',
  async (id: string) => {
    await apiRequest('DELETE', `/api/subscriptions/${id}`, undefined);
    return id;
  }
);

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = action.payload;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch subscriptions';
      })
      .addCase(subscribe.fulfilled, (state, action) => {
        state.subscriptions.push(action.payload);
      })
      .addCase(unsubscribe.fulfilled, (state, action) => {
        state.subscriptions = state.subscriptions.filter(s => s.id !== action.payload);
      });
  },
});

export const { clearError } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;
