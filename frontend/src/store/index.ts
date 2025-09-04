import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './api/baseApi';
import { authApi } from './api/authApi';
import { usersApi } from './api/usersApi';
import { academicApi } from './api/academicApi';
import { resultsApi } from './api/resultsApi';
import { attendanceApi } from './api/attendanceApi';
import { timetableApi } from './api/timetableApi';
import { dashboardApi } from './api/dashboardApi';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    // Since all APIs use injectEndpoints on baseApi, we only need baseApi reducer
    [baseApi.reducerPath]: baseApi.reducer,
    
    // Regular slices
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore these action types
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
        ignoredPaths: ['auth.lastLogin'],
      },
    }).concat(
      // Only add baseApi middleware since all APIs use injectEndpoints
      baseApi.middleware
    ),
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export the store as default for easier imports
export { store as default };
