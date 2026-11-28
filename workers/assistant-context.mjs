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
  "du": ["ঢাকা", "বিশ্ববিদ্যালয়", "ঢাবি"],
  "ru": ["রাজশাহী", "বিশ্ববিদ্যালয়", "রাবি"],
  "cu": ["চট্টগ্রাম", "বিশ্ববিদ্যালয়", "চবি"],
  "ju": ["জাহাঙ্গীরনগর", "বিশ্ববিদ্যালয়", "জাবি"],
  "jnu": ["জগন্নাথ", "বিশ্ববিদ্যালয়", "জবি"],
  "ku": ["খুলনা", "বিশ্ববিদ্যালয়"],
  "sust": ["শাহজালাল", "বিজ্ঞান", "প্রযুক্তি"],
  "cou": ["কুমিল্লা", "বিশ্ববিদ্যালয়", "কুবি"],
  "pust": ["পাবনা", "বিজ্ঞান", "প্রযুক্তি"],
  "cuet": ["চট্টগ্রাম", "প্রকৌশল", "প্রযুক্তি"],
  "ruet": ["রাজশাহী", "প্রকৌশল", "প্রযুক্তি"],
  "kuet": ["খুলনা", "প্রকৌশল", "প্রযুক্তি"],
  "butex": ["টেক্সটাইল", "বিশ্ববিদ্যালয়"],
  "bau": ["কৃষি", "বিশ্ববিদ্যালয়"],
  "mist": ["মিলিটারি", "বিজ্ঞান", "প্রযুক্তি"],
  "iut": ["ইসলামিক", "প্রযুক্তি"],
  "afmc": ["আর্মড", "ফোর্সেস", "মেডিকেল"],
  "gst": ["সাধারণ", "বিজ্ঞান", "প্রযুক্তি", "গুচ্ছ"],
  "agri": ["কৃষি", "গুচ্ছ"],
  "abedon": ["আবেদন", "application"],
  "apply": ["আবেদন", "application"],
  "porikkha": ["পরীক্ষা", "exam"],
  "exam": ["পরীক্ষা", "admission_test"],
  "joggota": ["যোগ্যতা", "eligibility"],
  "fee": ["ফি", "applicationFee"],
  "seat": ["আসন", "seats"],
  "syllabus": ["সিলেবাস"],
  "notice": ["নোটিশ", "বিজ্ঞপ্তি"],
  "circular": ["বিজ্ঞপ্তি", "circular"],
  "admit": ["প্রবেশপত্র", "admitCard"],
  "rabi": ["রাজশাহী", "বিশ্ববিদ্যালয়", "RU"],
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
    const compact = compactValue(value, 0, key);
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

const FOLLOW_UP_PATTERN = /ভালো করে|ভাল করে|আবার|দেখে বল|দেখো|যাচাই কর|যাচাই|আগের|ওটা|সেটা|তাহলে|আরও|নিশ্চিত|সত্যি|ঠিক তো|sure|source|সূত্র|প্রমাণ|লিংক|link|cite|citation|valo kore|bhalo kore|abar|dekhe bolo|dekho|check kore|verify kore|eta abar/i;
const SMALL_TALK_PATTERN = /^(?:hi|hello|hey|হাই|হ্যালো|আসসালামু আলাইকুম|সালাম|ধন্যবাদ|thanks|thank you|bye|goodbye|আচ্ছা|ঠিক আছে)[!.?\s]*$/i;
const SOURCE_REQUEST_PATTERN = /source|সূত্র|প্রমাণ|লিংক|link|cite|citation|reference/i;
const VERIFY_REQUEST_PATTERN = /sure|নিশ্চিত|সত্যি|ঠিক তো|ঠিক আছে তো|ভুল বলছ|বিশ্বাস করব/i;

function latestTopicQuestion(history) {
  if (!Array.isArray(history)) return "";
  for (let index = history.length - 1; index >= 0; index--) {
    const turn = history[index];
    if (!turn || turn.role !== "user" || typeof turn.content !== "string") continue;
    const content = safeString(turn.content, 500);
    if (!content || FOLLOW_UP_PATTERN.test(content) || SMALL_TALK_PATTERN.test(content)) continue;
    return content;
  }
  return "";
}

function questionWithHistory(question, history) {
  const previous = latestTopicQuestion(history);
  return previous && FOLLOW_UP_PATTERN.test(question) ? `${previous} ${question}` : question;
}

function matchingRecords(data, question) {
  const terms = termsFor(question);
  const matches = [];
  for (const collection of COLLECTIONS) {
    const records = Array.isArray(data[collection]) ? data[collection] : [];
    for (const record of records) {
      const related = relatedRecords(record, data, terms);
      const score = scoreRecord(record, terms, related);
      if (score >= 3) matches.push({ record, related, score });
    }
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
}

function sourceIdsFrom(record) {
  return [
    record?.sourceId,
    ...(Array.isArray(record?.verification?.sources) ? record.verification.sources.map((item) => item?.sourceId) : [])
  ].filter((id) => typeof id === "string");
}

function sourcesForMatches(data, matches) {
  const ids = new Set();
  for (const match of matches) {
    for (const record of [match.record, ...(match.related || [])]) {
      for (const id of sourceIdsFrom(record)) ids.add(id);
    }
  }
  const sources = Array.isArray(data.sources) ? data.sources : [];
  return [...ids].map((id) => sources.find((source) => source.id === id)).filter((source) =>
    source && typeof source.url === "string" && /^https:\/\//i.test(source.url)
  ).slice(0, 2);
}

function verificationLabel(status) {
  if (status === "officially_confirmed" || status === "authority_announced") return "অফিসিয়াল সূত্রে নিশ্চিত";
  if (status === "trusted_secondary" || status === "secondary_source") return "বিশ্বস্ত গৌণ সূত্রে পাওয়া";
  if (status === "pending" || status === "needs_review") return "এখনো পুরোপুরি যাচাই হয়নি";
  return "";
}

function formatRecordDate(record) {
  const raw = record?.startsAt || record?.dateOnly || record?.exam?.startsAt || record?.application?.closesAt;
  if (typeof raw !== "string") return "";
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00Z`) : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return DATE_TIME_FORMAT.format(parsed);
}

export function resolveSmallTalkAnswer(question) {
  if (typeof question !== "string") return null;
  const clean = question.trim();
  if (/^(?:hi|hello|hey|হাই|হ্যালো|আসসালামু আলাইকুম|সালাম)[!.?\s]*$/i.test(clean)) {
    return "হ্যালো! ভর্তি ক্যালেন্ডারের বিশ্ববিদ্যালয়, আবেদন, যোগ্যতা, পরীক্ষা, তারিখ ও সূত্র নিয়ে প্রশ্ন করতে পারো।";
  }
  if (/^(?:ধন্যবাদ|thanks|thank you)[!.?\s]*$/i.test(clean)) return "স্বাগতম। ভর্তি-সংক্রান্ত আর কোনো তথ্য জানতে চাইলে প্রশ্ন করো।";
  if (/^(?:bye|goodbye)[!.?\s]*$/i.test(clean)) return "আবার কথা হবে।";
  if (/আমি কী কী জানতে পারি|তুমি কী করতে পার|what can you do|help me/i.test(clean)) {
    return "বিশ্ববিদ্যালয়ভিত্তিক আবেদন, যোগ্যতা, ফি, ইউনিট, ভর্তি পরীক্ষা, আসন, সিলেবাস, নোটিশ ও তথ্যসূত্র সম্পর্কে ক্যালেন্ডারের রেকর্ড থেকে উত্তর দিতে পারি।";
  }
  return null;
}

export function resolveFollowUpAnswer(data, question, history = []) {
  if (!data || typeof data !== "object" || typeof question !== "string") return null;
  const sourceRequest = SOURCE_REQUEST_PATTERN.test(question);
  const verifyRequest = VERIFY_REQUEST_PATTERN.test(question);
  if (!sourceRequest && !verifyRequest) return null;
  const topic = latestTopicQuestion(history);
  if (!topic) return null;
  const matches = matchingRecords(data, topic);
  if (!matches.length) return null;
  const sources = sourcesForMatches(data, matches);
  if (sourceRequest) {
    if (!sources.length) return null;
    return `তথ্যসূত্র: ${sources.map((source) => `${safeString(source.label || source.id, 180)} — ${source.url}`).join(" | ")}`;
  }
  const best = matches[0].record;
  const related = matches[0].related || [];
  const status = verificationLabel(best.verification?.status) ||
    verificationLabel(related.find((item) => item?.verification?.status)?.verification?.status);
  const date = formatRecordDate(best) || related.map(formatRecordDate).find(Boolean) || "";
  if (!status) return "ক্যালেন্ডারের রেকর্ডে তথ্যটি আছে, তবে এর যাচাইয়ের অবস্থা নিশ্চিত নয়।";
  const sourceText = sources[0]?.label ? ` সূত্র: ${safeString(sources[0].label, 140)}.` : "";
  return `${status}${date ? `। সংশ্লিষ্ট তারিখ: ${date}` : ""}।${sourceText}`;
}

export function resolveDeterministicCalendarAnswer(data, question, history = []) {
  if (!data || typeof data !== "object" || typeof question !== "string") return null;
  const effectiveQuestion = questionWithHistory(question, history);
  const asksDeadline = /(last\s*date|deadline|abedon|application|আবেদন|শেষ\s*সময়|শেষ\s*তারিখ|জমার\s*শেষ)/iu.test(effectiveQuestion);
  if (!asksDeadline) return null;

  const terms = termsFor(effectiveQuestion);
  const universities = Array.isArray(data.universities) ? data.universities : [];
  const cycles = Array.isArray(data.admissionCycles) ? data.admissionCycles : [];
  const events = Array.isArray(data.events) ? data.events : [];
  const matches = [];
  for (const event of events) {
    if (event.type !== "application_deadline") continue;
    const cycle = cycles.find((item) => item.id === event.cycleId);
    const university = universities.find((item) => item.id === (event.universityId || cycle?.universityId));
    if (!university) continue;
    const universityText = normalize(JSON.stringify([university.id, university.name, university.shortName]));
    const entityTerms = terms.filter((term) => universityText.includes(term));
    if (!entityTerms.length) continue;
    const status = event.verification?.status;
    if (status && !["officially_confirmed", "authority_announced"].includes(status)) continue;
    const rawDate = event.startsAt || event.dateOnly;
    if (!rawDate) continue;
    const parsed = /^\\d{4}-\\d{2}-\\d{2}$/.test(rawDate) ? new Date(`${rawDate}T00:00:00Z`) : new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) continue;
    const score = entityTerms.reduce((total, term) => total + (term.length >= 5 ? 3 : 1), 0);
    matches.push({ event, university, parsed, score });
  }
  matches.sort((a, b) => b.score - a.score);
  if (!matches.length || (matches.length > 1 && matches[0].score === matches[1].score &&
      matches[0].university.id !== matches[1].university.id)) return null;

  const match = matches[0];
  const date = new Intl.DateTimeFormat("bn-BD", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka"
  }).format(match.parsed);
  const time = match.event.startsAt ? new Intl.DateTimeFormat("bn-BD", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka"
  }).format(match.parsed) : "";
  const deadline = time ? `${date}, ${time}` : date;
  return `${match.university.name}-এর অনলাইন আবেদনের শেষ সময় ${deadline}।`;
}

export function buildRelevantContext(data, question, page = "", history = []) {
  if (!data || typeof data !== "object" || typeof question !== "string") return "";
  question = questionWithHistory(question, history);
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
