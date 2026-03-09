const normalizePlainTextSpacing = (value: string): string =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const normalizeInlineTextSpacing = (value: string): string =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]{2,}/g, " ");

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const hasHtmlTag = (value: string): boolean => /<\/?[a-z][\s\S]*>/i.test(value);

export const toDescriptionHtml = (value: string): string => {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "<p></p>";
  if (hasHtmlTag(normalized)) return normalized;

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p>${escapeHtml(chunk).replace(/\n/g, "<br>")}</p>`);

  return paragraphs.length > 0 ? paragraphs.join("") : "<p></p>";
};

export const normalizeDescriptionHtml = (value: string): string => {
  const raw = toDescriptionHtml(value);
  if (!raw) return "<p></p>";

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return raw || "<p></p>";
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(raw, "text/html");

  documentNode.querySelectorAll("script,style,iframe,object,embed").forEach((node) => node.remove());

  const blockSelector = "p,li,blockquote,h1,h2,h3,h4,h5,h6";
  documentNode.querySelectorAll(blockSelector).forEach((node) => {
    const text = normalizePlainTextSpacing(node.textContent ?? "");
    if (!text && !node.querySelector("br")) {
      node.remove();
      return;
    }

    if (text) {
      // Keep formatting tags inside block while normalizing text-only nodes.
      node.childNodes.forEach((child) => {
        if (child.nodeType !== Node.TEXT_NODE) return;
        child.textContent = normalizeInlineTextSpacing(child.textContent ?? "");
      });
    }
  });

  const htmlWithBlockSpacing = documentNode.body.innerHTML
    .replace(/<\/(p|li|blockquote|h[1-6])>\s*</gi, "</$1>\n<");

  let normalized = htmlWithBlockSpacing
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/<p>\s*<\/p>/gi, "<p><br></p>")
    .trim();

  if (!normalized) normalized = "<p></p>";
  return normalized;
};
