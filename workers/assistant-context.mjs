const PAGE_GUIDES = Object.freeze({
  dashboard: "আজ পেজে আজকের তারিখ অনুযায়ী কাছের ভর্তি ডেডলাইন, সংক্ষিপ্ত ক্যালেন্ডার, সম্ভাব্য তারিখ ও নতুন নোটিশের সারাংশ দেখানো হয়।",
  calendar: "ক্যালেন্ডার পেজে ভর্তি কার্যক্রম তালিকা, মাস/সপ্তাহ ভিউ, সার্চ এবং বিশ্ববিদ্যালয়, ইউনিট ও ইভেন্টের ধরন অনুযায়ী ফিল্টার থাকে।",
  universities: "ভার্সিটি পেজে বিশ্ববিদ্যালয়ের তালিকা, সার্চ এবং প্রতিষ্ঠানের বিস্তারিত ভর্তি তথ্য দেখা যায়।",
  info: "বিশ্ববিদ্যালয়ের বিস্তারিত অংশে যোগ্যতা, আবেদন, পরীক্ষা, আসন/সিলেবাস ও তথ্যসূত্র দেখানো হয়।",
  notices: "নোটিশ পেজে নতুন বিজ্ঞপ্তি, অফিসিয়াল ও গৌণ সূত্রের পার্থক্য, যাচাই অবস্থা এবং উৎসের লিংক দেখা যায়।",
  profile: "আমি পেজে ব্যবহারকারীর পছন্দ, লক্ষ্য, ক্যালেন্ডার ফিল্টার ও রিমাইন্ডার সেটিংস এই ডিভাইসে পরিচালনা করা যায়।"
});

const COLLECTIONS = Object.freeze([
  "universities", "admissionCycles", "admissionDetails", "events",
  "examCenters", "circulars", "notices", "sources"
]);
const OMIT_KEYS = /^(?:notes?|personal|personaldata|private|password|passwd|secret|token|email|phone|address|localstorage|preferences|user|userinput|ip|device|session|cookie|authorization)$/i;
const GENERIC = new Set([
  "কবে", "কী", "কি", "কেন", "কোথায়", "কোথায়", "কিভাবে", "কীভাবে", "বল", "বলো", "জানাও", "জানতে", "দাও", "আছে", "হবে", "হয়", "হয়", "আমার", "এই", "সেই", "কোন", "কোনটি", "কোনটা", "এর", "ও", "আর", "তে", "র", "জন্য", "ভর্তি", "পরীক্ষা", "পরীক্ষার", "ইউনিট", "unit", "বিশ্ববিদ্যালয়", "বিশ্ববিদ্যাল", "তথ্য", "please", "what", "when", "where", "which", "how", "is", "the", "for", "about", "tell", "me"
]);
const ALIASES = Object.freeze({
  "ঢাবি": ["ঢাকা", "বিশ্ববিদ্যালয়", "DU"],
  "রাবি": ["রাজশাহী", "বিশ্ববিদ্যালয়", "RU"],
  "চবি": ["চট্টগ্রাম", "বিশ্ববিদ্যালয়", "CU"],
  "জাবি": ["জাহাঙ্গীরনগর", "বিশ্ববিদ্যালয়", "JU"],
  "জবি": ["জগন্নাথ", "বিশ্ববিদ্যালয়", "JnU"],
  "কুবি": ["কুমিল্লা", "বিশ্ববিদ্যালয়", "CoU"],
  "বুয়েট": ["বাংলাদেশ", "প্রকৌশল", "বিশ্ববিদ্যালয়", "BUET"],
  "বুয়েট": ["বাংলাদেশ", "প্রকৌশল", "বিশ্ববিদ্যালয়", "BUET"],
  "কুয়েট": ["খুলনা", "প্রকৌশল", "প্রযুক্তি", "বিশ্ববিদ্যালয়", "KUET"],
  "কুয়েট": ["খুলনা", "প্রকৌশল", "প্রযুক্তি", "বিশ্ববিদ্যালয়", "KUET"],
  "রুয়েট": ["রাজশাহী", "প্রকৌশল", "প্রযুক্তি", "বিশ্ববিদ্যালয়", "RUET"],
  "রুয়েট": ["রাজশাহী", "প্রকৌশল", "প্রযুক্তি", "বিশ্ববিদ্যালয়", "RUET"],
  "মেডিকেল": ["MBBS", "চিকিৎসা", "DGME"],
  "কৃষি": ["Agricultural Cluster", "কৃষি গুচ্ছ"],
  "গুচ্ছ": ["GST", "সাধারণ", "বিজ্ঞান", "প্রযুক্তি"]
});

const FIELD_LABELS = Object.freeze({
  id: "আইডি", name: "নাম", shortName: "সংক্ষিপ্ত নাম", university: "বিশ্ববিদ্যালয়",
  universityId: "বিশ্ববিদ্যালয় আইডি", institutionGroup: "প্রতিষ্ঠানের ধরন", title: "শিরোনাম",
  unit: "ইউনিট", unitName: "ইউনিট", unitGroup: "ইউনিট", cycleId: "ভর্তি চক্র", cycleLabel: "শিক্ষাবর্ষ", session: "শিক্ষাবর্ষ",
  type: "কার্যক্রমের ধরন", date: "তারিখ", dateOnly: "তারিখ", dateRange: "তারিখের পরিসর",
  startsAt: "শুরুর সময়", endsAt: "শেষ সময়", time: "সময়", publishedAt: "প্রকাশের তারিখ",
  description: "বিবরণ", summary: "সারাংশ", status: "যাচাই অবস্থা", statusLabel: "যাচাইয়ের অবস্থা",
  verification: "যাচাই", sourceId: "তথ্যসূত্র আইডি", sourceLabel: "তথ্যসূত্র", sourceType: "সূত্রের ধরন",
  sourceUrl: "উৎসের লিংক", url: "লিংক", documentUrl: "বিজ্ঞপ্তির লিংক", officialWebsite: "অফিসিয়াল ওয়েবসাইট",
  admissionWebsite: "ভর্তি ওয়েবসাইট", fee: "ফি", applicationFee: "আবেদন ফি", totalFee: "মোট ফি",
  eligibility: "যোগ্যতা", exam: "পরীক্ষা", seats: "আসন", syllabus: "সিলেবাস",
  venue: "কেন্দ্র", format: "পরীক্ষার ধরন", reviewStatus: "পর্যালোচনার অবস্থা",
  changeNote: "পরিবর্তনের নোট", lastVerifiedAt: "সর্বশেষ যাচাই", retrievedAt: "তথ্য সংগ্রহের তারিখ",
  supports: "সূত্র যে তথ্য সমর্থন করে", applicationWindow: "আবেদনের সময়", year: "শিক্ষাবর্ষ", label: "সূত্রের নাম", documentReference: "নথির উল্লেখ", programmes: "প্রোগ্রাম"
});

function normalize(value) {
  return String(value ?? "").normalize("NFKC").toLocaleLowerCase("bn-BD")
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .replace(/(য়ের|ে|এর|র|কে|টি|টা|গুলো|গুলোর|সমূহ)$/u, "");
}

function termsFor(question) {
  const normalizedQuestion = normalize(question);
  const raw = normalizedQuestion.match(/[\p{L}\p{M}\p{N}]+/gu) || [];
  const terms = new Set();
  for (const term of raw) {
    if (term.length < 2 || GENERIC.has(term)) continue;
    terms.add(term);
    for (const alias of ALIASES[term] || []) {
      const normalized = normalize(alias);
      if (normalized.length > 1 && !GENERIC.has(normalized)) terms.add(normalized);
    }
  }
  for (const letter of ["a", "b", "c", "d"]) {
    if (new RegExp(`(?:unit|ইউনিট)\\s*${letter}\\b`, "i").test(normalizedQuestion)) terms.add(`unit ${letter}`);
  }
  return [...terms].slice(0, 24);
}

function safeString(value, max = 260) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ").slice(0, max).trim();
}

const DATE_FORMAT = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka" });
const DATE_FIELDS = new Set(["dateOnly", "startsAt", "endsAt", "opensAt", "closesAt", "publishedAt", "lastVerifiedAt", "retrievedAt", "availableFrom", "availableUntil"]);

function compactValue(value, depth = 0, keyHint = "") {
  if (depth > 3 || value == null) return undefined;
  if (typeof value === "string") {
    const clean = safeString(value, 220);
    if (DATE_FIELDS.has(keyHint)) {
      const parsed = /^\d{4}-\d{2}-\d{2}$/.test(clean) ? new Date(`${clean}T00:00:00Z`) : new Date(clean);
      if (!Number.isNaN(parsed.getTime())) {
        const localized = keyHint === "dateOnly" ? DATE_FORMAT.format(parsed) : DATE_TIME_FORMAT.format(parsed);
        return `${clean} (${localized})`;
      }
    }
    return clean || undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const items = value.slice(0, 5).map((item) => compactValue(item, depth + 1, keyHint)).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (OMIT_KEYS.test(key)) continue;
      const compact = compactValue(child, depth + 1, key);
      if (compact !== undefined) out[key] = compact;
      if (Object.keys(out).length >= 18) break;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}

function compactRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  const out = {};
  for (const [key, value] of Object.entries(record)) {
    if (OMIT_KEYS.test(key)) continue;
    if (!(key in FIELD_LABELS) && !["admissionDetailId", "cycleId", "dateRange", "verification", "exam", "application", "official", "probable", "minimumCombinedGpa", "minimumHscGpa", "minimumSscGpa", "unitGroup", "session", "programmes", "documentReference", "totalSeats", "group"].includes(key)) continue;
    const compact = compactValue(value);
    if (compact !== undefined) out[FIELD_LABELS[key] || key] = compact;
    if (Object.keys(out).length >= 18) break;
  }
  return Object.keys(out).length ? out : null;
}

function relatedRecords(record, data, terms) {
  const related = [];
  const cycles = Array.isArray(data.admissionCycles) ? data.admissionCycles : [];
  const details = Array.isArray(data.admissionDetails) ? data.admissionDetails : [];
  const universities = Array.isArray(data.universities) ? data.universities : [];
  let cycle = record.cycleId ? cycles.find((item) => item.id === record.cycleId) : null;
  if (!cycle && record.universityId) cycle = cycles.find((item) => item.universityId === record.universityId);
  if (cycle) {
    related.push(cycle);
    const university = universities.find((item) => item.id === cycle.universityId);
    if (university) related.push(university);
    if (record.admissionDetailId) {
      const detail = details.find((item) => item.id === record.admissionDetailId);
      if (detail) related.push(detail);
    } else if (!record.appliesToAllUnits) {
      const matchingDetail = details
        .filter((item) => item.cycleId === cycle.id)
        .map((item) => ({ item, score: scoreRecord(item, terms) }))
        .sort((a, b) => b.score - a.score)[0];
      if (matchingDetail && matchingDetail.score >= 3) related.push(matchingDetail.item);
    }
  }
  if (record.universityId) {
    const university = universities.find((item) => item.id === record.universityId);
    if (university) related.push(university);
  }
  const sourceIds = [record.sourceId, ...(record.verification?.sources || []).map((item) => item?.sourceId)].filter(Boolean);
  for (const sourceId of sourceIds) {
    const source = (Array.isArray(data.sources) ? data.sources : []).find((item) => item.id === sourceId);
    if (source) related.push(source);
  }
  return related;
}

function scoreRecord(record, terms, related = []) {
  const haystack = normalize(JSON.stringify([record, ...related]));
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += term.includes(" ") || term.length >= 5 ? 3 : 1;
  }
  return score;
}

function addWithRelations(selected, record, data, terms) {
  if (!record || typeof record !== "object") return;
  const queue = [record, ...relatedRecords(record, data, terms)];
  for (const item of queue) {
    if (!item || typeof item !== "object" || !item.id || selected.has(item.id) || selected.size >= 8) continue;
    selected.set(item.id, item);
    if (item.universityId) {
      const university = (data.universities || []).find((entry) => entry.id === item.universityId);
      if (university && !selected.has(university.id) && selected.size < 8) selected.set(university.id, university);
    }
  }
}

export function buildRelevantContext(data, question, page = "") {
  if (!data || typeof data !== "object" || typeof question !== "string") return "";
  const terms = termsFor(question);
  const scored = [];
  for (const collection of COLLECTIONS) {
    const records = Array.isArray(data[collection]) ? data[collection] : [];
    for (const record of records) {
      const related = relatedRecords(record, data, terms);
      const score = scoreRecord(record, terms, related);
      if (score >= 4) scored.push({ record, score, related });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const selected = new Map();
  for (const item of scored.slice(0, 4)) addWithRelations(selected, item.record, data, terms);

  const pageDescription = PAGE_GUIDES[page];
  const asksAboutPage = /পেজ|পাতা|বাটন|অংশ|এখানে|ক্যালেন্ডার|ফিল্টার|নোটিশ|ভার্সিটি|আমি পেজ/u.test(question);
  const lines = [];
  if (pageDescription && asksAboutPage) lines.push(`বর্তমান পেজ (${page}): ${pageDescription}`);
  if (selected.size) {
    lines.push("সাইটের প্রাসঙ্গিক ভর্তি-তথ্য (রেকর্ড):");
    for (const record of selected.values()) {
      const compact = compactRecord(record);
      if (compact) lines.push(JSON.stringify(compact));
    }
  }
  return lines.join("\n").slice(0, 3800);
}

export const ASSISTANT_PAGE_GUIDES = PAGE_GUIDES;
