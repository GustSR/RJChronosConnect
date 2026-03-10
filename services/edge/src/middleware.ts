import { auth } from "./auth";

const USER_ID_HEADER = "X-User-Id";
const USER_EMAIL_HEADER = "X-User-Email";
const SANITIZE_HEADERS = [USER_ID_HEADER, USER_EMAIL_HEADER];

/**
 * Valida a sessao Better Auth e retorna headers para injetar no proxy.
 * Se a sessao for invalida, retorna objeto vazio.
 */
export async function getAuthHeaders(
  request: Request
): Promise<Record<string, string>> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return {};
    }

    return {
      [USER_ID_HEADER]: session.user.id,
      [USER_EMAIL_HEADER]: session.user.email,
    };
  } catch {
    return {};
  }
}

/**
 * Remove headers de auth vindos do cliente para evitar spoofing.
 */
export function sanitizeRequest(request: Request): Request {
  const headers = new Headers(request.headers);
  for (const header of SANITIZE_HEADERS) {
    headers.delete(header);
  }

  return new Request(request.url, {
    method: request.method,
    headers,
    body: request.body,
    // @ts-expect-error - Bun supports duplex
    duplex: "half",
  });
}
