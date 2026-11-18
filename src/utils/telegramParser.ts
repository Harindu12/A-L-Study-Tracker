export interface ParsedTelegramPart {
  id: string;
  name: string;
  title: string;
  videoLink: string;
}

const DAY_LINE_REGEX = /(?:^|[^\p{L}\p{N}])day\s*(\d+)\s*([|\-–—:])\s*(.*)$/iu;
const SEPARATOR_LINE_REGEX = /^[-\u2013\u2014\u2212\u2500-\u257F=_~*•·.\s\u2796]+$/;
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;

function isSeparatorLine(trimmedLine: string): boolean {
  if (!trimmedLine) return false;
  return SEPARATOR_LINE_REGEX.test(trimmedLine);
}

function isHeaderLine(trimmedLine: string): boolean {
  if (!trimmedLine) return false;
  // Strip leading/trailing non-letter, non-number characters (e.g., emojis, bullets)
  const stripped = trimmedLine.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim();
  if (!stripped) return false;
  return (
    /^(?:20\d{2}\s+)?REVISION$/i.test(stripped) ||
    /^FREE$/i.test(stripped) ||
    /^FREE\s+REVISION$/i.test(stripped)
  );
}

function extractUrlAndCleanText(rawText: string): { url: string; cleanedText: string } {
  const match = rawText.match(URL_REGEX);
  if (!match) {
    return { url: '', cleanedText: rawText.trim() };
  }

  let url = match[0];
  // Strip trailing closing parenthesis if it wasn't opened inside the URL
  while (url.endsWith(')') && (url.match(/\(/g)?.length || 0) < (url.match(/\)/g)?.length || 0)) {
    url = url.slice(0, -1);
  }
  // Strip trailing common sentence punctuation if attached
  url = url.replace(/[.,;!?]+$/, '');

  // Remove all http/https URLs from the title text
  let cleaned = rawText.replace(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi, '').trim();
  // Clean up dangling separator left immediately before where a URL was stripped
  cleaned = cleaned.replace(/\s+[|:\-–—]+$/, '').replace(/^[|:\-–—]+$/, '').trim();

  return { url, cleanedText: cleaned };
}

export function isValidHttpUrl(url?: string): boolean {
  if (!url) return false;
  return /^https?:\/\/\S+$/i.test(url.trim());
}

const BLOCK_TAGS = new Set([
  'DIV',
  'P',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
  'TR',
  'SECTION',
  'ARTICLE',
  'HEADER',
  'FOOTER',
]);

const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'HEAD', 'META', 'LINK', 'NOSCRIPT', 'TITLE']);

function isBlockNode(node: Node): boolean {
  return node.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((node as Element).tagName.toUpperCase());
}

function domRootToTelegramText(root: Node): string {
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || '').replace(/\r\n/g, '\n').replace(/\u00A0/g, ' ');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as Element;
    const tag = el.tagName.toUpperCase();

    if (SKIP_TAGS.has(tag)) {
      return '';
    }

    if (tag === 'BR') {
      return '\n';
    }

    if (tag === 'IMG') {
      return el.getAttribute('alt') || '';
    }

    let inner = '';
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      const childText = walk(child);
      if (!childText) continue;

      // Ignore source-indentation whitespace nodes sitting between block elements
      if (child.nodeType === Node.TEXT_NODE && /^[ \t]*\n[ \t\n]*$/.test(childText)) {
        const prevIsBlock = i > 0 && isBlockNode(el.childNodes[i - 1]);
        const nextIsBlock = i < el.childNodes.length - 1 && isBlockNode(el.childNodes[i + 1]);
        if (prevIsBlock || nextIsBlock || tag === 'BODY') {
          continue;
        }
      }

      if (isBlockNode(child)) {
        if (inner.length > 0 && !inner.endsWith('\n')) {
          inner += '\n';
        }
        inner += childText;
        if (!inner.endsWith('\n')) {
          inner += '\n';
        }
      } else {
        inner += childText;
      }
    }

    if (tag === 'A') {
      const href = (el.getAttribute('href') || '').trim();
      if (isValidHttpUrl(href) && inner.trim() && !inner.includes(href)) {
        const match = inner.match(/^([\s\S]*?)(\n*)$/);
        const body = (match ? match[1] : inner).replace(/[ \t]+$/, '');
        const trailingNewlines = match ? match[2] : '';
        return `${body} ${href}${trailingNewlines}`;
      }
    }

    return inner;
  };

  const raw = walk(root);
  return raw
    .replace(/^\n+/, '')
    .replace(/\n+$/, '')
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Converts clipboard HTML (e.g. rich text copied from Telegram) to plain text,
 * keeping visible text and line breaks intact and appending ` <url>` right after
 * each `<a href="http(s)://...">` link's visible text on the same line.
 * Returns empty string if HTML is empty or parsing fails.
 */
export function convertTelegramHtmlToText(html: string): string {
  if (!html || !html.trim() || typeof DOMParser === 'undefined') {
    return '';
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    if (!doc || !doc.body) return '';
    return domRootToTelegramText(doc.body);
  } catch {
    return '';
  }
}

/**
 * Extracts normalized plain text (preserving line breaks and converting any native
 * `<a href="http(s)://...">` elements into inline URLs) from a live contentEditable element.
 */
export function extractTextFromRichElement(el: HTMLElement): string {
  return domRootToTelegramText(el);
}

/**
 * Extracts all valid http:// or https:// URLs from a multi-line bulk links input,
 * preserving their order of appearance.
 */
export function extractHttpUrls(input: string): string[] {
  if (!input || !input.trim()) return [];
  const matches = input.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi);
  if (!matches) return [];

  return matches
    .map((raw) => {
      let url = raw.trim();
      while (url.endsWith(')') && (url.match(/\(/g)?.length || 0) < (url.match(/\)/g)?.length || 0)) {
        url = url.slice(0, -1);
      }
      return url.replace(/[.,;!?]+$/, '');
    })
    .filter((url) => isValidHttpUrl(url));
}

/**
 * Parses a pasted Telegram post into structured lesson parts.
 * Rules:
 * - Finds every line containing "DAY" followed by a number (case-insensitive, with or without leading emoji),
 *   a separator ("|", "-", "–", "—" or ":"), and a title.
 * - Joins any non-matching continuation line directly below a DAY line with a space.
 * - Ignores dash separator lines and header lines like "2026 REVISION" and "FREE".
 * - Captures http:// or https:// URLs on the DAY line or its continuation lines as videoLink.
 */
export function parseTelegramPost(input: string): ParsedTelegramPart[] {
  if (!input || !input.trim()) return [];

  const lines = input.split(/\r?\n/);
  const results: ParsedTelegramPart[] = [];
  let currentEntry: ParsedTelegramPart | null = null;
  let canContinueTitle = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      canContinueTitle = false;
      continue;
    }

    if (isSeparatorLine(trimmed)) {
      canContinueTitle = false;
      continue;
    }

    if (isHeaderLine(trimmed)) {
      canContinueTitle = false;
      continue;
    }

    const dayMatch = trimmed.match(DAY_LINE_REGEX);
    if (dayMatch) {
      const dayNumber = parseInt(dayMatch[1], 10);
      const paddedNum = String(dayNumber).padStart(2, '0');
      const name = `Day ${paddedNum}`;
      const rawTitlePart = dayMatch[3] || '';
      const { url, cleanedText } = extractUrlAndCleanText(rawTitlePart);

      currentEntry = {
        id: `tg_${i}_${paddedNum}`,
        name,
        title: cleanedText,
        videoLink: url,
      };
      results.push(currentEntry);
      canContinueTitle = true;
      continue;
    }

    if (currentEntry) {
      if (canContinueTitle) {
        const { url, cleanedText } = extractUrlAndCleanText(trimmed);
        if (url && !currentEntry.videoLink) {
          currentEntry.videoLink = url;
        }
        if (cleanedText) {
          currentEntry.title = currentEntry.title
            ? `${currentEntry.title} ${cleanedText}`
            : cleanedText;
        }
      } else if (isValidHttpUrl(trimmed) && !currentEntry.videoLink) {
        currentEntry.videoLink = trimmed;
      }
    }
  }

  return results;
}
