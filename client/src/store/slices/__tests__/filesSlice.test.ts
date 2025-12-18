import filesReducer, {
  setCurrentFile,
  addFile,
  clearError,
  fetchFilesByFolder,
  fetchFileById,
  deleteFile,
} from '../filesSlice';
import type { File } from '@shared/schema';

describe('filesSlice', () => {
  const initialState = {
    files: [],
    currentFile: null,
    loading: false,
    error: null,
  };

  const mockFile: File = {
    id: '1',
    name: 'test.pdf',
    folderId: 'folder1',
    ownerId: 'user1',
    size: 1024,
    version: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('reducers', () => {
    it('should return the initial state', () => {
      expect(filesReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setCurrentFile', () => {
      const actual = filesReducer(initialState, setCurrentFile(mockFile));
      expect(actual.currentFile).toEqual(mockFile);
    });

    it('should handle setCurrentFile with null', () => {
      const stateWithFile = { ...initialState, currentFile: mockFile };
      const actual = filesReducer(stateWithFile, setCurrentFile(null));
      expect(actual.currentFile).toBeNull();
    });

    it('should handle addFile - add new file', () => {
      const actual = filesReducer(initialState, addFile(mockFile));
      expect(actual.files).toHaveLength(1);
      expect(actual.files[0]).toEqual(mockFile);
    });

    it('should handle addFile - update existing file', () => {
      const existingState = {
        ...initialState,
        files: [mockFile],
      };
      const updatedFile: File = {
        ...mockFile,
        name: 'updated.pdf',
        version: 2,
      };
      const actual = filesReducer(existingState, addFile(updatedFile));
      expect(actual.files).toHaveLength(1);
      expect(actual.files[0]).toEqual(updatedFile);
      expect(actual.files[0].name).toBe('updated.pdf');
      expect(actual.files[0].version).toBe(2);
    });

    it('should handle clearError', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const actual = filesReducer(stateWithError, clearError());
      expect(actual.error).toBeNull();
    });
  });

  describe('extraReducers - fetchFilesByFolder', () => {
    it('should set loading to true when fetchFilesByFolder is pending', () => {
      const action = { type: fetchFilesByFolder.pending.type };
      const state = filesReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set files and loading to false when fetchFilesByFolder is fulfilled', () => {
      const files = [mockFile];
      const action = { type: fetchFilesByFolder.fulfilled.type, payload: files };
      const state = filesReducer(
        { ...initialState, loading: true },
        action
      );
      expect(state.loading).toBe(false);
      expect(state.files).toEqual(files);
    });

    it('should set error when fetchFilesByFolder is rejected', () => {
      const action = {
        type: fetchFilesByFolder.rejected.type,
        error: { message: 'Failed to fetch files' },
      };
      const state = filesReducer(
        { ...initialState, loading: true },
        action
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch files');
    });
  });

  describe('extraReducers - fetchFileById', () => {
    it('should set currentFile when fetchFileById is fulfilled', () => {
      const action = {
        type: fetchFileById.fulfilled.type,
        payload: mockFile,
      };
      const state = filesReducer(initialState, action);
      expect(state.currentFile).toEqual(mockFile);
    });
  });

  describe('extraReducers - deleteFile', () => {
    it('should remove file from files array when deleteFile is fulfilled', () => {
      const file2: File = {
        id: '2',
        name: 'test2.pdf',
        folderId: 'folder1',
        ownerId: 'user1',
        size: 2048,
        version: 1,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      };
      const existingState = {
        ...initialState,
        files: [mockFile, file2],
      };
      const action = { type: deleteFile.fulfilled.type, payload: '1' };
      const state = filesReducer(existingState, action);
      expect(state.files).toHaveLength(1);
      expect(state.files[0].id).toBe('2');
    });

    it('should handle deleting non-existent file', () => {
      const existingState = {
        ...initialState,
        files: [mockFile],
      };
      const action = { type: deleteFile.fulfilled.type, payload: 'nonexistent' };
      const state = filesReducer(existingState, action);
      expect(state.files).toHaveLength(1);
      expect(state.files[0]).toEqual(mockFile);
    });
  });
});
