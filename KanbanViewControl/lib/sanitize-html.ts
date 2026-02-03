import * as DOMPurifyNs from "dompurify";
const DOMPurify = (DOMPurifyNs as { default?: typeof DOMPurifyNs }).default ?? DOMPurifyNs;

/** Default allowed HTML tags for card HTML fields (same as pcf-html-display). */
const DEFAULT_ALLOWED_TAGS = "p,br,b,i,u,strong,em,a,ul,ol,li,table,thead,tbody,tr,th,td";
/** Default allowed attributes for card HTML fields (e.g. href for links). */
const DEFAULT_ALLOWED_ATTR = "href";

/**
 * Sanitizes HTML using DOMPurify with a configurable whitelist of allowed tags and attributes.
 * Prevents XSS by stripping scripts, event handlers, and disallowed markup.
 *
 * @param html - Raw HTML string (e.g. from a Dataverse field).
 * @param allowedTagsRaw - Comma-separated list of allowed tag names. Empty = no tags (all HTML stripped). Default: p,br,b,i,u,strong,em,a,ul,ol,li,table,thead,tbody,tr,th,td.
 * @param allowedAttrsRaw - Comma-separated list of allowed attributes (e.g. href). Empty = no attributes. Default: href.
 * @returns Sanitized HTML safe to assign to innerHTML.
 */
export function sanitizeHtml(
  html: string,
  allowedTagsRaw?: string | null,
  allowedAttrsRaw?: string | null
): string {
  const tagsRaw = allowedTagsRaw?.trim() ?? DEFAULT_ALLOWED_TAGS;
  const attrsRaw = allowedAttrsRaw?.trim() ?? DEFAULT_ALLOWED_ATTR;
  const allowedTags = tagsRaw
    ? tagsRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
  const allowedAttr = attrsRaw
    ? attrsRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttr,
    FORCE_BODY: true,
  });
}
