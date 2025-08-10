import { User } from '../api/auth';
import { Competition } from '../api/competitions';

/**
 * Check if a user can edit a specific competition
 * @param user - The current user
 * @param competition - The competition to check permissions for
 * @returns true if the user can edit the competition, false otherwise
 */
export const canEditCompetition = (user: User | null, competition: Competition): boolean => {
  if (!user) {
    return false;
  }

  // Admins can edit all competitions
  if (user.role === 'ADMIN') {
    return true;
  }

  // Creators can only edit competitions they created
  if (user.role === 'CREATOR') {
    return competition.owner_id === user.id;
  }

  return false;
};

/**
 * Check if a user is an admin
 * @param user - The current user
 * @returns true if the user is an admin, false otherwise
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'ADMIN';
};

/**
 * Check if a user is a creator
 * @param user - The current user
 * @returns true if the user is a creator, false otherwise
 */
export const isCreator = (user: User | null): boolean => {
  return user?.role === 'CREATOR';
};
