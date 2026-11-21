import createClient from "openapi-fetch";
import type { paths, components } from "./api-schema";
export type Product = components["schemas"]["Product"];
export type Variant = components["schemas"]["Variant"];
export type Cart = components["schemas"]["Cart"];
export type Order = components["schemas"]["Order"];
export type Session = components["schemas"]["Session"];
export type Inventory = components["schemas"]["Inventory"];
export type Movement = components["schemas"]["Movement"];
export type Audit = components["schemas"]["Audit"];
let sessionPromise: Promise<Session> | undefined;
export function setSession(session: Session) {
  sessionPromise = Promise.resolve(session);
}
export function getSession(): Promise<Session> {
  if (!sessionPromise)
    sessionPromise = fetch("/api/v1/session", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (r) => {
        if (!r.ok)
          throw new Error("ارتباط با فروشگاه برقرار نشد. دوباره تلاش کنید.");
        return (await r.json()) as Session;
      })
      .catch((e) => {
        sessionPromise = undefined;
        throw e;
      });
  return sessionPromise;
}
export const api = createClient<paths>({
  credentials: "same-origin",
  cache: "no-store",
});
api.use({
  async onRequest({ request }) {
    if (!request.url.endsWith("/catalog")) {
      const session = await getSession();
      if (request.method !== "GET")
        request.headers.set("X-CSRF-Token", session.csrf);
    }
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) sessionPromise = undefined;
    return response;
  },
});
export function unwrap<T>(result: {
  data?: T;
  error?: components["schemas"]["Error"];
}): T {
  if (result.error) throw new Error(result.error.error.message);
  if (result.data === undefined)
    throw new Error("پاسخ فروشگاه کامل نیست. دوباره تلاش کنید.");
  return result.data;
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "خطایی رخ داد. دوباره تلاش کنید.";
}
