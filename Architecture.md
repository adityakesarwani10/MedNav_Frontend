# MedNav — Architecture

This document explains how MedNav is structured, how data flows through the system, and why key decisions were made the way they were. Start here before reading any code.

---

## Bird's Eye View

MedNav has three distinct layers that talk to each other in one direction:

```
┌─────────────────────────────────────────────────────────────┐
│  PATIENT LAYER                                              │
│  Any phone call → Twilio Voice API                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP Webhook (TwiML)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT LAYER                                                │
│  Triage Agent ──── classifies ──── Navigator Agent         │
│  (router.js)                        (navigator.js)          │
└──────────────────────────┬──────────────────────────────────┘
                           │ writes to state.js
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD LAYER                                            │
│  React Frontend ←── polls /api/status every 2s ───────────  │
└─────────────────────────────────────────────────────────────┘
```

The patient never touches the dashboard. The dashboard never touches Twilio. The agents sit in the middle and update shared state that both sides read.

---

## Entry Points

There are two separate entry points into the system. Understanding this is the most important thing:

| Entry Point | Who calls it | Returns | File |
|---|---|---|---|
| `POST /voice` | Twilio (phone call) | TwiML XML | `routes/router.js` |
| `GET /api/status` | React frontend | JSON | `api.js` |

**Twilio never receives JSON. Frontend never receives XML.** They share state through `state.js`.

---

## Source Code Map

```
mednav/
│
├── app.js                  ← Start here. Registers all routes.
│                             Order matters: Twilio routes first, then API.
│
├── state.js                ← Shared live state between agent layer and dashboard.
│                             This is the bridge. Both router.js and api.js
│                             import from here.
│
├── db.js                   ← In-memory database. Users, ambulances, hospitals,
│                             call history. Replace with MongoDB in production.
│
├── api.js                  ← JSON endpoints for frontend polling.
│                             No business logic — only reads state.js and db.js.
│
├── navigator.js            ← Logistics Agent. Haversine distance calculation,
│                             ambulance selection, hospital scoring.
│                             Called by router.js on EMERGENCY only.
│
├── middleware.js            ← JWT auth guard. authenticate() and adminOnly().
│                             Applied to /api/user/* and /api/admin/* routes.
│
├── keepAlive.js             ← Pings /api/status every 10 min.
│                             Prevents Render free tier from sleeping.
│
└── routes/
    ├── router.js            ← Triage Agent. The core of the system.
    │                          Handles /voice and /process-speech.
    │                          Reads from history.js, writes to state.js.
    │
    ├── auth.js              ← Phone OTP login. send-otp and verify-otp.
    │                          Returns JWT token on success.
    │
    ├── userRoutes.js        ← Dashboard, fleet, hospitals, track, call history.
    │                          All require authenticate() middleware.
    │
    ├── adminRoutes.js       ← User management, fleet management, hospital beds.
    │                          All require authenticate() + adminOnly() middleware.
    │
    ├── config.js            ← Single source of truth for all constants.
    │                          Feature flags, keywords, system prompt.
    │                          Change behavior here — never inside router.js.
    │
    ├── history.js           ← Per-call conversation memory.
    │                          Keyed by CallSid. Auto-cleans after 10 minutes.
    │
    └── sms.js               ← SMS notification helper. One function, one job.
```

---

## The Triage Agent — How a Call Works

This is the most important flow in the system. Every other feature exists to support this.

```
1. Patient calls Twilio number
         │
         ▼
2. Twilio hits POST /voice
   → server returns TwiML: greeting + <Gather> to capture speech
         │
         ▼
3. Patient speaks
   → Twilio STT converts to text
   → sends to POST /process-speech with SpeechResult in body
         │
         ▼
4. router.js checks:
   ├── Empty speech?          → ask again
   ├── Exit keyword?          → hangup cleanly
   └── First message + no medical keyword? → ask to describe properly
         │
         ▼
5. Push speech to history.js (keyed by CallSid)
         │
         ▼
6. Send full history to Gemini API with SYSTEM_PROMPT
   → Gemini returns JSON: { priority, condition, specialist,
                             requirements, reply, needsMore }
         │
         ▼
7. needsMore = true?
   ├── YES → speak reply (follow-up question), Gather again, loop to step 3
   └── NO  → triage complete, go to step 8
         │
         ▼
8. Route by priority:
   ├── EMERGENCY → update state.js + fire navigator.js (parallel)
   │               + SMS + outbound calls (if flags enabled)
   ├── HIGH      → update state.js + SMS
   └── GENERAL   → update state.js + SMS
         │
         ▼
9. Return final TwiML to patient, hangup
   → Frontend polling picks up state update within 2 seconds
```

---

## The Navigator Agent

Fires on EMERGENCY only. Runs in background — does not block the TwiML response to the patient.

```javascript
// This is why it's non-blocking:
triggerNavigator(lat, lng, condition, caller)
  .then(nav => console.log("dispatched"))
  .catch(err => console.error(err));
// ↑ .then/.catch means we don't await — patient gets response immediately
```

**What it does internally:**

```
1. Filter ambulances → available only
2. Calculate Haversine distance for each
3. Sort by distance → pick nearest
4. Mark ambulance as on_trip in db.js
5. Score hospitals: erBeds / distance → pick highest score
6. Build dispatch result object
7. Return to router.js → stored in state.lastDispatch
```

**Haversine formula** is used instead of Google Maps API because:
- No API key needed
- No cost
- Accurate enough for city-level distances
- Response is instant — no network call

---

## State Management — The Bridge

`state.js` is what allows the agent layer and dashboard layer to exist independently.

```
router.js ──writes──► state.js ◄──reads── api.js ◄──polls── React
```

```javascript
// state.js exports:
state          // the live object — status, lastDispatch, activity, stats
addActivity()  // append to activity feed
dispatchAmbulance() // mark ambulance as on_trip in db.js
returnAmbulance()   // mark ambulance as available again
```

**Why not a database?** For a hackathon prototype, in-memory state is simpler, faster, and has zero setup. In production this moves to Redis so multiple server instances can share state.

---

## Authentication Flow

```
POST /api/auth/send-otp
  → generate 6-digit OTP
  → store in otpStore[phone] with 5-min expiry
  → log to console (send via Twilio SMS in production)

POST /api/auth/verify-otp
  → check otpStore[phone]
  → OTP "123456" always works in dev (demo bypass)
  → generate JWT: { userId, phone, role }
  → return token + user object

All protected routes:
  → middleware.js reads Authorization: Bearer <token>
  → jwt.verify() → attach req.user
  → adminOnly() checks req.user.role === "admin"
```

---

## Feature Flags

All flags live in `routes/config.js`. Flip them without touching any other file.

```javascript
NAVIGATOR_ENABLED       = false  // ambulance dispatch
MESSAGE_SENDING_ENABLED = false  // SMS to patient
CALLING_ENABLED         = false  // outbound calls to ambulance + hospital
```

This design means you can demo with flags off (safe, no side effects) and flip them one by one as infrastructure is ready.

---

## Data Flow Diagram

```
Phone Call                     Backend                        Frontend
──────────                     ───────                        ────────
Patient speaks
     │
     ▼
Twilio STT
     │ SpeechResult
     ▼
POST /process-speech ──────► router.js
                                  │
                                  ├─► history.js (store message)
                                  │
                                  ├─► Gemini API (classify)
                                  │         │
                                  │         ▼
                                  │     JSON result
                                  │
                                  ├─► state.js (update status)        ◄─── GET /api/status (every 2s)
                                  │                                              │
                                  ├─► navigator.js (if emergency)               ▼
                                  │         │                            React updates UI
                                  │         ▼
                                  │   db.js (mark ambulance on_trip)
                                  │
                                  ├─► sms.js (notify patient)
                                  │
                                  └─► TwiML response → Twilio → patient hears reply
```

---

## Key Design Decisions

**1. TwiML and JSON from the same server**
Twilio needs XML. Frontend needs JSON. Both served from one Node.js server using separate route files. The separation is clean — `router.js` only ever returns `res.type("text/xml")`, `api.js` only ever returns `res.json()`.

**2. CallSid as memory key**
Twilio sends a unique `CallSid` with every webhook request for the same call. Using this as the key for `history.js` means conversation memory works across multiple HTTP requests without sessions or cookies.

**3. needsMore flag — not string matching**
Earlier versions tried to detect follow-up intent by matching phrases like "tell me more" in the AI's reply. This was fragile. The current design tells the AI to return a boolean `needsMore` field, giving the server explicit control over conversation flow rather than guessing from text.

**4. Non-blocking navigator**
The navigator runs with `.then()/.catch()` instead of `await`. This means the patient hears the response in ~1 second while the navigator works in the background. If we awaited the navigator (which involves distance calculations and potentially outbound calls), the patient would wait 3-5 extra seconds in silence.

**5. In-memory state over database polling**
The frontend polls `/api/status` every 2 seconds. If status was stored in a database, each poll would be a DB read. In-memory state means each poll is a direct object read — microseconds instead of milliseconds. For a real-time emergency dashboard, this matters.

---

## Known Limitations

| Limitation | Current State | Production Fix |
|---|---|---|
| Patient location | City-level from Twilio CallerCity | Browser GPS or Twilio geolocation API |
| State persistence | Lost on server restart | Redis |
| Ambulance GPS | Mock coordinates in db.js | Real GPS from driver mobile app |
| SMS to Indian numbers | Blocked by carriers | DLT registration + Indian Twilio number |
| Concurrent calls | Works but state is single object | Per-call state isolation |
| OTP delivery | Console log only | Twilio SMS |

---

## Local Setup

```bash
git clone https://github.com/your-username/mednav.git
cd mednav
npm install
cp .env.example .env   # fill in Twilio + Gemini keys
node app.js            # starts on port 3000
ngrok http 3000        # expose for Twilio webhooks
```

Set Twilio webhook: `https://your-ngrok-url.ngrok.io/voice`

Test the full flow via Postman using `MedNav_Postman_Collection.json`.