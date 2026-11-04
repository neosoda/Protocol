/** Escaping for authored HTML templates. Never interpolate arbitrary input without this helper. */
export function escapeHtml(input: unknown): string {
  return String(input).replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}
