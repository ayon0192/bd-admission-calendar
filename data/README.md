# 2026–27 admission dataset

Canonical structured dataset: `admission-records.json`.

## Coverage at this revision — checked 23 November 2026

- 22 route/institution records and 22 admission-cycle records are retained; the project scope has not been expanded.
- Current dataset: 52 unit/detail records, 83 calendar events, 6 circular/official-announcement records, 6 reviewed notices and 38 source records.
- Full official circular/portal dates are available for DU, RU, JU, JnU, KUET and BUTEX. Official CoU press releases now confirm its revised application window and unit-wise test schedule.
- Authority-announced schedules have also been added for BUET, CU, Khulna University, SUST, RUET, GST, the Agricultural Cluster, MBBS and BDS. MIST details are recorded from a full archived copy of its 2026–27 notice and remain labelled authority-announced pending direct portal extraction.
- CUET's 23 January 2027 date is explicitly tentative because CUET's own page describes it as a probable date.
- IUT and AFMC remain awaiting a verifiable 2026–27 undergraduate circular in the sources checked.
- PUST and BAU are listed as cluster participants; their shared test dates are shown under the respective GST/Agricultural Cluster routes to avoid duplicate calendar events.
- A schedule-conflict notice flags the 5 February 2027 overlap reported for CU B Unit, Khulna University C Unit and CoU A Unit. No assumed rescheduling has been made.
- DU's special notice extended the application deadline to 28 November 2026 at 00:00. Earlier deadlines are superseded.
- RU official portal dates: Unit B 12 February, Unit C 13 February, Unit A 20 February 2027.
- JU's 10–21 January exam period remains tentative; its official circular identifies a probable window rather than final unit dates.
- JnU's signed 11 November circular gives unit-wise exams on 1, 8, 15, 22 and 23 January 2027.
- KUET's official prospectus sets the exam on 8 January 2027, 09:30–12:30; application closes 10 December at 17:00.
- BUTEX's official 19 November circular gives application dates 1 December 2026–10 January 2027 and a written test on 29 January 2027, 10:00–12:00. Its probable shortlist/result dates remain tentative.
- CoU official releases: application 10–31 December 2026; Unit A 5 February 11:00, Unit B 6 February 15:00, Unit C 7 February 11:00.
- CU revised application period: 10 December 2026–10 January 2027; fee payment deadline 12 January. Tests: C 29 January, A 30 January, B1 3 February, B2 4 February, B 5 February, D 6 February and D1 8 February.
- Khulna University test dates: A/B on 4 February and C/D on 5 February. Its application window remained unpublished in the official portal when checked.
- SUST's 1 November press release moves the test to 17–18 January 2027; unit-wise allocation/application window remains unknown.
- BUET application opens 1 December, closes 7 January; fee payment through 8 January; test 1 February 2027. The dates are marked authority-announced based on BUET's reported circular.
- RUET's Steering Committee announced 28 January 2027; application window remains unannounced.
- Agricultural Cluster: application 25 November–15 December 2026, fee BDT 1,600, test 2 January 2027, 11:00–12:00. Conflicting published seat totals were omitted.
- Medical and dental tests are planned for 18 December 2026 after the Appellate Division's 23 November order; the DGME circular was still expected and application dates were not inferred.
- MIST archived 2026–27 circular: application 5–21 January 2027; Unit C 5 February; Units A/B 6 February.
- GST test schedule: Unit B 19 March, Unit C and D 20 March, Unit A 27 March 2027. Unit D time is 15:00–16:00; other units are 11:00–12:00. Application details remain pending.

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
