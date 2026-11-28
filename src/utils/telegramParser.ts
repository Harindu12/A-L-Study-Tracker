export interface ParsedTelegramPart {
  id: string;
  name: string;
  title: string;
  videoLink: string;
}

const SEPARATOR_LINE_REGEX = /^[-\u2013\u2014\u2212\u2500-\u257F=_~*•·.\s\u2796|]+$/;
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;
const GLOBAL_URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

const KEYWORD_MAP: Record<string, string> = {
  day: 'Day',
  'දින': 'Day',
  part: 'Part',
  'කොටස': 'Part',
  lesson: 'Lesson',
  'පාඩම': 'Lesson',
  session: 'Session',
  lecture: 'Lecture',
  lec: 'Lecture',
  video: 'Video',
  vid: 'Video',
  episode: 'Episode',
  ep: 'Episode',
  class: 'Class',
  unit: 'Unit',
  week: 'Week',
  topic: 'Topic',
};

// Matches keywords like Day 01, DAY02, (Day 3), [Part 04], දින 01 anywhere on a line
const KEYWORD_TOKEN_REGEX =
  /(?:^|[^\p{L}\p{N}])(?:[([{\s]*)?(day|දින|part|කොටස|lesson|පාඩම|session|lecture|lec|video|vid|episode|ep|class|unit|week|topic)\s*[-_.#:]?\s*0*(\d{1,3})(?![\p{L}\p{N}])(?:\s*[)\]}])?/giu;

// Matches numbered list markers at the start of a line (ignoring leading emojis/bullets)
const LEADING_NUMBER_LIST_REGEX =
  /^(?:[^\p{L}\p{N}\s]+\s*)*(?:\(?0*(\d{1,3})\)?[.):\-–—|]+\s+|0*(\d{1,3})\uFE0F?\u20E3\s*|#0*(\d{1,3})\b\s*[-–—:|]*\s*)(.*)$/u;

// Leading bullets / decorative emojis to trim cleanly from extracted titles
const LEADING_BULLET_REGEX = /^[\s•·▪▫▸▹►▶👉👈👇👆🔹🔸🔷🔶📌📍✅✔☑🎬🎥📹📺🔗✨🔥⚡⭐🌟➤➔➜➡-]+/u;

// Common link-only CTA phrases that shouldn't pollute lesson titles
const LINK_CTA_ONLY_REGEX =
  /^(?:watch(?:\s+(?:now|here|video|recording|class|lesson))?|click\s+here|tap\s+here|video(?:\s+link)?|link|recording|youtube|drive\s+link|zoom\s+link|class\s+link|open|play)[\s:|\-–—👉👇🔗]*$/i;

function isSeparatorLine(trimmedLine: string): boolean {
  if (!trimmedLine) return false;
  return SEPARATOR_LINE_REGEX.test(trimmedLine);
}

function isHeaderLine(trimmedLine: string): boolean {
  if (!trimmedLine) return false;
  const stripped = trimmedLine.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim();
  if (!stripped) return false;
  return (
    /^(?:20\d{2}\s+)?REVISION$/i.test(stripped) ||
    /^FREE$/i.test(stripped) ||
    /^FREE\s+REVISION$/i.test(stripped) ||
    /^(?:A\/L\s+)?20\d{2}(?:\s+A\/L)?$/i.test(stripped)
  );
}

function extractUrlAndCleanText(rawText: string): { url: string; cleanedText: string } {
  const match = rawText.match(URL_REGEX);
  if (!match) {
    return { url: '', cleanedText: cleanTitleFragments(rawText) };
  }

  let url = match[0];
  while (url.endsWith(')') && (url.match(/\(/g)?.length || 0) < (url.match(/\)/g)?.length || 0)) {
    url = url.slice(0, -1);
  }
  url = url.replace(/[.,;!?]+$/, '');

  const withoutUrls = rawText.replace(GLOBAL_URL_REGEX, ' ').trim();
  const cleanedText = cleanTitleFragments(withoutUrls);

  return { url, cleanedText: LINK_CTA_ONLY_REGEX.test(cleanedText) ? '' : cleanedText };
}

function cleanTitleFragments(text: string): string {
  const cleaned = text
    .replace(/\(\s*\)|\[\s*\]/g, ' ')
    .replace(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu, ' ')
    .replace(/\uFE0F/g, '')
    .replace(LEADING_BULLET_REGEX, '')
    .replace(/^[|:\-–—•·,;.\s]+/, '')
    .replace(/[|:\-–—•·,;\s]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return /[\p{L}\p{N}]/u.test(cleaned) ? cleaned : '';
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

export function extractTextFromRichElement(el: HTMLElement): string {
  return domRootToTelegramText(el);
}

export function extractHttpUrls(input: string): string[] {
  if (!input || !input.trim()) return [];
  const matches = input.match(GLOBAL_URL_REGEX);
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

interface KeywordTokenMatch {
  labelPrefix: string;
  num: number;
  padded: string;
  matchStart: number;
  matchEnd: number;
}

function findKeywordTokens(line: string): KeywordTokenMatch[] {
  // Mask URLs first so URL segments like /day-01 or /part-2 aren't mistaken for labels
  const maskedLine = line.replace(GLOBAL_URL_REGEX, (u) => ' '.repeat(u.length));
  const tokens: KeywordTokenMatch[] = [];
  KEYWORD_TOKEN_REGEX.lastIndex = 0;

  let m: RegExpExecArray | null;
  while ((m = KEYWORD_TOKEN_REGEX.exec(maskedLine)) !== null) {
    const rawKeyword = (m[1] || '').toLowerCase();
    const num = parseInt(m[2], 10);
    if (isNaN(num) || num < 1 || num > 499) continue;

    const fullMatch = m[0];
    // Preserve leading non-alnum boundary character outside the token removal span (using UTF-16 .length for surrogate emojis)
    const leadingBoundaryMatch = fullMatch.match(/^([^\p{L}\p{N}])/u);
    const offset =
      leadingBoundaryMatch && !/[([{]/.test(leadingBoundaryMatch[1])
        ? leadingBoundaryMatch[1].length
        : 0;

    tokens.push({
      labelPrefix: KEYWORD_MAP[rawKeyword] || 'Part',
      num,
      padded: String(num).padStart(2, '0'),
      matchStart: m.index + offset,
      matchEnd: m.index + fullMatch.length,
    });
  }

  return tokens;
}

function extractEntryFromTokenSpan(
  line: string,
  token: KeywordTokenMatch,
  lineIdx: number,
  subIdx: number
): ParsedTelegramPart {
  const before = cleanTitleFragments(line.slice(0, token.matchStart));
  const after = cleanTitleFragments(line.slice(token.matchEnd));
  const combinedRaw = [before, after].filter(Boolean).join(' — ');
  const { url, cleanedText } = extractUrlAndCleanText(combinedRaw);

  return {
    id: `tg_${lineIdx}_${subIdx}_${token.labelPrefix.toLowerCase()}_${token.padded}`,
    name: `${token.labelPrefix} ${token.padded}`,
    title: cleanedText,
    videoLink: url,
  };
}

function parseLabeledLines(lines: string[]): ParsedTelegramPart[] {
  const results: ParsedTelegramPart[] = [];
  let currentEntry: ParsedTelegramPart | null = null;
  let sawBlankSinceLastLine = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      sawBlankSinceLastLine = true;
      continue;
    }

    if (isSeparatorLine(trimmed) || isHeaderLine(trimmed)) {
      sawBlankSinceLastLine = true;
      continue;
    }

    const tokens = findKeywordTokens(trimmed);
    if (tokens.length > 0) {
      // Check if multiple items of the SAME label type are packed on one line (e.g. "Day 01 ... | Day 02 ...")
      const primaryPrefix = tokens[0].labelPrefix;
      const sameFamilyTokens = tokens.filter((t) => t.labelPrefix === primaryPrefix);

      if (sameFamilyTokens.length > 1) {
        for (let k = 0; k < sameFamilyTokens.length; k++) {
          const tok = sameFamilyTokens[k];
          const sliceStart = k === 0 ? 0 : tok.matchStart;
          const sliceEnd =
            k < sameFamilyTokens.length - 1 ? sameFamilyTokens[k + 1].matchStart : trimmed.length;
          const subLine = trimmed.slice(sliceStart, sliceEnd);
          const adjustedToken: KeywordTokenMatch = {
            ...tok,
            matchStart: tok.matchStart - sliceStart,
            matchEnd: tok.matchEnd - sliceStart,
          };
          currentEntry = extractEntryFromTokenSpan(subLine, adjustedToken, i, k);
          results.push(currentEntry);
        }
      } else {
        // Prefer an explicit "Day" token if both Day & Part appear (e.g., "DAY 01 | Mechanics Part 1")
        const chosenToken =
          tokens.find((t) => t.labelPrefix === 'Day') || tokens[0];
        currentEntry = extractEntryFromTokenSpan(trimmed, chosenToken, i, 0);
        results.push(currentEntry);
      }

      sawBlankSinceLastLine = false;
      continue;
    }

    // Continuation line for the active labeled entry
    if (currentEntry) {
      const { url, cleanedText } = extractUrlAndCleanText(trimmed);

      if (url && !currentEntry.videoLink) {
        currentEntry.videoLink = url;
      }

      // Populate title if it was empty (even across a blank line), or continue adjacent title lines
      if (cleanedText && (!currentEntry.title || !sawBlankSinceLastLine)) {
        currentEntry.title = currentEntry.title
          ? `${currentEntry.title} ${cleanedText}`
          : cleanedText;
      }

      sawBlankSinceLastLine = false;
    }
  }

  return results;
}

function parseNumberedListLines(lines: string[]): ParsedTelegramPart[] {
  const results: ParsedTelegramPart[] = [];
  let currentEntry: ParsedTelegramPart | null = null;
  let sawBlankSinceLastLine = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      sawBlankSinceLastLine = true;
      continue;
    }
    if (isSeparatorLine(trimmed) || isHeaderLine(trimmed)) {
      sawBlankSinceLastLine = true;
      continue;
    }

    const numMatch = trimmed.match(LEADING_NUMBER_LIST_REGEX);
    if (numMatch) {
      const rawNum = numMatch[1] || numMatch[2] || numMatch[3];
      const num = parseInt(rawNum, 10);
      if (!isNaN(num) && num >= 1 && num <= 499) {
        const padded = String(num).padStart(2, '0');
        const rest = numMatch[4] || '';
        const { url, cleanedText } = extractUrlAndCleanText(rest);
        currentEntry = {
          id: `tg_${i}_num_${padded}`,
          name: `Part ${padded}`,
          title: cleanedText,
          videoLink: url,
        };
        results.push(currentEntry);
        sawBlankSinceLastLine = false;
        continue;
      }
    }

    if (currentEntry) {
      const { url, cleanedText } = extractUrlAndCleanText(trimmed);
      if (url && !currentEntry.videoLink) {
        currentEntry.videoLink = url;
      }
      if (cleanedText && (!currentEntry.title || !sawBlankSinceLastLine)) {
        currentEntry.title = currentEntry.title
          ? `${currentEntry.title} ${cleanedText}`
          : cleanedText;
      }
      sawBlankSinceLastLine = false;
    }
  }

  return results;
}

function parseUnlabeledFallbackLines(lines: string[]): ParsedTelegramPart[] {
  const results: ParsedTelegramPart[] = [];
  let pendingTitleLines: string[] = [];
  let partCounter = 0;

  const flushEntry = (title: string, url: string, lineIdx: number) => {
    partCounter++;
    const padded = String(partCounter).padStart(2, '0');
    results.push({
      id: `tg_${lineIdx}_part_${padded}`,
      name: `Part ${padded}`,
      title: cleanTitleFragments(title),
      videoLink: url,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || isSeparatorLine(trimmed) || isHeaderLine(trimmed)) {
      if (pendingTitleLines.length > 0 && !trimmed) {
        // Keep up to 1 blank line only if next line has URL; otherwise keep pending text intact until URL or bullet
      }
      continue;
    }

    const { url, cleanedText } = extractUrlAndCleanText(trimmed);
    const hasBulletPrefix = /^[•·▪▫▸▹►▶👉👈👇👆🔹🔸🔷🔶📌📍✅✔☑🎬🎥📹📺✨🔥⚡⭐🌟➤➔➜➡-]\s*/u.test(
      trimmed
    );

    if (url) {
      if (cleanedText) {
        // Line itself has both title text and URL
        const combinedTitle =
          pendingTitleLines.length > 0 && !hasBulletPrefix
            ? `${pendingTitleLines.join(' ')} — ${cleanedText}`
            : cleanedText;
        if (pendingTitleLines.length > 0 && hasBulletPrefix) {
          flushEntry(pendingTitleLines.join(' '), '', i - 1);
        }
        flushEntry(combinedTitle, url, i);
        pendingTitleLines = [];
      } else if (pendingTitleLines.length > 0) {
        // Standalone URL (or CTA + URL) following title line(s)
        flushEntry(pendingTitleLines.join(' '), url, i);
        pendingTitleLines = [];
      } else {
        // URL with no title at all
        flushEntry('', url, i);
      }
      continue;
    }

    // No URL on this line
    if (cleanedText) {
      if (hasBulletPrefix && pendingTitleLines.length > 0) {
        flushEntry(pendingTitleLines.join(' '), '', i - 1);
        pendingTitleLines = [cleanedText];
      } else {
        pendingTitleLines.push(cleanedText);
      }
    }
  }

  // If the post had only bulleted/plain lines with no URLs at all, turn each pending line into a Part
  if (results.length === 0 && pendingTitleLines.length > 0) {
    pendingTitleLines.forEach((line, idx) => {
      flushEntry(line, '', idx);
    });
  } else if (pendingTitleLines.length > 0) {
    // Trailing title without a URL after URL-based items
    flushEntry(pendingTitleLines.join(' '), '', lines.length);
  }

  return results;
}

/**
 * Parses a pasted Telegram post into structured lesson parts across multiple formats:
 * 1. Labeled markers anywhere on a line (Day 01, Part 02, Session 1, Lesson 03, දින 01, etc.)
 * 2. Numbered lists (1., 02), #3, 1️⃣) assigned Part 01, Part 02...
 * 3. Unlabeled bullet lists or alternating Title + URL blocks assigned Part 01, Part 02...
 */
export function parseTelegramPost(input: string): ParsedTelegramPart[] {
  if (!input || !input.trim()) return [];

  const lines = input.split(/\r?\n/);

  // Strategy 1: Explicit labeled markers (Day 01, Part 01, Session 02, etc.) anywhere on a line
  const labeled = parseLabeledLines(lines);
  if (labeled.length > 0) {
    return labeled;
  }

  // Strategy 2: Numbered list items (1., 01), #1, 1️⃣)
  const numbered = parseNumberedListLines(lines);
  if (numbered.length > 0) {
    return numbered;
  }

  // Strategy 3: Unlabeled bullet lines or Title + Link pairs
  return parseUnlabeledFallbackLines(lines);
}
