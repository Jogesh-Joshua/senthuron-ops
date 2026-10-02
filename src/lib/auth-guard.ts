import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";
import { UnauthorizedError } from "./errors";

export async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ? { id: session.user.id, name: session.user.name, email: session.user.email } : null;
}

export async function requireUser(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user) {
    throw new UnauthorizedError("Please sign in to make changes.");
  }
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}
