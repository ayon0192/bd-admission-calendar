# 2026–27 admission dataset

Canonical structured dataset: `admission-records.json`.

## Coverage at this revision — checked 28 November 2026

- 22 route/institution records and 22 admission-cycle records are retained; the project scope has not been expanded.
- Current dataset: 53 unit/detail records, 105 calendar events, 9 circular records, 10 reviewed notices and 44 source records.
- Full official circular/portal schedules are now directly available for DU, RU, JU, JnU, KUET, BUTEX, AFMC, the Agricultural Cluster and national MBBS/BDS admission.
- Authority-announced schedules remain for BUET, CU, Khulna University, SUST, RUET and GST. RUET's 12 Dec 2026–7 Jan 2027 application window is reported by BSS and Jago News as a Steering Committee decision; the official RUET portal still shows 2025–26, so the dates remain authority-announced rather than circular-confirmed.
- MIST remains authority-announced from an archived circular copy; the official admission portal could not be independently read in this audit, so no status upgrade was made.
- CUET's previously listed 23 Jan 2027 date remains tentative. The current official academic-information page does not display a final 2026–27 date, and no definitive circular was found.
- IUT remains awaiting an official 2026–27 notice. Its official portal still shows the 2025–26 cycle as closed. AFMC is no longer pending: its official 2026–27 notice was listed on 26 Nov.
- BAU is listed under the Agricultural Cluster; PUST remains under GST. Shared dates stay under the cluster routes to avoid duplicate events.
- DU's live unit-wise Important Dates table lists the extended application and fee deadline as 28 Nov 2026 at 23:59. The special notice's “12:00 AM” wording is ambiguous; the explicit unit-wise table time is used and the discrepancy is recorded.
- RU's official circular still gives the A/B/C unit dates of 12, 13 and 20 Feb 2027; no exact test times were inferred.
- JU's official circular gives admit-card download from 25 Dec 2026. Its 10–21 Jan 2027 test window is explicitly probable and remains tentative.
- BUTEX's official circular gives admit-card download from 17 Jan 2027 at 10:00 to 24 Jan at 11:59. The 15 Jan shortlist and 15 Feb result dates remain marked probable/tentative.
- CoU's official press releases give application 2–30 Nov and tests 30 Jan–6 Feb; the 5 Feb overlap is retained as a review notice rather than silently resolved.
- KU's official 2026–27 portal says “Launching Soon”; its application window is still unpublished. SUST's official portal still shows 2025–26, so the 2026–27 application window remains unpublished.
- BUET's reported 16 Jan 2027 test date and 1 Dec–7 Jan application window remain authority-announced pending direct circular confirmation.
- Agricultural Cluster: the official ACAS circular confirms nine public universities and 3,795 total seats; applications 25 Nov–15 Dec, fee 1,600 BDT, admit card from 21 Dec, seat plan 27 Dec, test 2 Jan 2027 at 11:00–12:00, and result 7 Jan. SSC and HSC minimum GPA are both 4.00, with Biology, Chemistry, Physics and Mathematics required.
- National MBBS/BDS: the official DGHS circular dated 25 Nov confirms applications 25 Nov at 18:30–3 Dec at 23:59, fee 1,000 BDT by 4 Dec at 23:59, admit card 14–17 Dec, and test 18 Dec at 10:00–11:15. The test is 100 marks/75 minutes with 0.25 negative marking and a 40 pass mark; the main GPA threshold is 8.50 with Biology GPA 3.50.
- AFMC and five Army Medical Colleges plus Navy Medical College: the official notice listed 26 Nov confirms applications 29 Nov at 12:00–8 Dec at 23:59, fee 1,000 BDT (pay within 24 hours), admit card from 12 Jan at 10:00, and test 15 Jan at 10:00–11:15. The PDF's second page contains a stale previous-cycle date line; the current-cycle summary on page 1 is used and the discrepancy is documented.
- IUT and the still-probable JU, BUTEX and CUET dates remain unresolved where the official sources do not provide a final date. No fee, admit-card date, seat count or exact time has been inferred where it was not published.

## Source policy

- Primary sources include university-issued circulars/press releases, official admission portals, government bodies and official cluster sites.
- Trusted national reporting (Prothom Alo, The Daily Star, bdnews24, BSS, The Daily Observer, and similar established outlets) may support an authority-announced schedule where the university decision/official notice is described by named university officials.
- An archive/mirror of a signed university circular is not described as a directly fetched university page. Such records remain `authority_announced` until the issuing portal can be independently inspected.
- `officially_confirmed`, `authority_announced` and `tentative` are distinct states. A published but tentative date is never upgraded to final.
- Dates, times and fees are stored only where a source supports them. Unknown fields are omitted; prior-cycle information is not reused.
- Newer revised notices supersede older dates. Conflicts and collisions are flagged rather than silently resolved.

## Validation

Run:

```sh
node scripts/validate-admission-data.cjs
node scripts/build.cjs
```

The build validates the JSON, generates the shell's university/event/detail/circular/notice/source collections through `scripts/integrate-admission-data.cjs`, and copies the canonical JSON to `dist/data/admission-records.json`. The dashboard, calendar, university directory/detail, admission-information and notices pages consume the generated records. The offline service worker deliberately does not cache the admission dataset.
