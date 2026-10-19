# JAP Smart Paint Inspection

Arabic RTL prototype for vehicle paint inspection with photo uploads, road exposure questionnaire, visual damage findings, recommendations, booking form and internal trial dashboard.

## Status
Frontend source is included. **This is not a functioning AI scan without the backend.** The JavaScript requires APIs such as `POST /api/scan`, as well as other `/api/` routes. No backend implementation was supplied. The demo image buttons expect files under `samples/`, which must be uploaded separately.

To host the interface on GitHub Pages, enable Pages in repository Settings > Pages and deploy from the `main` branch root. Backend endpoints will not run on GitHub Pages.

No payments or real bookings are processed by the supplied frontend.
