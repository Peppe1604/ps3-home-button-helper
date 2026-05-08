# PS3 Home Button Helper

Use a PS4 controller on PS3 and need to go back to the XMB home menu?

**PS3 Home Button Helper** is a small web app that sends the PS/Home button command to a compatible PS3 from your phone, tablet, or PC.

It opens this local PS3 endpoint:

```text
http://<PS3_ADDRESS>/pad.ps3?_psbtn_go
```

## Index

- [Why This Exists](#why-this-exists)
- [Features](#features)
- [Requirements](#requirements)
- [How To Use](#how-to-use)
- [Install On Your Phone](#install-on-your-phone)
- [Troubleshooting](#troubleshooting)
- [Privacy](#privacy)
- [Security](#security)
- [Compatibility Notes](#compatibility-notes)
- [License](#license)
- [Disclaimer](#disclaimer)

## Why This Exists

The PS4 controller works on PS3 for many games, but it does not behave exactly like a real PS3 controller. One annoying problem is the missing PS/Home button behavior.

This helper gives you a quick shortcut: open the app on another device, tap one button, and send the PS/Home command to the console over your local network.

## Features

- One-tap PS/Home button command.
- Works from phone, tablet, or PC.
- Saves your PS3 address in the browser.
- Checks whether the PS3 web address is reachable without sending the Home command.
- Installable on mobile as a Progressive Web App.
- Standalone app-style display when launched from the home screen.
- Automatic light and dark mode with an in-app theme selector.
- No account, no tracking, no backend.

## Requirements

You need:

- A PS3 on the same local network as your phone, tablet, or PC.
- A PS3 setup that exposes the `pad.ps3` endpoint, such as webMAN MOD or another compatible setup.
- The local IP address of your PS3, for example `192.168.1.50`.

This app does not install homebrew, configure your PS3, pair controllers, or create the `pad.ps3` endpoint. It only opens the command URL that your PS3 already provides.

## How To Use

1. Open the app.
2. Enter your PS3 local IP address.
3. Optional: press **Check PS3** to test whether the PS3 web interface responds.
4. Press **Send PS Button**.
5. The app sends the PS3 command in the background and keeps you on the same screen.

If your browser blocks the background request, use **Open direct link** as a fallback. That option opens the PS3 command URL directly.

## Install On Your Phone

This app can be added to your phone home screen.

### Android

1. Open the app in Chrome.
2. Open the browser menu.
3. Tap **Install app** or **Add to Home screen**.
4. Launch **PS3 Home** from your home screen.

### iPhone

1. Open the app in Safari.
2. Tap the share button.
3. Tap **Add to Home Screen**.
4. Launch **PS3 Home** from your home screen.

Once installed, it opens like a small standalone utility instead of a normal browser tab.

## Troubleshooting

### Nothing Happens On The PS3

- Make sure the PS3 and your device are on the same local network.
- Check that the PS3 IP address is correct.
- Try opening `http://<PS3_ADDRESS>/` in your browser.
- Make sure the software that provides `pad.ps3` is running on the PS3.

### Check PS3 Fails

- The check only tests the PS3 web address, not the Home button endpoint.
- If the app is served over HTTPS, your browser may block checks to a local HTTP PS3 address.
- Try **Open direct link** or open `http://<PS3_ADDRESS>/` directly in your browser.

### The Browser Blocks The New Tab

Use **Open direct link** after entering your PS3 address. Some browsers block hidden HTTP requests from HTTPS pages, especially when the target is a local network device.

### The Wrong Address Is Saved

Edit the address field. The new value is saved automatically in your browser.

## Privacy

Everything happens locally in your browser.

The app stores only your PS3 address using browser local storage. It does not send data to a server, and it does not use analytics or tracking.

## Security

Keep your PS3 web interface available only on your local network.

Do not expose or port-forward the PS3 web interface to the internet. The endpoint can trigger console input, so it should only be reachable from devices you trust.

## Compatibility Notes

This helper is intended for PS3 systems that already expose the `pad.ps3` endpoint. A stock PS3 will not respond to this command by default.

Because the app may be served over HTTPS while the PS3 endpoint is usually plain HTTP, some browsers may block the hidden background request. The direct link is included as a fallback for those cases.

## License

MIT License. See `LICENSE` for details.

## Disclaimer

This is an unofficial helper project. It is not affiliated with Sony, PlayStation, webMAN MOD, or any controller manufacturer.
