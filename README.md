# বাংলাদেশ ভর্তি ক্যালেন্ডার — ভর্তি সহায়িকা (২০২৬–২৭)

![Repository checks](https://github.com/ayon0192/bd-admission-calendar/actions/workflows/ci.yml/badge.svg)

বাংলাদেশের HSC ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষার (প্রকৌশল, মেডিকেল, সাধারণ/গুচ্ছ, কৃষি, বিশেষায়িত) তারিখ, ডেডলাইন, বিশ্ববিদ্যালয়-তথ্য ও অফিসিয়াল বিজ্ঞপ্তির জন্য একটি অফলাইন-বান্ধব ও অ্যাক্সেসিবল ওয়েব অ্যাপ।

## মূল ৫টি পেজ
- **আজ (`#today`)**: এশিয়া/ঢাকা (UTC+6) অনুযায়ী কাউন্টডাউন, কাছের ৩টি পাকা ডেডলাইন, ইনলাইন চেকলিস্ট, লক্ষ্য-সারাংশ, সম্ভাব্য তারিখের ভাঁজ ও নতুন বিজ্ঞপ্তি।
- **ক্যালেন্ডার (`#calendar`)**: তালিকা (মোবাইল ডিফল্ট), মাস (শনিবার থেকে সপ্তাহ শুরু) ও সপ্তাহ ভিউ; মোবাইল বটম-শিট ও ডেস্কটপ স্টিকি ফিল্টার রেল, সক্রিয় চিপ, `শুধু আমার লক্ষ্য`, `সম্ভাব্য দেখাও`, `পুরোনো দেখাও` এবং ফলাফল সংখ্যা।
- **ভার্সিটি (`#universities`)**: সার্চ, প্রতিষ্ঠানের ধরন-চিপ, `লক্ষ্যে যোগ করো` তারা-বাটন এবং বিস্তারিত পেজের ভেতর ৫টি ARIA ট্যাব (`সারসংক্ষেপ`, `যোগ্যতা ও আবেদন`, `পরীক্ষা`, `সিলেবাস ও আসন`, `উৎস ও তারিখ`)। পুরোনো `#info` রুট সরাসরি `#universities`-এ রিডাইরেক্ট করে।
- **নোটিশ (`#notices`)**: নতুন-আগে সাজানো বিজ্ঞপ্তি, সার্চ, ধরন-চিপ (`সরকারি PDF`, `অফিসিয়াল পোর্টাল`, `বিশ্ববিদ্যালয় নোটিশ`, `সংবাদ (গৌণ সূত্র)`), অফিসিয়াল বনাম গৌণ সূত্রের দৃশ্যমান পার্থক্য এবং ভাঁজ-করা সরকারি উৎস রেজিস্টার।
- **আমি (`#me`)**: ৩-ধাপের লক্ষ্য উইজার্ড, চেকলিস্ট অগ্রগতি, ৪টি রিমাইন্ডার সময় টগল + `.ics` ক্যালেন্ডার ফাইল তৈরি, হালকা/গাঢ় থিম, এবং পছন্দ এক্সপোর্ট/ইমপোর্ট/রিসেট (`bdac.preferences.v2`, `v1` থেকে স্বয়ংক্রিয় মাইগ্রেশনসহ)।

## ডেটা ও গোপনীয়তা নীতি
- সব ভর্তি-তথ্য `data/admission-records.json` (২২টি বিশ্ববিদ্যালয়/গুচ্ছ, যাচাইকৃত সূত্রসহ) থেকে আসে এবং `assets/js/admission-core.js` দিয়ে যাচাইকৃত।
- অজানা সময়কে কখনো `00:00` বা `23:59` বানানো হয় না (`সময় প্রকাশিত নয়`)।
- ব্যক্তিগত পছন্দ শুধু ব্যবহারকারীর ব্রাউজারের `localStorage`-এ (`bdac.preferences.v2`) থাকে; ক্যালেন্ডার অ্যাপ কোনো লগইন বা থার্ড-পার্টি ট্র্যাকার ব্যবহার করে না।
- AI সহকারী কেবল `https://bd-admission-calendar.pages.dev` Origin থেকে অনুরোধ নেয়। প্রশ্নের সঙ্গে মেলা কয়েকটি রেকর্ডই Worker-এ পাঠানো হয়; পুরো ভর্তি ডেটাসেট মডেলে পাঠানো হয় না। AI প্রশ্ন/উত্তর বা পরিষ্কার IP সংরক্ষণ করা হয় না।

## ফাইল কাঠামো
- `index.html` — অ্যাপ শেল, ফন্ট প্রিলোড, স্কেলিটন, `<noscript>` ফলব্যাক ও AI প্যানেলের asset link।
- `assets/css/{tokens,fonts,filters,main-shell,ai-assistant}.css` — টোকেন-ভিত্তিক স্টাইলশিট; AI প্যানেলও হালকা/গাঢ় থিম টোকেন ব্যবহার করে।
- `assets/js/{theme-init,main-shell,admission-core,release-updates,ai-assistant}.js` — থিম, অ্যাপ্লিকেশন, ডেটা যাচাই, আপডেট ও চ্যাট UI।
- `workers/assistant.mjs` — AI endpoint, strict Origin/CORS, প্রশ্ন-সীমা ও quota control।
- `workers/assistant-context.mjs` — প্রশ্ন অনুযায়ী ছোট ও সম্পর্কিত সাইট-ডেটা বেছে দেয়।
- `workers/ai-config.mjs` — এক লাইনে Workers AI মডেল ID।
- `sw.js` — অ্যাপ শেল/AI UI asset-এর offline cache এবং ভর্তি ডেটার আগের cache policy।
- `_headers` — self-hosted Content Security Policy ও নিরাপত্তা হেডার; deploy-এর পর Worker-এর নির্দিষ্ট hostname বসাতে হয়।

## আপডেট, AI সহকারী ও ঐচ্ছিক ব্যাকএন্ড
- দৃশ্যমান ট্যাব প্রতি ৫ মিনিটে একই-সাইটের `/release.json` পরীক্ষা করে; পেজে ব্যবহারকারীর কাজ চললে স্বয়ংক্রিয় রিলোড অপেক্ষা করে।
- AI সহকারী পৃথক Cloudflare Worker-এর `/api/chat` endpoint ব্যবহার করে। Wrangler-এ Workers AI binding `AI`, SQLite Durable Object binding `RATE_LIMITER` এবং Static Assets binding `ASSETS` আছে। `run_worker_first` শুধু `/api/*`-এর জন্য; অন্য অনুরোধ Static Assets থেকেই আসে।
- মডেল `workers/ai-config.mjs`-এর `AI_MODEL` ধ্রুবকে এক লাইনে বদলানো যায়। কোনো API key দরকার নেই; Workers AI binding দিয়ে মডেল চালানো হয়।
- সীমা: প্রতি সাইটে দিনে ৩০টি AI অনুরোধ; প্রতি IP-তে দিনে ৮টি এবং মিনিটে ২টি। প্রশ্ন সর্বোচ্চ ৫০০ অক্ষর, প্রাসঙ্গিক context সর্বোচ্চ ৩,৮০০ অক্ষর এবং উত্তর সর্বোচ্চ ১২৮ টোকেন। সীমা UTC দিন অনুযায়ী রিসেট হয়। এগুলো এই সহকারীর সীমা; একই Cloudflare account-এর অন্য Workers AI ব্যবহার আলাদা করে shared free allocation ব্যবহার করতে পারে।
- Worker code-এ `ALLOWED_ORIGIN` শুধু Pages hostname। `assets/js/ai-assistant.js`-এর `ASSISTANT_API_URL` এবং `_headers`-এর `connect-src`-এ Worker deploy-এর পর পাওয়া একই নির্দিষ্ট `workers.dev` hostname বসাতে হবে; wildcard ব্যবহার করা যাবে না।
- Durable Object-এ IP address নয়, দৈনিক salt-যুক্ত hash ব্যবহার করে quota count রাখা হয়। প্রশ্ন ও AI উত্তর সংরক্ষণ করা হয় না।
- ব্লুপ্রিন্টের ধাপ ১০ (Web Push) ঐচ্ছিক ও অসম্পন্ন। এখনকার `.ics` রিমাইন্ডার AI সহকারী থেকে স্বাধীনভাবে কাজ করে।

## রিপোজিটরি নিরাপত্তা
- `.github/workflows/ci.yml` repository hygiene ও JSON checks চালায়; `.github/workflows/quality.yml` syntax, test, data validation, release checks, build ও publish smoke test চালায়।
- Actions workflow-এ `contents: read` স্পষ্টভাবে নির্ধারিত। কোনো Cloudflare deployment secret বা API key GitHub-এ যোগ করা হয়নি।
- [নিরাপত্তা নীতি](SECURITY.md) ও [অবদান নির্দেশিকা](CONTRIBUTING.md) অনুসরণ করো।

## অবদান ও নিরাপত্তা
- [অবদান নির্দেশিকা](CONTRIBUTING.md) অনুসরণ করে Pull Request তৈরি করো।
- নিরাপত্তা দুর্বলতা প্রকাশ্যে না জানিয়ে [নিরাপত্তা নীতি](SECURITY.md) অনুসরণ করো।

## পরীক্ষা ও বিল্ড
```sh
node --test tests/*.test.cjs
node scripts/check-release.cjs
node scripts/build.cjs
node scripts/smoke-test.cjs
```
