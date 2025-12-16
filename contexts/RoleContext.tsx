'use client';

/**
 * Role Context Provider
 *
 * Provides role information and switching capabilities throughout the app.
 *
 * HYDRATION-SAFE: The loadRolePreferences() function already checks
 * `typeof window === 'undefined'` and returns defaults for SSR.
 * We removed the redundant useEffect that was causing double-initialization
 * and potential hydration mismatches.
 *
 * @see https://nextjs.org/docs/messages/react-hydration-error
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { RoleContext, UserRole, UserRolePreferences } from '@/types/roles';
import {
  getRoleConfig,
  getRoleDefinition,
  DEFAULT_ROLE,
} from '@/data/roles';
import {
  loadRolePreferences,
  saveRolePreferences,
  setCurrentRole,
} from '@/lib/roleStorage';

const RoleContextInstance = createContext<RoleContext | undefined>(undefined);

interface RoleProviderProps {
  children: React.ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  // loadRolePreferences() is hydration-safe: returns defaults on server,
  // reads localStorage on client. This ensures consistent initial render.
  const [preferences, setPreferences] = useState<UserRolePreferences>(() =>
    loadRolePreferences()
  );
  const [currentRole, setCurrentRoleState] = useState<UserRole>(
    () => preferences.currentRole
  );
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark as hydrated after mount - this allows us to safely update state
  // based on localStorage without causing hydration mismatches
  useEffect(() => {
    // Re-read preferences to ensure we have the latest from localStorage
    // This handles the case where SSR returned defaults but client has stored values
    const loaded = loadRolePreferences();
    setPreferences(loaded);
    setCurrentRoleState(loaded.currentRole);
    setIsHydrated(true);
  }, []);

  // Switch to a new role
  const switchRole = (newRole: UserRole) => {
    setCurrentRoleState(newRole);
    setCurrentRole(newRole);

    // Update preferences
    const updated = {
      ...preferences,
      currentRole: newRole,
    };
    setPreferences(updated);
    saveRolePreferences(updated);

    // Trigger analytics event if available
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Role Switched', {
        from: currentRole,
        to: newRole,
      });
    }
  };

  // Update preferences
  const updatePreferences = (updates: Partial<UserRolePreferences>) => {
    const updated = {
      ...preferences,
      ...updates,
    };
    setPreferences(updated);
    saveRolePreferences(updated);
  };

  const value: RoleContext = {
    currentRole,
    roleConfig: getRoleConfig(currentRole),
    roleDefinition: getRoleDefinition(currentRole),
    switchRole,
    preferences,
    updatePreferences,
    isHydrated,
  };

  return (
    <RoleContextInstance.Provider value={value}>
      {children}
    </RoleContextInstance.Provider>
  );
}

/**
 * Hook to access role context
 */
export function useRole(): RoleContext {
  const context = useContext(RoleContextInstance);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

/**
 * Hook to get current role (simplified)
 */
export function useCurrentRole(): UserRole {
  const { currentRole } = useRole();
  return currentRole;
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: UserRole): boolean {
  const { currentRole } = useRole();
  return currentRole === role;
}

/**
 * Hook to get role terminology
 */
export function useRoleTerminology() {
  const { roleConfig } = useRole();
  return roleConfig.terminology;
}
