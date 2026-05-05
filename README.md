# PS3 Home Button Helper

A tiny static web page that opens the PS3 PS/Home button command endpoint:

```text
http://<PS3_ADDRESS>/pad.ps3?_psbtn_go
```

It is meant for people using a PS4 controller on PS3 who need a quick way to return to the PS3 home menu without a native PS3 controller nearby.

## What This Project Does

- Stores your PS3 local address in the browser.
- Builds the correct `pad.ps3?_psbtn_go` command URL.
- Opens that URL from a phone, tablet, or PC on the same local network.
- Works as a simple GitHub Pages site with no build step and no backend.

This project does not pair controllers, install homebrew, modify your console, or add the endpoint by itself. It only opens a web command endpoint that must already exist on your PS3.

## Requirements

- A PS3 reachable from your local network.
- A PS3 setup that exposes the `pad.ps3` web endpoint, such as webMAN MOD or another compatible homebrew setup.
- A phone, tablet, or PC connected to the same local network as the PS3.
- The PS3 local IP address, for example `192.168.1.50`.

## How To Use

1. Open the GitHub Pages site.
2. Enter the local IP address or hostname of your PS3.
3. Press **Send PS Button**.
4. Your browser opens `http://<PS3_ADDRESS>/pad.ps3?_psbtn_go`.

The opened page may look blank or show a simple browser error after the command is sent. That can be normal, because the useful part is the request reaching the PS3.

## Why It Opens A Page Instead Of Using A Background Request

GitHub Pages is served over HTTPS. Most PS3 web endpoints are served over plain HTTP on the local network.

Modern browsers often block HTTPS pages from making background HTTP requests because that is considered mixed content. This helper avoids that problem by opening the command URL as a normal page navigation.

## Local Use

You can also use the project without GitHub Pages:

1. Download or clone this repository.
2. Open `index.html` in a browser.
3. Enter your PS3 address and send the command.

No server, package manager, or build tool is required.

## Deploy To GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository root:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
   - `LICENSE`
   - `.nojekyll`
3. Open the repository settings on GitHub.
4. Go to **Pages**.
5. Set **Source** to **Deploy from a branch**.
6. Select the `main` branch and the repository root.
7. Save, then open the URL GitHub gives you.

## Troubleshooting

### The PS3 Does Not Respond

- Confirm the PS3 and your phone or PC are on the same Wi-Fi or wired LAN.
- Confirm the PS3 IP address is correct.
- Try opening `http://<PS3_ADDRESS>/` directly in your browser.
- Make sure the software that provides `pad.ps3` is installed and running on the PS3.

### The Browser Blocks The New Tab

Use the **Open direct link** option after entering the PS3 address. Some browsers are strict about pop-ups, especially on mobile.

### The Command URL Uses The Wrong Address

Edit the address field. The value is saved in your browser local storage, so each device can keep its own PS3 address.

## Security Notes

Keep the PS3 web endpoint on your local network only.

Do not port-forward the PS3 web interface to the internet. The endpoint can trigger console input, so it should only be reachable by devices you trust on your LAN.

## Project Structure

```text
.
├── index.html
├── styles.css
├── script.js
├── README.md
├── LICENSE
└── .nojekyll
```

## License

MIT License. See `LICENSE` for details.

## Disclaimer

This is an unofficial helper project. It is not affiliated with Sony, PlayStation, webMAN MOD, or any controller manufacturer.
