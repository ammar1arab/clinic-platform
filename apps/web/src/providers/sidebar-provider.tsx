'use client';

import React, { createContext, useContext, useMemo, useState, useSyncExternalStore } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'sidebar-collapsed';
const listeners = new Set<() => void>();
let collapsedSnapshot = false;
let storageAvailable = true;

function readCollapsed() {
  if (storageAvailable) {
    try {
      collapsedSnapshot = localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      storageAvailable = false;
    }
  }
  return collapsedSnapshot;
}

function publishCollapsed(collapsed: boolean) {
  collapsedSnapshot = collapsed;
  if (storageAvailable) {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      storageAvailable = false;
    }
  }
  if (collapsed) document.documentElement.setAttribute('data-sidebar', 'collapsed');
  else document.documentElement.removeAttribute('data-sidebar');
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isCollapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    publishCollapsed(!readCollapsed());
  };

  const stateValue = useMemo(
    () => ({
      isCollapsed,
      toggleSidebar,
      mobileOpen,
      setMobileOpen,
    }),
    [isCollapsed, mobileOpen],
  );

  return (
    <SidebarContext.Provider value={stateValue}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
