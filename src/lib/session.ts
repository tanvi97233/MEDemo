import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { readSession, SESSION_COOKIE, signSession } from "./session-token";

const SESSION_DAYS = 7;

export async function createSession(user: { id: string; role: string }) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  const record = await db.session.create({
    data: { userId: user.id, expiresAt },
  });
  const token = await signSession({
    sessionId: record.id,
    userId: user.id,
    role: user.role,
    expiresAt: expiresAt.toISOString(),
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const store = await cookies();
  const payload = await readSession(store.get(SESSION_COOKIE)?.value);
  if (payload)
    await db.session.deleteMany({
      where: { id: payload.sessionId, userId: payload.userId },
    });
  store.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await readSession(token);
  if (!payload) return null;
  const session = await db.session.findFirst({
    where: {
      id: payload.sessionId,
      userId: payload.userId,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organisationId: true,
        },
      },
    },
  });
  return session?.user ?? null;
});

export async function verifySession() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
