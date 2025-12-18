import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Folder, FolderWithFiles } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface FoldersState {
  folders: FolderWithFiles[];
  currentFolder: FolderWithFiles | null;
  loading: boolean;
  error: string | null;
}

const initialState: FoldersState = {
  folders: [],
  currentFolder: null,
  loading: false,
  error: null,
};

export const fetchFolders = createAsyncThunk(
  'folders/fetchAll',
  async () => {
    const response = await fetch('/api/folders');
    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }
    return response.json();
  }
);

export const fetchFolderById = createAsyncThunk(
  'folders/fetchById',
  async (id: string) => {
    const response = await fetch(`/api/folders/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch folder');
    }
    return response.json();
  }
);

export const createFolder = createAsyncThunk(
  'folders/create',
  async (name: string) => {
    const res = await apiRequest('POST', '/api/folders', { name });
    return await res.json();
  }
);

export const deleteFolder = createAsyncThunk(
  'folders/delete',
  async (id: string) => {
    await apiRequest('DELETE', `/api/folders/${id}`, undefined);
    return id;
  }
);

const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    setCurrentFolder: (state, action: PayloadAction<FolderWithFiles | null>) => {
      state.currentFolder = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.loading = false;
        state.folders = action.payload;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch folders';
      })
      .addCase(fetchFolderById.fulfilled, (state, action) => {
        state.currentFolder = action.payload;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.folders.push(action.payload);
      })
      .addCase(deleteFolder.fulfilled, (state, action) => {
        state.folders = state.folders.filter(f => f.id !== action.payload);
      });
  },
});

export const { setCurrentFolder, clearError } = foldersSlice.actions;
export default foldersSlice.reducer;
