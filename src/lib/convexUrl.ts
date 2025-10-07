const FALLBACK_CONVEX_URL = "http://127.0.0.1:3999" as const;

const warnedMessages = new Set<string>();

const buildMissingConvexUrlMessage = (customMessage?: string) =>
  customMessage ?? "VITE_CONVEX_URL must be defined to connect to Convex.";

const warnOnce = (message: string) => {
  if (warnedMessages.has(message)) {
    return;
  }

  warnedMessages.add(message);
  console.warn(message);
};

export const resolveConvexUrl = (missingMessage?: string) => {
  const configuredUrl = import.meta.env.VITE_CONVEX_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  if (
    import.meta.env.MODE === "development" ||
    import.meta.env.MODE === "test"
  ) {
    const message = buildMissingConvexUrlMessage(missingMessage);
    warnOnce(
      `${message} Falling back to ${FALLBACK_CONVEX_URL} for local development and testing.`,
    );
    return FALLBACK_CONVEX_URL;
  }

  throw new Error(buildMissingConvexUrlMessage(missingMessage));
};
