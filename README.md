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
- ব্যক্তিগত পছন্দ শুধু ব্যবহারকারীর ব্রাউজারের `localStorage`-এ (`bdac.preferences.v2`) থাকে; কোনো লগইন বা থার্ড-পার্টি ট্র্যাকার নেই।

## ফাইল কাঠামো
- `index.html` — অ্যাপ শেল, ফন্ট প্রিলোড, স্কেলিটন ও `<noscript>` ফলব্যাক।
- `assets/css/{tokens,fonts,filters,main-shell}.css` — টোকেন-ভিত্তিক স্টাইলশিট (স্ব-হোস্টেড Hind Siliguri woff2 ফন্ট)।
- `assets/js/{theme-init,main-shell,admission-core,release-updates}.js` — থিম ইনিট, অ্যাপ্লিকেশন লজিক, ডেটা ভ্যালিডেশন ও আপডেট ক্লায়েন্ট।
- `sw.js` — অ্যাপ শেলের জন্য stale-while-revalidate এবং `data/admission-records.json`-এর জন্য network-first ক্যাশ।
- `_headers` — কঠোর self-hosted Content Security Policy ও নিরাপত্তা হেডার।

## আপডেট ও ঐচ্ছিক ব্যাকএন্ড
- প্রকাশিত রিলিজ শনাক্ত করতে দৃশ্যমান ট্যাব প্রতি ৫ মিনিটে একই-সাইটের `/release.json` পরীক্ষা করে; পেজে ব্যবহারকারীর কাজ চললে স্বয়ংক্রিয় রিলোড অপেক্ষা করে।
- বর্তমান সোর্সে Cloudflare Worker, Pages Function বা Durable Object binding নেই। WebSocket reconnect এবং Worker deployment workflow ইচ্ছাকৃতভাবে সক্রিয় নয়।
- ব্লুপ্রিন্টের ধাপ ১০ (Web Push) ঐচ্ছিক ও অসম্পন্ন। এটি বাস্তবায়নের সময় নতুন Worker/Pages Function সোর্স, একই-সাইট subscription API, নিরাপদ key storage, সীমিত Cloudflare permissions এবং নতুন integration tests যোগ করতে হবে। এখনকার `.ics` রিমাইন্ডার এর থেকে স্বাধীনভাবে কাজ করে।

## রিপোজিটরি নিরাপত্তা
- `.github/workflows/ci.yml` repository hygiene ও JSON checks চালায়; `.github/workflows/quality.yml` test, data validation, release checks, build ও publish smoke test চালায়।
- Actions workflow-এ `contents: read` স্পষ্টভাবে নির্ধারিত। কোনো Cloudflare deployment secret বা Worker deployment সক্রিয় নেই।
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
