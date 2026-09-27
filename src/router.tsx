import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getBasepath = (): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  const pathname = window.location.pathname;
  const match = pathname.match(/^(.*\/app)(?:\/|$)/);
  if (match) {
    return match[1]; // e.g. '/subtitle-sync/app' or '/app'
  }
  return undefined;
};

export const getRouter = () => {
  const queryClient = new QueryClient();

  if (typeof window !== "undefined") {
    // If URL ends with index.html, strip it cleanly so route matching works
    if (window.location.pathname.endsWith("/index.html")) {
      const cleanPath = window.location.pathname.replace(/\/index\.html$/, "") || "/";
      const newUrl = cleanPath + window.location.search + window.location.hash;
      window.history.replaceState(null, "", newUrl);
    }
    // If we're at basepath without trailing slash (e.g. /subtitle-sync/app), normalize with trailing slash
    const base = getBasepath();
    if (base && window.location.pathname === base) {
      window.history.replaceState(null, "", base + "/" + window.location.search + window.location.hash);
    }
  }

  const router = createRouter({
    routeTree,
    basepath: getBasepath(),
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
