import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { File } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface FilesState {
  files: File[];
  currentFile: File | null;
  loading: boolean;
  error: string | null;
}

const initialState: FilesState = {
  files: [],
  currentFile: null,
  loading: false,
  error: null,
};

export const fetchFilesByFolder = createAsyncThunk(
  'files/fetchByFolder',
  async (folderId: string) => {
    const response = await fetch(`/api/folders/${folderId}/files`);
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
    return response.json();
  }
);

export const fetchFileById = createAsyncThunk(
  'files/fetchById',
  async (id: string) => {
    const response = await fetch(`/api/files/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }
    return response.json();
  }
);

export const deleteFile = createAsyncThunk(
  'files/delete',
  async (id: string) => {
    await apiRequest('DELETE', `/api/files/${id}`, undefined);
    return id;
  }
);

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setCurrentFile: (state, action: PayloadAction<File | null>) => {
      state.currentFile = action.payload;
    },
    addFile: (state, action: PayloadAction<File>) => {
      const existingIndex = state.files.findIndex(f => f.id === action.payload.id);
      if (existingIndex >= 0) {
        state.files[existingIndex] = action.payload;
      } else {
        state.files.push(action.payload);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFilesByFolder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilesByFolder.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchFilesByFolder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch files';
      })
      .addCase(fetchFileById.fulfilled, (state, action) => {
        state.currentFile = action.payload;
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter(f => f.id !== action.payload);
      });
  },
});

export const { setCurrentFile, addFile, clearError } = filesSlice.actions;
export default filesSlice.reducer;
