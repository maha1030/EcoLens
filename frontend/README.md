# EcoLens

**Track environmental promises. Detect reality gaps.**

EcoLens is a trust layer for environmental pledges. Organizations register promises (plant 10,000 trees, restore 100 hectares of mangroves, cut waste 50%), submit monthly progress updates with photos, GPS and measurements, and the system verifies the evidence instead of blindly trusting it:

- **Photo relevance** - vegetation pixel analysis confirms the photo fits the project type
- **Duplicate detection** - a 64-bit perceptual hash (dHash) is compared with every earlier photo
- **GPS cross-check** - haversine distance between submission and registered site
- **Growth plausibility** - robust modified z-score of each increment against the project's own history
- **Forecast** - least-squares regression on verified progress, projected to the deadline
- **Confidence score** - weighted 0-100 per update; low-confidence months contribute nothing to verified totals

The result is an expected-vs-actual "reality gap" with an early warning before the deadline, not after.

## Run it

The photo hashing uses canvas, which browsers restrict on `file://` URLs, so serve it locally:

```
python -m http.server 8000
```

Then open http://localhost:8000. (Any static server works: `npx serve`, VS Code Live Server, etc.)

No build step, no dependencies to install, no network requests at runtime (Chart.js is vendored in `assets/vendor/`).

## Deploy it

Push the folder to any static host: GitHub Pages (Settings > Pages) or Netlify Drop. Nothing else needed.

## The demo

Three fictional projects with deliberately different stories, all numbers computed at runtime from `js/data.js`:

| Project | Promise | What the dashboard shows |
|---|---|---|
| Vanamitra Reforestation | 10,000 trees in 12 months | Month 7 claims 1,800 trees using a photo already submitted in month 3. The hash check catches it (distance 0/64), the claim is disputed, and the verified trend forecasts ~5,300 trees: off track. |
| Pichavaram Mangrove Restore | 100 ha in 24 months | On track. One submission sits 1.2 km from the site centroid, inside the 2 km tolerance: passes with a note, showing the system is calibrated, not alarmist. |
| ZeroWaste Campus | 50% waste cut in 10 months | Ahead of schedule with clean evidence: the healthy contrast case. |

The **Try it yourself** section runs the real duplicate detector on any photo you upload.

## Honest limits (stated on the site)

AI here enables transparency and auditability, not proof: it cannot date a photo without a trusted camera, confirm survival without field audits, or replace on-ground verification.

## Repo layout

```
index.html            landing page + dashboard
css/styles.css        design system
js/data.js            seeded projects and updates (single source of truth)
js/verify.js          dHash, haversine, z-score, regression, confidence scoring
js/dashboard.js       rendering + Chart.js wiring
assets/img/           demo photos (see ATTRIBUTION.md for licenses)
assets/vendor/        chart.umd.js (vendored for offline demos)
tools/fetch_assets.py one-time asset fetcher (not needed at runtime)
```

Photo credits: see [ATTRIBUTION.md](ATTRIBUTION.md). All photos are from Wikimedia Commons under free licenses.
