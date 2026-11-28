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

// Leading bullets / decorative symbols to trim cleanly from extracted titles
const LEADING_BULLET_REGEX = /^[\s•·▪▫▸▹►▶👉👈👇👆🔹🔸🔷🔶📌📍✅✔☑🎬🎥📹📺🔗✨🔥⚡⭐🌟➤➔➜➡-]+/u;

// Common link-only CTA phrases that shouldn't become or pollute part names/titles
const LINK_CTA_ONLY_REGEX =
  /^(?:watch(?:\s+(?:now|here|video|recording|class|lesson))?|click\s+here|tap\s+here|video(?:\s+link)?|link|recording|youtube|drive\s+link|zoom\s+link|class\s+link|open|play)[\s:|\-–—]*$/i;

const TRAILING_CTA_REGEX =
  /[\s|:\-–—]+(?:watch(?:\s+(?:now|here|video|recording|class|lesson))?|click\s+here|tap\s+here|video\s+link|drive\s+link|zoom\s+link|class\s+link|link)\s*$/i;

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

function normalizeUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  while (url.endsWith(')') && (url.match(/\(/g)?.length || 0) < (url.match(/\)/g)?.length || 0)) {
    url = url.slice(0, -1);
  }
  return url.replace(/[.,;!?]+$/, '');
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

function cleanLinkedSegmentText(rawText: string): string {
  let cleaned = cleanTitleFragments(rawText);
  if (!cleaned) return '';
  if (LINK_CTA_ONLY_REGEX.test(cleaned)) return '';
  const withoutTrailingCta = cleanTitleFragments(cleaned.replace(TRAILING_CTA_REGEX, ''));
  if (withoutTrailingCta && !LINK_CTA_ONLY_REGEX.test(withoutTrailingCta)) {
    return withoutTrailingCta;
  }
  return LINK_CTA_ONLY_REGEX.test(cleaned) ? '' : cleaned;
}

function extractUrlAndCleanText(rawText: string): { url: string; cleanedText: string } {
  const match = rawText.match(URL_REGEX);
  if (!match) {
    return { url: '', cleanedText: cleanTitleFragments(rawText) };
  }

  const url = normalizeUrl(match[0]);
  const withoutUrls = rawText.replace(GLOBAL_URL_REGEX, ' ').trim();
  const cleanedText = cleanLinkedSegmentText(withoutUrls);

  return { url, cleanedText };
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
    .map((raw) => normalizeUrl(raw))
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

interface UrlSegment {
  text: string;
  url: string;
}

function splitLineByUrls(line: string): UrlSegment[] {
  const segments: UrlSegment[] = [];
  GLOBAL_URL_REGEX.lastIndex = 0;

  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = GLOBAL_URL_REGEX.exec(line)) !== null) {
    const url = normalizeUrl(m[0]);
    const rawText = line.slice(lastIndex, m.index);
    const cleanedText = cleanLinkedSegmentText(rawText);
    if (isValidHttpUrl(url)) {
      segments.push({ text: cleanedText, url });
    }
    lastIndex = m.index + m[0].length;
  }

  // Handle trailing descriptive text after the final URL (e.g. "https://youtu.be/1 - Vectors")
  if (segments.length > 0 && lastIndex < line.length) {
    const trailing = cleanLinkedSegmentText(line.slice(lastIndex));
    if (trailing && !segments[segments.length - 1].text) {
      segments[segments.length - 1].text = trailing;
    }
  }

  return segments;
}

/**
 * Parses a pasted Telegram post into structured lesson parts:
 * - Any text paired with a URL (either inline `<a href>` text or `text https://...`) becomes a part.
 * - Multiple links on a single line split into separate parts.
 * - Labeled markers (`Day 01`, `Part 02`, `Session 1`, `Lesson 03`, `දින 01`, etc.) anywhere in a
 *   segment/line keep their label as `name` and use remaining text as `title`.
 * - Unlabeled linked text uses the linked text itself as `name`.
 * - Mixed posts (combining `Day 01` entries and plain linked items) keep all items without dropping links.
 * - Supports multi-line `Title` -> `URL` pairs and linkless numbered/bulleted lists.
 */
export function parseTelegramPost(input: string): ParsedTelegramPart[] {
  if (!input || !input.trim()) return [];

  const lines = input.split(/\r?\n/);
  const results: ParsedTelegramPart[] = [];

  let activeEntry: ParsedTelegramPart | null = null;
  let activeIsBareHeader = false;
  let sawBlankSinceActive = false;
  let pendingTitleLines: string[] = [];
  let autoPartCounter = 0;

  const nextFallbackName = () => {
    autoPartCounter++;
    return `Part ${String(autoPartCounter).padStart(2, '0')}`;
  };

  const buildPartsFromSegmentText = (
    text: string,
    url: string,
    lineIdx: number,
    segIdx: number
  ): { parts: ParsedTelegramPart[]; wasLabeled: boolean } => {
    const tokens = findKeywordTokens(text);

    if (tokens.length > 0) {
      const primaryPrefix = tokens[0].labelPrefix;
      const sameFamilyTokens = tokens.filter((t) => t.labelPrefix === primaryPrefix);

      if (sameFamilyTokens.length > 1) {
        const multiParts: ParsedTelegramPart[] = [];
        for (let k = 0; k < sameFamilyTokens.length; k++) {
          const tok = sameFamilyTokens[k];
          const sliceStart = k === 0 ? 0 : tok.matchStart;
          const sliceEnd =
            k < sameFamilyTokens.length - 1 ? sameFamilyTokens[k + 1].matchStart : text.length;
          const subLine = text.slice(sliceStart, sliceEnd);
          const adjustedToken: KeywordTokenMatch = {
            ...tok,
            matchStart: tok.matchStart - sliceStart,
            matchEnd: tok.matchEnd - sliceStart,
          };
          const part = extractEntryFromTokenSpan(subLine, adjustedToken, lineIdx, segIdx * 10 + k);
          if (url && k === sameFamilyTokens.length - 1 && !part.videoLink) {
            part.videoLink = url;
          }
          multiParts.push(part);
        }
        return { parts: multiParts, wasLabeled: true };
      }

      const chosenToken = tokens.find((t) => t.labelPrefix === 'Day') || tokens[0];
      const part = extractEntryFromTokenSpan(text, chosenToken, lineIdx, segIdx);
      if (url && !part.videoLink) {
        part.videoLink = url;
      }
      return { parts: [part], wasLabeled: true };
    }

    const numMatch = text.match(LEADING_NUMBER_LIST_REGEX);
    if (numMatch) {
      const rawNum = numMatch[1] || numMatch[2] || numMatch[3];
      const num = parseInt(rawNum, 10);
      if (!isNaN(num) && num >= 1 && num <= 499) {
        const padded = String(num).padStart(2, '0');
        const restTitle = cleanLinkedSegmentText(numMatch[4] || '');
        return {
          parts: [
            {
              id: `tg_${lineIdx}_${segIdx}_num_${padded}`,
              name: `Part ${padded}`,
              title: restTitle,
              videoLink: url,
            },
          ],
          wasLabeled: true,
        };
      }
    }

    // Unlabeled linked text -> use the linked text itself as the part name
    const cleanName = cleanLinkedSegmentText(text);
    const finalName = cleanName || nextFallbackName();
    return {
      parts: [
        {
          id: `tg_${lineIdx}_${segIdx}_link_${results.length + 1}`,
          name: finalName,
          title: '',
          videoLink: url,
        },
      ],
      wasLabeled: false,
    };
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      if (sawBlankSinceActive && pendingTitleLines.length > 0) {
        pendingTitleLines = [];
      }
      sawBlankSinceActive = true;
      continue;
    }

    if (isSeparatorLine(trimmed) || isHeaderLine(trimmed)) {
      sawBlankSinceActive = true;
      pendingTitleLines = [];
      continue;
    }

    const urlSegments = splitLineByUrls(trimmed);

    if (urlSegments.length > 0) {
      // Single bare URL (or CTA + URL like "Watch Video https://...") with no descriptive text
      if (urlSegments.length === 1 && !urlSegments[0].text) {
        const url = urlSegments[0].url;
        if (activeEntry && !activeEntry.videoLink) {
          activeEntry.videoLink = url;
          activeIsBareHeader = false;
          pendingTitleLines = [];
          sawBlankSinceActive = false;
          continue;
        }

        if (pendingTitleLines.length > 0) {
          const combinedPending = cleanTitleFragments(pendingTitleLines.join(' '));
          pendingTitleLines = [];
          if (combinedPending) {
            const built = buildPartsFromSegmentText(combinedPending, url, i, 0);
            results.push(...built.parts);
            activeEntry = built.wasLabeled ? built.parts[built.parts.length - 1] : null;
            activeIsBareHeader = false;
            sawBlankSinceActive = false;
            continue;
          }
        }

        results.push({
          id: `tg_${i}_0_url_${results.length + 1}`,
          name: nextFallbackName(),
          title: '',
          videoLink: url,
        });
        activeEntry = null;
        activeIsBareHeader = false;
        pendingTitleLines = [];
        sawBlankSinceActive = false;
        continue;
      }

      // If previous line was a bare label header (e.g. "👉 Day 01") with no title & no link yet,
      // and this single-link line has unlabeled title text + link, attach both to that header entry
      if (
        urlSegments.length === 1 &&
        activeEntry &&
        activeIsBareHeader &&
        !activeEntry.title &&
        !activeEntry.videoLink &&
        findKeywordTokens(urlSegments[0].text).length === 0
      ) {
        activeEntry.title = urlSegments[0].text;
        activeEntry.videoLink = urlSegments[0].url;
        activeIsBareHeader = false;
        pendingTitleLines = [];
        sawBlankSinceActive = false;
        continue;
      }

      // Otherwise, every text+link segment on this line becomes its own part
      pendingTitleLines = [];
      for (let s = 0; s < urlSegments.length; s++) {
        const seg = urlSegments[s];
        const built = buildPartsFromSegmentText(seg.text, seg.url, i, s);
        results.push(...built.parts);
        activeEntry = built.wasLabeled ? built.parts[built.parts.length - 1] : null;
        activeIsBareHeader = false;
      }
      sawBlankSinceActive = false;
      continue;
    }

    // Line has NO URLs
    const tokens = findKeywordTokens(trimmed);
    if (tokens.length > 0) {
      pendingTitleLines = [];
      const built = buildPartsFromSegmentText(trimmed, '', i, 0);
      results.push(...built.parts);
      const last = built.parts[built.parts.length - 1] || null;
      activeEntry = last;
      activeIsBareHeader = Boolean(last && !last.title && !last.videoLink);
      sawBlankSinceActive = false;
      continue;
    }

    // Numbered list item without URL (when not continuing an untitled bare header)
    const numMatch = trimmed.match(LEADING_NUMBER_LIST_REGEX);
    if (numMatch && (!activeEntry || activeEntry.videoLink || sawBlankSinceActive || activeEntry.title)) {
      const rawNum = numMatch[1] || numMatch[2] || numMatch[3];
      const num = parseInt(rawNum, 10);
      if (!isNaN(num) && num >= 1 && num <= 499) {
        pendingTitleLines = [];
        const padded = String(num).padStart(2, '0');
        const restTitle = cleanTitleFragments(numMatch[4] || '');
        const part: ParsedTelegramPart = {
          id: `tg_${i}_0_num_${padded}`,
          name: `Part ${padded}`,
          title: restTitle,
          videoLink: '',
        };
        results.push(part);
        activeEntry = part;
        activeIsBareHeader = !restTitle;
        sawBlankSinceActive = false;
        continue;
      }
    }

    // Plain unlinked text line
    const cleanedLine = cleanTitleFragments(trimmed);
    if (!cleanedLine || LINK_CTA_ONLY_REGEX.test(cleanedLine)) {
      continue;
    }

    // Continue active labeled entry's title ONLY if it doesn't already have a link
    // (and either has no title yet, or immediately follows the header without a blank line)
    if (
      activeEntry &&
      !activeEntry.videoLink &&
      (!activeEntry.title || !sawBlankSinceActive)
    ) {
      activeEntry.title = activeEntry.title
        ? `${activeEntry.title} ${cleanedLine}`
        : cleanedLine;
      activeIsBareHeader = false;
      sawBlankSinceActive = false;
      continue;
    }

    // Otherwise store as pending title for a possible next-line URL (or linkless fallback)
    if (sawBlankSinceActive) {
      pendingTitleLines = [cleanedLine];
    } else {
      pendingTitleLines.push(cleanedLine);
    }
    activeEntry = null;
    activeIsBareHeader = false;
    sawBlankSinceActive = false;
  }

  // Fallback for posts with zero links and zero labeled/numbered lines (e.g., plain bulleted topics)
  if (results.length === 0) {
    const plainLines = lines
      .map((l) => l.trim())
      .filter((l) => l && !isSeparatorLine(l) && !isHeaderLine(l))
      .map((l) => cleanTitleFragments(l))
      .filter((l) => l && !LINK_CTA_ONLY_REGEX.test(l));

    plainLines.forEach((lineText, idx) => {
      const padded = String(idx + 1).padStart(2, '0');
      results.push({
        id: `tg_${idx}_fallback_${padded}`,
        name: `Part ${padded}`,
        title: lineText,
        videoLink: '',
      });
    });
  }

  return results;
}
