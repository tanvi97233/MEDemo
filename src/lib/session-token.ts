import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "evalcanvas_session";
export type SessionPayload = {
  sessionId: string;
  userId: string;
  role: string;
  expiresAt: string;
};

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(payload.expiresAt))
    .sign(key());
}

export async function readSession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ["HS256"],
    });
    if (
      !payload.sessionId ||
      !payload.userId ||
      !payload.role ||
      !payload.expiresAt
    )
      return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
