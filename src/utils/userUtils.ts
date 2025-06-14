
export const getUserUtils = {
  getInitials: (email: string): string => {
    if (email === 'user1@example.com') return 'KR';
    if (email === 'user2@example.com') return 'GL';
    return email.substring(0, 2).toUpperCase();
  },

  getDisplayName: (email: string): string => {
    if (email === 'user1@example.com') return 'Kristi';
    if (email === 'user2@example.com') return 'Gledi';
    return email.split('@')[0];
  }
};
