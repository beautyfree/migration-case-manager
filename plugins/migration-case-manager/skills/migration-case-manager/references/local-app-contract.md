# Local Migration OS app contract

## Boundary

The app is a local companion packaged in this plugin. It starts only for an explicit private case folder. It is not a hosted service, account system, or cloud database.

## Authority and storage

- Numbered Markdown files are authoritative case data.
- `.migration-os/` contains disposable runtime metadata, request queue, events, and cache only; it is ignored by Git.
- The UI never stores a second editable copy of a case. It refreshes from the local API after a validated case mutation.
- Evidence files, credentials, document contents, and browser cookies are never served by the app.

## Server lifecycle

- Bind only to `127.0.0.1`; reject non-loopback host configuration.
- Pick an available ephemeral port and generate at least 128 bits of random session entropy.
- Require the token on every API and event request; do not accept cross-origin requests.
- Write a local session record containing only PID, port, case path fingerprint, start time, and token expiry.
- Exit on explicit stop or inactivity timeout. Never start automatically at login.

## API and views

Read endpoints expose parsed case records, generated dashboard inputs, timeline, documents, source freshness, appointments, logistics, and request/event state. The React UI has no external network dependencies at runtime.

## Agent bridge

The UI may write a structured local request: type, linked records, plain-language objective, and safe context. An agent claims it, uses the installed skills/runbooks, writes the resulting case updates, and appends a visible event. A request itself never authorizes an external action.

## Mutations and consent

Only schema-limited local mutations are allowed: create a request, propose/accept a decision, update safe status fields, or record an opaque receipt reference. Every mutation runs `validate_case.py` before becoming visible. External submission, booking, payment, messaging, disclosure, identity verification, signatures, biometrics, and 2FA remain governed by the existing action class and scoped decision rules.

## Packaging

React is prebuilt into static assets under the plugin. A stdlib Python local server serves the assets and API so the user does not need to install Node or run a package manager. Node/Vite may be used only by maintainers to rebuild assets.
