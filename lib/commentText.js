// Older SLIC comments (before 2026-10-07) are Tiptap HTML. This flattens one
// to plain text: paragraphs, line breaks and list items become line breaks,
// every tag is dropped and entities are decoded. It never builds a DOM, so it
// runs anywhere (the render, the edit box, scripts/convertHtmlComments.mjs),
// and its output is only ever rendered as text, never parsed as HTML
// (docs/SECURITY.md #2).

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X'
        ? parseInt(name.slice(2), 16)
        : parseInt(name.slice(1), 10);
      if (code === 0xa0) return ' ';
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    }
    return NAMED[name.toLowerCase()] ?? entity;
  });
}

export function htmlToText(html) {
  const text = (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h[1-6]|blockquote|pre)>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  return decodeEntities(text)
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
