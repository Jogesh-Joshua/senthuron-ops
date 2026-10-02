export function safeReturnPath(path: string): string {
  // If no path, go to dashboard
  if (!path) return "/";
  // Must start with a single slash (not double slash which is protocol-relative)
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return "/";
  }
  // Prevent returning to the auth endpoints
  if (path.startsWith("/api/auth")) {
    return "/";
  }
  return path;
}
