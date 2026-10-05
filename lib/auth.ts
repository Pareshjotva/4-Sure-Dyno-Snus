import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getUserByEmail, getUserById } from "./db";
import type { User, UserRole } from "./types";

const COOKIE_NAME = "dyno_session";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dyno-snus-4sure-dev-secret-change-me"
);

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  province?: string;
};

function toSession(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    company: user.company,
    province: user.province,
  };
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function createSession(user: User) {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return toSession(user);
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const id = payload.sub;
    if (!id) return null;
    const user = await getUserById(id);
    if (!user || !user.active) return null;
    return toSession(user);
  } catch {
    return null;
  }
}

export async function requireSession(role?: UserRole) {
  const session = await getSession();
  if (!session) return null;
  if (role && session.role !== role) return null;
  return session;
}

export async function authenticate(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user || !user.active) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export { COOKIE_NAME };
