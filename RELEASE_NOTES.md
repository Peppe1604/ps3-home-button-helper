# PS3 Home Button Helper v1.0.0

First public release of **PS3 Home Button Helper**, a small web app for sending the PS3 PS/Home button command from a phone, tablet, or PC on the same local network.

## Highlights

- One-tap PS/Home button command for compatible PS3 setups.
- Background command sending that keeps the user inside the app when the browser allows it.
- Simple address field with saved local PS3 IP/hostname.
- Direct command URL preview and copy button.
- Progressive Web App support for mobile home screen installation.
- Standalone app-style display when launched from Android or iPhone home screen.
- Basic offline app shell caching through a service worker.
- Automatic light and dark mode with a saved in-app theme selector.
- App icons for browser tabs, Android, and iOS.
- Public-facing README with usage, requirements, troubleshooting, privacy, security, and compatibility notes.

## Compatibility

This helper is intended for PS3 systems that already expose the `pad.ps3` endpoint, such as compatible webMAN MOD setups.

It does not install homebrew, modify the console, pair controllers, or create the endpoint by itself.

## Security

Keep the PS3 web interface available only on your local network. Do not expose or port-forward it to the internet.

## Suggested Tag

```text
v1.0.0
```
