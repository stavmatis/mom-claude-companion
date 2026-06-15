# Mom Claude Companion

Phone-first hosted applet for a family member to keep a private local memory and generate a Claude-ready prompt.

## What it does

- PIN unlock: `0406`
- Encrypted browser-local memory using WebCrypto AES-GCM
- Mobile PWA layout for adding to iPhone Home Screen
- Profile + health/practical context + memory notes
- Export/import JSON backup
- One button: copy full summary prompt and open Claude
- Offline cache after first load

## Important security note

This is designed as a private convenience app, not a banking-grade security system. The hosted files contain the app shell only. Her personal data is stored encrypted in her browser on her phone, not in GitHub Pages.

## Why `.html` failed before

The upload system rejected raw `.html`. Supported document uploads include `.md`, `.txt`, `.pdf`, `.json`, and `.zip`. This app is a website, so it should be hosted as web files or uploaded as the included `.zip`, not uploaded as raw `.html`.

## Claude button limitation

Claude web does not reliably support a normal URL that opens a new chat with the prompt prefilled. The reliable mobile flow is:

1. Copy the generated prompt to clipboard.
2. Open `https://claude.ai/new`.
3. Paste and send.

The app does steps 1 and 2 with one button.
