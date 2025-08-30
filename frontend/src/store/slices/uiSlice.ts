import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UIState, Notification, ConfirmDialog, Modal, Breadcrumb } from '@/types';

const initialState: UIState = {
  theme: 'light',
  colorScheme: 'blue',
  sidebarCollapsed: false,
  notifications: [],
  loading: {
    global: false,
  },
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
    isLoading: false,
  },
  modal: {
    isOpen: false,
  },
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    
    setColorScheme: (state, action: PayloadAction<'blue' | 'green' | 'purple' | 'orange' | 'red'>) => {
      state.colorScheme = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        id: `notification-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.notifications.unshift(notification);
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearNotifications: (state) => {
      state.notifications = state.notifications.filter(n => n.persistent);
    },
    
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    
    setComponentLoading: (state, action: PayloadAction<{ component: string; loading: boolean }>) => {
      const { component, loading } = action.payload;
      state.loading[component] = loading;
    },
    
    openConfirmDialog: (state, action: PayloadAction<Partial<ConfirmDialog>>) => {
      state.confirmDialog = {
        ...state.confirmDialog,
        ...action.payload,
        isOpen: true,
      };
    },
    
    closeConfirmDialog: (state) => {
      state.confirmDialog.isOpen = false;
      state.confirmDialog.isLoading = false;
    },
    
    setConfirmDialogLoading: (state, action: PayloadAction<boolean>) => {
      state.confirmDialog.isLoading = action.payload;
    },
    
    openModal: (state, action: PayloadAction<Partial<Modal>>) => {
      state.modal = {
        ...state.modal,
        ...action.payload,
        isOpen: true,
      };
    },
    
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
      };
    },
    
    setBreadcrumbs: (state, action: PayloadAction<Breadcrumb[]>) => {
      state.breadcrumbs = action.payload;
    },
    
    addBreadcrumb: (state, action: PayloadAction<Breadcrumb>) => {
      state.breadcrumbs.push(action.payload);
    },
    
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },
  },
});

export const {
  setTheme,
  setColorScheme,
  toggleSidebar,
  setSidebarCollapsed,
  addNotification,
  removeNotification,
  clearNotifications,
  setGlobalLoading,
  setComponentLoading,
  openConfirmDialog,
  closeConfirmDialog,
  setConfirmDialogLoading,
  openModal,
  closeModal,
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectColorScheme = (state: { ui: UIState }) => state.ui.colorScheme;
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.loading.global;
export const selectConfirmDialog = (state: { ui: UIState }) => state.ui.confirmDialog;
export const selectModal = (state: { ui: UIState }) => state.ui.modal;
export const selectBreadcrumbs = (state: { ui: UIState }) => state.ui.breadcrumbs;
