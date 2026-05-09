export const logError = (message, error) => {
  if (import.meta.env.DEV) {
    // Keep detailed logs out of production builds to reduce information leakage.
    console.error(message, error);
  }
};
