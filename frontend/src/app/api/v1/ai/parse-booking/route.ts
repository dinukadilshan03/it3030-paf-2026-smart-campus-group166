import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiBaseUrl } from "@/lib/config/env";

type Confidence = "high" | "medium" | "low";
type ResourceResolution = "resolved" | "unresolved";
type MatchMethod =
  | "exact-name"
  | "exact-code"
  | "prefix"
  | "contains"
  | "token-match"
  | "fuzzy";

interface BackendResource {
  id: number;
  resourceCode: string;
  name: string;
  status: string;
}

interface ParsedBooking {
  resourceQuery: string;
  resourceName: string;
  resourceId: string;
  resourceResolution: ResourceResolution;
  matchScore: number | null;
  matchedBy: MatchMethod | null;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  purpose: string;
}

interface ParseBookingResponse {
  confidence: Confidence;
  parsed: ParsedBooking | null;
  clarification: string | null;
  summary: string;
}

interface LlmParsedBooking {
  resourceQuery: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  purpose: string;
  clarification: string | null;
}

interface ResourceMatch {
  resource: BackendResource;
  score: number;
  matchedBy: MatchMethod;
}

const ACCEPTANCE_SCORE = 0.82;
const CLEAR_WIN_MARGIN = 0.05;

function getCurrentDateTimeString(): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  return `${dayName}, ${date} ${time}`;
}

function createSystemPrompt(): string {
  return `You are a helpful booking assistant for a university resource management system. Your job is to parse natural language booking requests into structured data.

Current date and time: ${getCurrentDateTimeString()}

Return ONLY a raw JSON object with this exact structure:
{
  "resourceQuery": "string or null",
  "date": "YYYY-MM-DD or null",
  "startTime": "HH:MM or null",
  "endTime": "HH:MM or null",
  "durationMinutes": "number or null",
  "purpose": "string",
  "clarification": "string or null"
}

Rules:
- Extract the user's resource phrase exactly enough for later matching. Do not invent resource IDs or canonical names.
- Resolve relative dates using the current date above.
- Parse time formats like "2pm", "2:30pm", "14:00", "10am-12pm", "10 to 12".
- "afternoon" means 14:00, "morning" means 09:00, "evening" means 18:00.
- If a duration is given, calculate endTime when possible.
- If only startTime is given with no duration and no endTime, set durationMinutes to 60 and compute endTime.
- If no purpose is stated, return a short generic purpose like "General booking".
- Use clarification only when important booking details besides the exact resource ID are missing.

Return raw JSON only. No markdown. No prose.`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function sanitizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function sanitizeDate(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function sanitizeTime(value: unknown): string | null {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value) ? value : null;
}

function sanitizeDuration(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

function addMinutes(time: string, minutesToAdd: number): string {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(" ") : [];
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j += 1) {
      prev[j] = curr[j];
    }
  }

  return prev[b.length];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function scoreResourceMatch(query: string, resource: BackendResource): ResourceMatch | null {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return null;

  const normalizedName = normalizeText(resource.name);
  const normalizedCode = normalizeText(resource.resourceCode);

  if (normalizedQuery === normalizedName) {
    return { resource, score: 1, matchedBy: "exact-name" };
  }

  if (normalizedCode && normalizedQuery === normalizedCode) {
    return { resource, score: 0.99, matchedBy: "exact-code" };
  }

  if (
    (normalizedName.startsWith(normalizedQuery) && normalizedQuery.length >= 3) ||
    (normalizedCode && normalizedCode.startsWith(normalizedQuery) && normalizedQuery.length >= 2)
  ) {
    return { resource, score: 0.93, matchedBy: "prefix" };
  }

  if (
    (normalizedName.includes(normalizedQuery) && normalizedQuery.length >= 3) ||
    (normalizedCode && normalizedCode.includes(normalizedQuery) && normalizedQuery.length >= 2)
  ) {
    return { resource, score: 0.88, matchedBy: "contains" };
  }

  const queryTokens = tokenize(query);
  const nameTokens = tokenize(resource.name);
  const codeTokens = tokenize(resource.resourceCode);
  const combinedTokens = new Set([...nameTokens, ...codeTokens]);
  const overlap = queryTokens.filter((token) => combinedTokens.has(token)).length;

  if (queryTokens.length > 0 && overlap > 0) {
    const coverage = overlap / queryTokens.length;
    const resourceCoverage = overlap / Math.max(1, combinedTokens.size);
    const tokenScore = 0.72 + coverage * 0.18 + resourceCoverage * 0.08;
    if (coverage >= 0.75) {
      return {
        resource,
        score: Math.min(tokenScore, 0.96),
        matchedBy: "token-match",
      };
    }
  }

  const fuzzyScore = Math.max(
    similarity(normalizedQuery, normalizedName),
    normalizedCode ? similarity(normalizedQuery, normalizedCode) : 0
  );

  if (fuzzyScore >= 0.78) {
    return {
      resource,
      score: Math.min(0.68 + fuzzyScore * 0.22, 0.9),
      matchedBy: "fuzzy",
    };
  }

  return null;
}

function resolveResource(
  resourceQuery: string | null,
  resources: BackendResource[]
): {
  resolution: ResourceResolution;
  resource: BackendResource | null;
  score: number | null;
  matchedBy: MatchMethod | null;
} {
  if (!resourceQuery) {
    return {
      resolution: "unresolved",
      resource: null,
      score: null,
      matchedBy: null,
    };
  }

  const matches = resources
    .map((resource) => scoreResourceMatch(resourceQuery, resource))
    .filter((match): match is ResourceMatch => match !== null)
    .sort((a, b) => b.score - a.score);

  const bestMatch = matches[0];
  const secondMatch = matches[1];

  if (!bestMatch) {
    return {
      resolution: "unresolved",
      resource: null,
      score: null,
      matchedBy: null,
    };
  }

  const clearWin =
    !secondMatch ||
    bestMatch.score - secondMatch.score >= CLEAR_WIN_MARGIN ||
    bestMatch.score >= 0.95;

  if (bestMatch.score >= ACCEPTANCE_SCORE && clearWin) {
    return {
      resolution: "resolved",
      resource: bestMatch.resource,
      score: bestMatch.score,
      matchedBy: bestMatch.matchedBy,
    };
  }

  return {
    resolution: "unresolved",
    resource: null,
    score: bestMatch.score,
    matchedBy: bestMatch.matchedBy,
  };
}

function validateConfidence(
  resourceResolved: boolean,
  date: string | null,
  startTime: string | null
): Confidence {
  const missing = [!resourceResolved, !date, !startTime].filter(Boolean).length;
  if (missing === 0) return "high";
  if (missing === 1) return "medium";
  return "low";
}

function buildSummary(parsed: ParsedBooking | null): string {
  if (!parsed) return "Incomplete booking request";
  if (parsed.resourceName && parsed.date && parsed.startTime) {
    let summary = `${parsed.resourceName} · ${parsed.date} · ${parsed.startTime}`;
    if (parsed.endTime) summary += `-${parsed.endTime}`;
    if (parsed.purpose) summary += ` · ${parsed.purpose}`;
    return summary;
  }
  if (parsed.resourceName && parsed.date) {
    return `${parsed.resourceName} · ${parsed.date}`;
  }
  if (parsed.resourceName) {
    return parsed.resourceName;
  }
  if (parsed.resourceQuery) {
    return parsed.resourceQuery;
  }
  return "Incomplete booking request";
}

function fallbackClarification(
  resourceQuery: string | null,
  date: string | null,
  startTime: string | null
): string | null {
  const missing: string[] = [];
  if (!resourceQuery) missing.push("resource");
  if (!date) missing.push("date");
  if (!startTime) missing.push("time");

  if (missing.length === 0) return null;
  if (missing.length === 1) {
    return `Please provide the ${missing[0]} for your booking request.`;
  }
  return `Please provide the ${missing.slice(0, -1).join(", ")} and ${missing.at(-1)} for your booking request.`;
}

function extractResourceQuery(input: string): string | null {
  const patterns = [
    /(?:book|reserve)\s+(.+?)(?=\s+(?:today|tomorrow|next|this|on|at|from|for|by)\b|$)/i,
    /^(.+?)(?=\s+(?:today|tomorrow|next|this|on|at|from|for)\b)/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate) return candidate;
  }

  return null;
}

function parseRelativeDate(input: string): string | null {
  const lowerInput = input.toLowerCase();
  const now = new Date();

  if (lowerInput.includes("today")) {
    return now.toISOString().split("T")[0];
  }

  if (lowerInput.includes("tomorrow")) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  for (const [index, weekday] of weekdays.entries()) {
    if (!lowerInput.includes(weekday)) continue;

    const target = new Date(now);
    const currentDay = target.getDay();
    let delta = (index - currentDay + 7) % 7;
    if (lowerInput.includes(`next ${weekday}`) || delta === 0) {
      delta = delta || 7;
    }
    target.setDate(target.getDate() + delta);
    return target.toISOString().split("T")[0];
  }

  return null;
}

function parseTimeAndDuration(input: string): {
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
} {
  const lowerInput = input.toLowerCase();

  const rangeMatch =
    lowerInput.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/) ??
    null;

  if (rangeMatch) {
    const startTime = toTwentyFourHour(rangeMatch[1], rangeMatch[2], rangeMatch[3], rangeMatch[6]);
    const endTime = toTwentyFourHour(rangeMatch[4], rangeMatch[5], rangeMatch[6], rangeMatch[3]);
    if (startTime && endTime) {
      return {
        startTime,
        endTime,
        durationMinutes: minutesBetween(startTime, endTime),
      };
    }
  }

  let startTime: string | null = null;
  const timeMatch =
    lowerInput.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ??
    lowerInput.match(/\b(\d{1,2}):(\d{2})\b/) ??
    null;

  if (timeMatch) {
    startTime = toTwentyFourHour(timeMatch[1], timeMatch[2], timeMatch[3]);
  } else if (lowerInput.includes("afternoon")) {
    startTime = "14:00";
  } else if (lowerInput.includes("morning")) {
    startTime = "09:00";
  } else if (lowerInput.includes("evening")) {
    startTime = "18:00";
  }

  const durationMatch = lowerInput.match(/(\d+)\s*(hours?|hrs?|minutes?|mins?)/i);
  let durationMinutes: number | null = null;
  if (durationMatch) {
    const value = Number.parseInt(durationMatch[1], 10);
    durationMinutes = durationMatch[2].toLowerCase().startsWith("hour") || durationMatch[2].toLowerCase().startsWith("hr")
      ? value * 60
      : value;
  }

  let endTime: string | null = null;
  if (startTime && durationMinutes) {
    endTime = addMinutes(startTime, durationMinutes);
  } else if (startTime) {
    durationMinutes = 60;
    endTime = addMinutes(startTime, durationMinutes);
  }

  return { startTime, endTime, durationMinutes };
}

function toTwentyFourHour(
  hoursText: string,
  minutesText?: string,
  meridiem?: string,
  fallbackMeridiem?: string
): string | null {
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText ?? "0", 10);
  const suffix = (meridiem ?? fallbackMeridiem ?? "").toLowerCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) {
    return null;
  }

  let normalizedHours = hours;
  if (suffix === "pm" && normalizedHours < 12) normalizedHours += 12;
  if (suffix === "am" && normalizedHours === 12) normalizedHours = 0;

  if ((!suffix && normalizedHours > 23) || normalizedHours > 23) {
    return null;
  }

  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function minutesBetween(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  let delta = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  if (delta <= 0) delta += 1440;
  return delta;
}

function createHeuristicParse(input: string): LlmParsedBooking {
  const { startTime, endTime, durationMinutes } = parseTimeAndDuration(input);

  return {
    resourceQuery: extractResourceQuery(input),
    date: parseRelativeDate(input),
    startTime,
    endTime,
    durationMinutes,
    purpose: "General booking",
    clarification: fallbackClarification(extractResourceQuery(input), parseRelativeDate(input), startTime),
  };
}

async function parseWithModel(input: string): Promise<LlmParsedBooking> {
  if (!process.env.GOOGLE_API_KEY) {
    return createHeuristicParse(input);
  }

  try {
    const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: createSystemPrompt(),
    });

    const result = await model.generateContent(`Parse this booking request: "${input.trim()}"`);
    const cleanText = stripMarkdown(result.response.text());
    const parsedData = JSON.parse(cleanText) as Record<string, unknown>;

    const resourceQuery = sanitizeString(parsedData.resourceQuery);
    const date = sanitizeDate(parsedData.date);
    const startTime = sanitizeTime(parsedData.startTime);
    const rawEndTime = sanitizeTime(parsedData.endTime);
    const durationMinutes = sanitizeDuration(parsedData.durationMinutes);
    const purpose = sanitizeString(parsedData.purpose) ?? "General booking";
    const clarification = sanitizeString(parsedData.clarification);
    const endTime =
      rawEndTime ?? (startTime && durationMinutes ? addMinutes(startTime, durationMinutes) : null);

    return {
      resourceQuery,
      date,
      startTime,
      endTime,
      durationMinutes: durationMinutes ?? (startTime ? minutesBetween(startTime, endTime ?? addMinutes(startTime, 60)) : null),
      purpose,
      clarification,
    };
  } catch (error) {
    console.error("Parse-booking LLM error:", error);
    return createHeuristicParse(input);
  }
}

async function fetchActiveResources(request: NextRequest): Promise<BackendResource[]> {
  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/resources?status=ACTIVE`, {
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(authorization ? { Authorization: authorization } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch resources for booking AI:", response.status, response.statusText);
      return [];
    }

    const data = (await response.json()) as BackendResource[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Resource lookup failed for booking AI:", error);
    return [];
  }
}

function createResponse(
  llmParsed: LlmParsedBooking,
  resourceResolution: ReturnType<typeof resolveResource>
): ParseBookingResponse {
  const parsedFieldsPresent = Boolean(
    llmParsed.resourceQuery ||
      llmParsed.date ||
      llmParsed.startTime ||
      llmParsed.endTime ||
      llmParsed.durationMinutes ||
      llmParsed.purpose
  );

  const parsed: ParsedBooking | null = parsedFieldsPresent
    ? {
        resourceQuery: llmParsed.resourceQuery ?? "",
        resourceName: resourceResolution.resource?.name ?? "",
        resourceId: resourceResolution.resource ? String(resourceResolution.resource.id) : "",
        resourceResolution: resourceResolution.resolution,
        matchScore: resourceResolution.score,
        matchedBy: resourceResolution.matchedBy,
        date: llmParsed.date ?? "",
        startTime: llmParsed.startTime ?? "",
        endTime: llmParsed.endTime ?? "",
        durationMinutes: llmParsed.durationMinutes ?? 60,
        purpose: llmParsed.purpose || "General booking",
      }
    : null;

  const clarification =
    llmParsed.clarification ??
    (llmParsed.resourceQuery && resourceResolution.resolution === "unresolved"
      ? `I couldn't confidently match "${llmParsed.resourceQuery}" to a resource. Please use a more specific name or code.`
      : fallbackClarification(
          llmParsed.resourceQuery,
          llmParsed.date,
          llmParsed.startTime
        ));

  const confidence = validateConfidence(
    resourceResolution.resolution === "resolved",
    llmParsed.date,
    llmParsed.startTime
  );

  return {
    confidence,
    parsed,
    clarification,
    summary: buildSummary(parsed),
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { input?: unknown };
    const input = typeof body.input === "string" ? body.input.trim() : "";

    if (!input) {
      return NextResponse.json(
        { error: "Input must be a non-empty string" },
        { status: 400 }
      );
    }

    if (input.length > 500) {
      return NextResponse.json(
        { error: "Input must be under 500 characters" },
        { status: 400 }
      );
    }

    const [llmParsed, resources] = await Promise.all([
      parseWithModel(input),
      fetchActiveResources(request),
    ]);

    const resourceResolution = resolveResource(llmParsed.resourceQuery, resources);
    const response = createResponse(llmParsed, resourceResolution);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Unexpected parse-booking error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
