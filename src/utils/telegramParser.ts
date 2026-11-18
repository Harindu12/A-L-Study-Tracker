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
