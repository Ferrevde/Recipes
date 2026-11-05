import { normalizeEmail, validatePassword } from "../utils/validation";
import {
  hashPassword,
  verifyPassword,
  createSession,
  getSessionUser,
  deleteSession,
  encodeBase64,
} from "../utils/crypto";

export interface AuthService {
  register(
    email: string,
    password: string,
  ): Promise<{
    user: { id: string; email: string; isAdmin: boolean };
    token: string;
    expiresAt: string;
  }>;
  login(
    email: string,
    password: string,
  ): Promise<{
    user: { id: string; email: string; isAdmin: boolean };
    token: string;
    expiresAt: string;
  }>;
  logout(request: Request): Promise<void>;
  me(
    request: Request,
  ): Promise<{ id: string; email: string; isAdmin: boolean } | null>;
}

export function createAuthService(db: D1Database): AuthService {
  return {
    async register(email, password) {
      const normEmail = normalizeEmail(email);
      if (!normEmail) throw new Error("Ongeldig e-mailadres");
      if (!validatePassword(password))
        throw new Error("Wachtwoord minstens 8 tekens");

      const { getUserByEmail } = await import("../db/users");
      const existing = await getUserByEmail(db, normEmail);
      if (existing) throw new Error("E-mailadres al in gebruik");

      const salt = crypto.getRandomValues(new Uint8Array(16));
      const passwordHash = await hashPassword(password, salt);

      const id = crypto.randomUUID();
      const { createUser } = await import("../db/users");
      await createUser(db, {
        id,
        email: normEmail,
        password_hash: encodeBase64(passwordHash),
        password_salt: encodeBase64(salt),
        is_admin: 0,
      });

      const session = await createSession(id, { DB: db });
      return {
        user: { email: normEmail, id, isAdmin: false },
        token: session.token,
        expiresAt: session.expiresAt,
      };
    },

    async login(email, password) {
      const normEmail = normalizeEmail(email);
      if (!normEmail || !validatePassword(password))
        throw new Error("Ongeldige inloggegevens");

      const { getUserByEmail } = await import("../db/users");
      const user = await getUserByEmail(db, normEmail);
      if (!user) throw new Error("Ongeldige inloggegevens");

      const valid = await verifyPassword(
        password,
        user.password_salt,
        user.password_hash,
      );
      if (!valid) throw new Error("Ongeldige inloggegevens");

      const session = await createSession(user.id, { DB: db });
      return {
        user: { email: user.email, id: user.id, isAdmin: user.is_admin === 1 },
        token: session.token,
        expiresAt: session.expiresAt,
      };
    },

    async logout(request: Request) {
      await deleteSession(request, { DB: db });
    },

    async me(request: Request) {
      return getSessionUser(request, { DB: db });
    },
  };
}
