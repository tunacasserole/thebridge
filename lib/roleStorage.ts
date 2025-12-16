/**
 * Role Storage Utilities
 *
 * Manages user role preferences in localStorage.
 */

import type { UserRole, UserRolePreferences } from '@/types/roles';
import { DEFAULT_ROLE } from '@/data/roles';

const STORAGE_KEY = 'thebridge_role_preferences';

/**
 * Default preferences structure
 */
function getDefaultPreferences(): UserRolePreferences {
  return {
    currentRole: DEFAULT_ROLE,
    favoriteAgents: {
      sre: [],
      pm: [],
    },
    recentAgents: {
      sre: [],
      pm: [],
    },
    roleViewPreferences: {
      sre: {
        dashboardLayout: 'detailed',
        agentFloorLayout: 'cards',
        agentFloorSortBy: 'category',
      },
      pm: {
        dashboardLayout: 'detailed',
        agentFloorLayout: 'cards',
        agentFloorSortBy: 'category',
      },
    },
    roleThemes: {
      sre: 'sre-emerald', // Default emerald theme for SRE
      pm: 'pm-violet', // Default violet theme for PM
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Load role preferences from localStorage
 */
export function loadRolePreferences(): UserRolePreferences {
  if (typeof window === 'undefined') {
    return getDefaultPreferences();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultPreferences();
    }

    const parsed = JSON.parse(stored) as UserRolePreferences;

    // Merge with defaults to ensure all fields exist
    return {
      ...getDefaultPreferences(),
      ...parsed,
      favoriteAgents: {
        ...getDefaultPreferences().favoriteAgents,
        ...parsed.favoriteAgents,
      },
      recentAgents: {
        ...getDefaultPreferences().recentAgents,
        ...parsed.recentAgents,
      },
      roleViewPreferences: {
        ...getDefaultPreferences().roleViewPreferences,
        ...parsed.roleViewPreferences,
      },
    };
  } catch (error) {
    console.error('Error loading role preferences:', error);
    return getDefaultPreferences();
  }
}

/**
 * Save role preferences to localStorage
 */
export function saveRolePreferences(
  preferences: UserRolePreferences
): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const toSave = {
      ...preferences,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch (error) {
    console.error('Error saving role preferences:', error);
    return false;
  }
}

/**
 * Get current role
 */
export function getCurrentRole(): UserRole {
  const preferences = loadRolePreferences();
  return preferences.currentRole;
}

/**
 * Set current role
 */
export function setCurrentRole(role: UserRole): boolean {
  const preferences = loadRolePreferences();
  preferences.currentRole = role;
  return saveRolePreferences(preferences);
}

/**
 * Add agent to favorites for a role
 */
export function addFavoriteAgent(role: UserRole, agentId: string): boolean {
  const preferences = loadRolePreferences();
  const favorites = preferences.favoriteAgents[role];

  if (!favorites.includes(agentId)) {
    preferences.favoriteAgents[role] = [...favorites, agentId];
    return saveRolePreferences(preferences);
  }

  return true;
}

/**
 * Remove agent from favorites for a role
 */
export function removeFavoriteAgent(role: UserRole, agentId: string): boolean {
  const preferences = loadRolePreferences();
  preferences.favoriteAgents[role] = preferences.favoriteAgents[role].filter(
    (id) => id !== agentId
  );
  return saveRolePreferences(preferences);
}

/**
 * Add agent to recent list for a role
 */
export function addRecentAgent(role: UserRole, agentId: string): boolean {
  const preferences = loadRolePreferences();
  const recents = preferences.recentAgents[role];

  // Remove if already exists
  const filtered = recents.filter((id) => id !== agentId);

  // Add to front
  preferences.recentAgents[role] = [agentId, ...filtered].slice(0, 10); // Keep max 10

  return saveRolePreferences(preferences);
}

/**
 * Get favorite agents for current role
 */
export function getFavoriteAgents(role?: UserRole): string[] {
  const preferences = loadRolePreferences();
  const targetRole = role || preferences.currentRole;
  return preferences.favoriteAgents[targetRole] || [];
}

/**
 * Get recent agents for current role
 */
export function getRecentAgents(role?: UserRole): string[] {
  const preferences = loadRolePreferences();
  const targetRole = role || preferences.currentRole;
  return preferences.recentAgents[targetRole] || [];
}

/**
 * Update view preferences for a role
 */
export function updateRoleViewPreferences(
  role: UserRole,
  updates: Partial<UserRolePreferences['roleViewPreferences'][UserRole]>
): boolean {
  const preferences = loadRolePreferences();
  preferences.roleViewPreferences[role] = {
    ...preferences.roleViewPreferences[role],
    ...updates,
  };
  return saveRolePreferences(preferences);
}

/**
 * Get view preferences for a role
 */
export function getRoleViewPreferences(
  role?: UserRole
): UserRolePreferences['roleViewPreferences'][UserRole] {
  const preferences = loadRolePreferences();
  const targetRole = role || preferences.currentRole;
  return preferences.roleViewPreferences[targetRole];
}

/**
 * Clear all role preferences (reset to defaults)
 */
export function clearRolePreferences(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing role preferences:', error);
    return false;
  }
}

/**
 * Export preferences (for backup/migration)
 */
export function exportRolePreferences(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const preferences = loadRolePreferences();
    return JSON.stringify(preferences, null, 2);
  } catch (error) {
    console.error('Error exporting role preferences:', error);
    return null;
  }
}

/**
 * Import preferences (from backup/migration)
 */
export function importRolePreferences(jsonString: string): boolean {
  try {
    const preferences = JSON.parse(jsonString) as UserRolePreferences;
    return saveRolePreferences(preferences);
  } catch (error) {
    console.error('Error importing role preferences:', error);
    return false;
  }
}

/**
 * Get theme ID for a specific role
 */
export function getRoleTheme(role?: UserRole): string {
  const preferences = loadRolePreferences();
  const targetRole = role || preferences.currentRole;
  return preferences.roleThemes[targetRole];
}

/**
 * Set theme for a specific role
 */
export function setRoleTheme(role: UserRole, themeId: string): boolean {
  const preferences = loadRolePreferences();
  preferences.roleThemes[role] = themeId;
  return saveRolePreferences(preferences);
}

/**
 * Get theme for current role
 */
export function getCurrentRoleTheme(): string {
  const preferences = loadRolePreferences();
  return preferences.roleThemes[preferences.currentRole];
}
