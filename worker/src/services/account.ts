export interface AccountService {
  getFavorites(userId: string): Promise<string[]>;
  saveFavorites(userId: string, ids: string[]): Promise<void>;
  getWeekMenu(userId: string): Promise<Record<string, string>>;
  saveWeekMenu(userId: string, menu: Record<string, string>): Promise<void>;
}

export function createAccountService(db: D1Database): AccountService {
  return {
    async getFavorites(userId) {
      const { getFavorites } = await import("../db/users");
      return getFavorites(db, userId);
    },
    async saveFavorites(userId, ids) {
      const { saveFavorites } = await import("../db/users");
      await saveFavorites(db, userId, ids);
    },
    async getWeekMenu(userId) {
      const { getWeekMenu } = await import("../db/users");
      return getWeekMenu(db, userId);
    },
    async saveWeekMenu(userId, menu) {
      const { saveWeekMenu } = await import("../db/users");
      await saveWeekMenu(db, userId, menu);
    },
  };
}
