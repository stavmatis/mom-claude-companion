# Dimitra IQOS Log

Single-page, phone-first static PWA built from Dimitra's Claude IQOS / Recigar conversation.

- Private passcode unlock without exposing the passcode on the lock screen
- One page only: status, daily log, recent logs, and one Claude summary action
- Daily IQOS count + trigger tracker
- Seeded Claude-chat reminders: chilling, stress, series cue, Recigar, Nicorette inhalator, Lp(a) prevention framing
- Autosaves every change immediately
- Encrypted server save on the hosted Mac so refresh/reopen loads the latest log
- Local encrypted fallback on the phone
- Server autosave API is passcode-bound; raw encrypted vault is not public
- Server autosave audit log in `data/autosave-log.jsonl`
- Backup/import JSON
- Copy full summary prompt and open Claude

Runs as a small Node server on the always-on Mac, exposed through a free HTTPS tunnel.
