import type { DefaultSession, User as DefaultUser } from "@auth/core/types";
import type { Role } from "@prisma/client";

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}

declare module "@auth/core/types" {
  interface User extends DefaultUser {
    role?: Role;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}