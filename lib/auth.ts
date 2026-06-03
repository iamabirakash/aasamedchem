import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureSchema, sql } from "./db";
import { verifyPassword } from "./passwords";

export type Role = "admin" | "seller" | "buyer";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

const cookieName = "aasamedchem_session";

function getSecret() {
  return process.env.AUTH_SECRET ?? "local-dev-secret-change-me";
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodeSession(user: CurrentUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token?: string): CurrentUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CurrentUser;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(cookieName)?.value);
}

export async function requireUser(role?: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) {
    redirect(user.role === "admin" ? "/admin" : user.role === "seller" ? "/seller" : "/products");
  }
  return user;
}

export async function login(email: string, password: string) {
  await ensureSchema();
  const rows = await sql`
    SELECT id, name, email, role, password_hash
    FROM users
    WHERE lower(email) = lower(${email})
    LIMIT 1
  `;
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error("Invalid email or password");
  }
  const currentUser: CurrentUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const cookieStore = await cookies();
  cookieStore.set(cookieName, encodeSession(currentUser), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return currentUser;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}
