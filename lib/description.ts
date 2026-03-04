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

export const normalizeDescriptionHtml = (value: string): string => {
  const raw = value.trim();
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

  let normalized = documentNode.body.innerHTML
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/(?:<p>\s*<\/p>\s*)+/gi, "")
    .trim();

  if (!normalized) normalized = "<p></p>";
  return normalized;
};
