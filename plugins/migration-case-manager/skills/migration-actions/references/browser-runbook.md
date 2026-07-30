# Browser runbook

Execute this protocol for every browser action after route research creates an `ACT-*` record.

1. **Preflight:** Confirm the action has a linked `REQ-*`, source-backed target domain, action class, owner, deadline, expected receipt, and current decision where required. Stop if any is unknown.
2. **Domain check:** Compare the browser URL host with the linked `SRC-*` official URL. Do not enter case data into an unverified redirect, an ad, or a commercial lookalike.
3. **Data minimization:** Enter only fields needed for this action, only from current case records or direct user input. Stop for unavailable or ambiguous data.
4. **Irreversible boundary:** Before a submission, booking, payment, message, data disclosure, or terms acceptance, show the exact data, cost/currency, selected provider/time, cancellation terms if visible, and the button effect. Obtain a current `DEC-*` decision.
5. **Human-only boundary:** Stop for CAPTCHA, 2FA, biometrics, identity verification, legal signature, medical examination, or a declaration whose truth the agent cannot establish.
6. **Receipt:** After user-confirmed completion, create an `EVD-*` record containing only a safe receipt reference, verification date, and supported `ACT-*`; set the action status only after that record exists.
7. **Recovery:** Record page errors, cancellation, expired slot, or reschedule as an action state change. Never retry a submission merely because its result is unclear.
