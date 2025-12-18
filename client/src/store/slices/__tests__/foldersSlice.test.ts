import foldersReducer, {
  setCurrentFolder,
  clearError,
  fetchFolders,
  fetchFolderById,
  createFolder,
  deleteFolder,
} from '../foldersSlice';
import type { FolderWithFiles } from '@shared/schema';

describe('foldersSlice', () => {
  const initialState = {
    folders: [],
    currentFolder: null,
    loading: false,
    error: null,
  };

  const mockFolder: FolderWithFiles = {
    id: '1',
    name: 'Test Folder',
    ownerId: 'user1',
    isRecent: false,
    shareToken: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    files: [],
  };

  const mockFolderWithFiles: FolderWithFiles = {
    id: '2',
    name: 'Folder with Files',
    ownerId: 'user1',
    isRecent: false,
    shareToken: 'token123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    files: [
      {
        id: 'file1',
        name: 'test.pdf',
        folderId: '2',
        ownerId: 'user1',
        size: 1024,
        version: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
  };

  describe('reducers', () => {
    it('should return the initial state', () => {
      expect(foldersReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setCurrentFolder', () => {
      const actual = foldersReducer(initialState, setCurrentFolder(mockFolder));
      expect(actual.currentFolder).toEqual(mockFolder);
    });

    it('should handle setCurrentFolder with null', () => {
      const stateWithFolder = { ...initialState, currentFolder: mockFolder };
      const actual = foldersReducer(stateWithFolder, setCurrentFolder(null));
      expect(actual.currentFolder).toBeNull();
    });

    it('should handle clearError', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const actual = foldersReducer(stateWithError, clearError());
      expect(actual.error).toBeNull();
    });
  });

  describe('extraReducers - fetchFolders', () => {
    it('should set loading to true when fetchFolders is pending', () => {
      const action = { type: fetchFolders.pending.type };
      const state = foldersReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set folders and loading to false when fetchFolders is fulfilled', () => {
      const folders = [mockFolder, mockFolderWithFiles];
      const action = { type: fetchFolders.fulfilled.type, payload: folders };
      const state = foldersReducer(
        { ...initialState, loading: true },
        action
      );
      expect(state.loading).toBe(false);
      expect(state.folders).toEqual(folders);
    });

    it('should set error when fetchFolders is rejected', () => {
      const action = {
        type: fetchFolders.rejected.type,
        error: { message: 'Failed to fetch folders' },
      };
      const state = foldersReducer(
        { ...initialState, loading: true },
        action
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch folders');
    });
  });

  describe('extraReducers - fetchFolderById', () => {
    it('should set currentFolder when fetchFolderById is fulfilled', () => {
      const action = {
        type: fetchFolderById.fulfilled.type,
        payload: mockFolderWithFiles,
      };
      const state = foldersReducer(initialState, action);
      expect(state.currentFolder).toEqual(mockFolderWithFiles);
    });
  });

  describe('extraReducers - createFolder', () => {
    it('should add new folder to folders array when createFolder is fulfilled', () => {
      const existingState = {
        ...initialState,
        folders: [mockFolder],
      };
      const newFolder: FolderWithFiles = {
        id: '3',
        name: 'New Folder',
        ownerId: 'user1',
        isRecent: false,
        shareToken: null,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        files: [],
      };
      const action = { type: createFolder.fulfilled.type, payload: newFolder };
      const state = foldersReducer(existingState, action);
      expect(state.folders).toHaveLength(2);
      expect(state.folders[1]).toEqual(newFolder);
    });
  });

  describe('extraReducers - deleteFolder', () => {
    it('should remove folder from folders array when deleteFolder is fulfilled', () => {
      const existingState = {
        ...initialState,
        folders: [mockFolder, mockFolderWithFiles],
      };
      const action = { type: deleteFolder.fulfilled.type, payload: '1' };
      const state = foldersReducer(existingState, action);
      expect(state.folders).toHaveLength(1);
      expect(state.folders[0].id).toBe('2');
    });

    it('should handle deleting non-existent folder', () => {
      const existingState = {
        ...initialState,
        folders: [mockFolder],
      };
      const action = { type: deleteFolder.fulfilled.type, payload: 'nonexistent' };
      const state = foldersReducer(existingState, action);
      expect(state.folders).toHaveLength(1);
      expect(state.folders[0]).toEqual(mockFolder);
    });
  });
});
