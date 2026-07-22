# TunnelDeck

TunnelDeck lets you connect to **OpenVPN** and **WireGuard** VPNs from Gaming Mode
on the Steam Deck. Any connection added in Desktop Mode or from the command line
(via NetworkManager) becomes available in the TunnelDeck quick-access menu.

TunnelDeck can also install the NetworkManager OpenVPN plugin as a
[system extension](https://man.archlinux.org/man/systemd-sysext.8.en), so the
file system stays read-only and `pacman` does not need to be configured.
**WireGuard needs no extra install** — NetworkManager supports it natively on
SteamOS.

> This is a modernised fork maintained by **DaAndi01**, migrated to the current
> Decky plugin API (`@decky/api` + `@decky/ui`). See `docs/DESIGN.md` for what
> changed and why.

## Version 2.0.0 — what's new

- Migrated from the deprecated `decky-frontend-lib` to `@decky/api` + `@decky/ui`
  (builds with `@decky/rollup`, React 19, TypeScript 5).
- Backend migrated from the removed `settings`/`helpers` modules to the official
  `decky` module.
- **Security:** the OpenVPN package download is now verified against a pinned
  SHA-256 before it is extracted and mounted as root.
- Fixed several backend bugs (IPv6 status detection, gateway parsing, logging).

## Settings

- **Enable OpenVPN** — installs the NetworkManager OpenVPN plugin (system extension).
- **Disable IPV6** — disables IPV6 on the current connection. Required by some VPNs.

## Usage

Connections must be created once in Desktop Mode (usually from a `.conf` / `.ovpn`
file provided by your VPN provider).

### Create / import a connection

1. Desktop Mode → **System Settings** → **Connections** (Network section).
2. Click **+**, scroll to **Other**, choose **Import VPN connection…** for OpenVPN,
   or add a **WireGuard** connection and import its `.conf`.
3. For OpenVPN with username/password, enter them under the **VPN** tab and enable
   **Store password for all users (not encrypted)** — TunnelDeck connects as root.

### Connect

In Gaming Mode open the quick-access menu (**...**) → **TunnelDeck** → toggle a
connection on/off.

## ⚠️ Disclaimer

Using a VPN with Steam may be against Steam's terms of service. The developers take
no responsibility for any action Valve may take against your account.

## Building

Requires Node + pnpm.

```bash
pnpm install
pnpm run build   # produces dist/index.js
```

Then copy the plugin folder to `~/homebrew/plugins/TunnelDeck` on the Deck (Decky
developer mode / SSH), or zip it for installation. The folder must contain
`plugin.json`, `main.py`, `dist/`, and `defaults/`.

## Credits

- [Stephen Radford](https://github.com/steve228uk) — original author
- [Benjamin Kohler](https://github.com/bkohler616) — fork that added the network-info features
- DaAndi01 — this modernised fork
