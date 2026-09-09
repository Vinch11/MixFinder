/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { setPendingNotificationId } from "./lib/pendingNotification";

declare const self: ServiceWorkerGlobalScope;

// Standard injectManifest boilerplate — replaces what generateSW used to
// wire up automatically.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const navigationRoute = new NavigationRoute(createHandlerBoundToURL("/index.html"), {
  denylist: [/^\/~oauth/],
});
registerRoute(navigationRoute);

// Lets PWAUpdatePrompt's "Mettre à jour" button (updateServiceWorker(true))
// activate the waiting worker instead of it sitting there until every tab
// closes — registerType: "prompt" relies on this message.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// --- Push notifications ---------------------------------------------

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  /** Big image shown in the native notification and in the in-app "bigger view". */
  image?: string;
  /** id of the corresponding notifications row, appended to the deep link so the
   * app can open the bigger view for this exact notification. */
  notificationId?: string;
  /** Label for the single admin-configurable action button, if any. */
  actionLabel?: string;
  /** "open" navigates into the app; "dismiss" just closes the notification. */
  actionType?: "open" | "dismiss";
}

self.addEventListener("push", (event) => {
  let payload: PushPayload = { title: "Two4Coaching", body: "Nouvelle notification" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Non-JSON push payloads are unexpected from send-push, but never let
    // a malformed message silently drop the notification.
    if (event.data) payload.body = event.data.text();
  }

  const options: NotificationOptions & { image?: string; actions?: { action: string; title: string }[] } = {
    body: payload.body,
    icon: payload.icon || "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    image: payload.image || undefined,
    data: { url: payload.url || "/", notificationId: payload.notificationId },
  };
  if (payload.actionLabel) {
    options.actions = [{ action: payload.actionType === "dismiss" ? "dismiss" : "open", title: payload.actionLabel }];
  }

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // The "Fermer" action just dismisses — a push notification has no real
  // capability to close an app/tab, this is the closest safe equivalent.
  if (event.action === "dismiss") return;

  const data = (event.notification.data || {}) as { url?: string; notificationId?: string };
  const basePath = data.url || "/";
  const targetUrl = data.notificationId
    ? `${basePath}${basePath.includes("?") ? "&" : "?"}notif=${data.notificationId}`
    : basePath;

  event.waitUntil(
    (async () => {
      if (data.notificationId) await setPendingNotificationId(data.notificationId);

      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = clientsList[0] as WindowClient | undefined;
      if (existing) {
        if ("navigate" in existing) await existing.navigate(targetUrl);
        await existing.focus();
      } else {
        // iOS Home Screen web apps unreliably honor this URL when
        // relaunching an already-installed app — it often reopens at the
        // manifest's start_url instead. The pending-notification id saved
        // above is the fallback NotificationBigView checks on mount.
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
