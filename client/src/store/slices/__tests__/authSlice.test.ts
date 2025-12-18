import authReducer, { setUser, clearError, verifyAuth, logout } from '../authSlice';
import type { User } from '@shared/schema';

describe('authSlice', () => {
  const initialState = {
    user: null,
    loading: false,
    error: null,
  };

  const mockUser: User = {
    id: '1',
    telegramId: '123456',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date('2024-01-01'),
  };

  describe('reducers', () => {
    it('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setUser', () => {
      const actual = authReducer(initialState, setUser(mockUser));
      expect(actual.user).toEqual(mockUser);
    });

    it('should handle setUser with null', () => {
      const stateWithUser = { ...initialState, user: mockUser };
      const actual = authReducer(stateWithUser, setUser(null));
      expect(actual.user).toBeNull();
    });

    it('should handle clearError', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const actual = authReducer(stateWithError, clearError());
      expect(actual.error).toBeNull();
    });
  });

  describe('extraReducers - verifyAuth', () => {
    it('should set loading to true when verifyAuth is pending', () => {
      const action = { type: verifyAuth.pending.type };
      const state = authReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set user and loading to false when verifyAuth is fulfilled', () => {
      const action = { type: verifyAuth.fulfilled.type, payload: mockUser };
      const state = authReducer(
        { ...initialState, loading: true },
        action
      );
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockUser);
    });

    it('should set error and clear user when verifyAuth is rejected', () => {
      const action = {
        type: verifyAuth.rejected.type,
        error: { message: 'Authentication failed' },
      };
      const state = authReducer(
        { ...initialState, loading: true, user: mockUser },
        action
      );
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe('Authentication failed');
    });

    it('should use default error message when error message is not provided', () => {
      const action = {
        type: verifyAuth.rejected.type,
        error: {},
      };
      const state = authReducer(
        { ...initialState, loading: true },
        action
      );
      expect(state.error).toBe('Authentication failed');
    });
  });

  describe('extraReducers - logout', () => {
    it('should clear user when logout is fulfilled', () => {
      const stateWithUser = { ...initialState, user: mockUser };
      const action = { type: logout.fulfilled.type };
      const state = authReducer(stateWithUser, action);
      expect(state.user).toBeNull();
    });
  });
});
