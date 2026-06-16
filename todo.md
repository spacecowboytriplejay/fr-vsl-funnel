# VSL Funnel Build – TODO

## Database
- [x] leads table: email, name, source, qualified, booked, timestamps
- [x] bookings table: calendly_event_uri, invitee_email, scheduled_time, lead_id, status, timestamps
- [x] funnel_config table: vsl_watch_threshold, calendly_url, configurable settings
- [x] Generate migration SQL and apply via webdev_execute_sql

## Backend
- [x] DB helpers: createLead, getLead, updateLeadQualified, updateLeadBooked, getLeads
- [x] DB helpers: createBooking, updateBooking, getBookings
- [x] DB helpers: getConfig, upsertConfig
- [x] tRPC: leads.capture (public) – create lead, notify owner
- [x] tRPC: leads.list (protected admin) – list all leads with booking join
- [x] tRPC: qualify.submit (public) – update lead qualified status
- [x] tRPC: config.get (public) – return vsl threshold + calendly URL
- [x] tRPC: config.update (protected admin) – update funnel config
- [x] Express route: POST /api/webhooks/calendly – handle invitee.created + invitee.canceled
- [x] Owner notification on new lead opt-in
- [x] Owner notification on new booking confirmed

## Frontend – Infrastructure
- [x] Global design system in index.css (dark, premium, high-contrast)
- [x] Funnel state utility (sessionStorage + URL param helpers)
- [x] App.tsx routing for all 5 funnel pages + admin
- [x] Shared FunnelLayout component (minimal header/footer)

## Page 1 – Lead Capture
- [x] Hero headline + sub-headline
- [x] Email opt-in form (name + email)
- [x] Submit calls leads.capture tRPC mutation
- [x] On success, redirect to /vsl with email in query param

## Page 2 – VSL Page
- [x] Full-screen layout with Wistia embed
- [x] Wistia JS API: bind play, percent-watched-change, ended events
- [x] Track events to backend via tRPC
- [x] CTA button hidden until configurable watch threshold reached
- [x] CTA routes to /qualify with email param

## Page 3 – Pre-Qualification Page
- [x] Budget/money qualification question(s)
- [x] Qualifying path: redirect to /booking
- [x] Disqualifying path: show polite rejection message
- [x] Update lead qualified status in DB

## Page 4 – Booking Page
- [x] Inline Calendly embed with configured event URL
- [x] postMessage listener for calendly.event_scheduled
- [x] On booking detected: update lead booked status, redirect to /confirmation

## Page 5 – Booking Confirmation Page
- [x] Congratulations message
- [x] Embedded short Wistia expectation-setting video
- [x] Next steps summary

## Admin Dashboard
- [x] Protected route (auth required)
- [x] Leads table: email, name, qualified, booked, created_at
- [x] Bookings table: invitee email, scheduled time, status
- [x] Config panel: edit VSL watch threshold + Calendly URL

## Tests
- [x] leads.capture procedure test
- [x] qualify.submit procedure test
- [x] config.get procedure test
- [x] Calendly webhook handler test

## Figma-Faithful Redesign
- [x] Extract full Figma design via API (all frames, colors, fonts, images)
- [x] Download all image assets from Figma
- [x] Upload photos to webdev static storage
- [x] Implement exact Figma color palette: #665DA9 purple, #F15931 orange, #AED136 lime, #B8923C gold, #1A1A1A dark
- [x] Load Cormorant Garamond + Inter fonts from Google Fonts
- [x] Rebuild Page 1 (Lead Capture) to match Figma exactly
- [x] Rebuild Page 2 (VSL) to match Figma exactly
- [x] Rebuild Page 3 (Qualify) to match Figma exactly
- [x] Rebuild Page 4 (Booking) to match Figma exactly
- [x] Rebuild Page 5 (Confirmation) to match Figma exactly
- [x] Shared FRLayout components: FRNav, FRNavLogoOnly, FRFooter, FRBtnOrange, FRBtnGold, FRLabel, FRCalloutLime, FRBlobDecoration
