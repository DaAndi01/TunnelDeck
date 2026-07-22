# TunnelDeck 2.0.0 — Modernisation & Fix Design

Date: 2026-07-22

## Goal

Take the most-maintained TunnelDeck (`bkohler616`, store version 1.0.4/1.0.5,
March 2023 → Oct 2024) and:

1. Migrate it to the current Decky plugin API so it keeps working on modern
   Decky Loader / SteamOS.
2. Fix the outstanding security issue and bugs.
3. Ensure **both OpenVPN and WireGuard** connections work.

Source picked: `bkohler616`, not `steve228uk` (abandoned 1.0.2) and not
`pedroegg` (a mirror whose only recent activity is an unrelated "VN Hider"
experiment on `cursor/*` branches).

## Frontend migration (`decky-frontend-lib` → `@decky/api` + `@decky/ui`)

| Before | After |
| --- | --- |
| `import … from "decky-frontend-lib"` | UI from `@decky/ui`, plugin API from `@decky/api` |
| `definePlugin((serverApi) => …)` | `definePlugin(() => …)` |
| `serverAPI.callPluginMethod<A,R>("m", args)` returning `{result}` | `const m = callable<[args], R>("m")` returning the value, throwing on error |
| `VFC` component | plain function component (React 19) |
| `tryCatchHandler` passing the call function around | one `callable` per method + local `try/catch` |
| `title:` in plugin return | `name:` + `titleView:` |

WireGuard support is preserved by keeping the connection filter
`["vpn", "wireguard"].includes(connection.type)` and the generic
`nmcli connection up/down <uuid>` path (works for both types).

## Backend migration (`settings`/`helpers` → `decky`)

- `get_user()` / hand-built home paths → `decky` constants.
- `SettingsManager` (previously provided by the loader) → a tiny local JSON
  settings helper under `decky.DECKY_PLUGIN_SETTINGS_DIR` (only one boolean is
  stored, so no external dependency).
- `logging.basicConfig(/tmp/…)` → `decky.logger`.
- Added `_uninstall` (unmount sysext on removal) alongside the existing
  `_unload`.
- Removed the internal `self.method(self, …)` double-self calling convention
  (an old-loader quirk); modern decky binds `self` normally.

## Security fix

`defaults/extensions/install` now verifies the downloaded
`networkmanager-openvpn-1.10.0-1-x86_64.pkg.tar.zst` against a pinned SHA-256
(`07f5c45e…098e03`) before extracting and mounting it as root. Mismatch aborts
the install and deletes the file. This closes the unverified root-level download.

## Bug fixes

- `active_connection`: the old `nmcli … "|" "grep" …` never piped (no shell);
  replaced with `nmcli -t -f ipv6.method connection show <uuid>` + a Python check.
- `gateway_finder`: `parser_type is 0/1/2` → `==` (identity vs. value comparison).
- `get_prioritized_network_info`: `name is ""` → `== ""`.
- Log statements: `"…" + "yes" if x else "no"` → correctly parenthesised.
- Broken bash conditionals `if [ ! $(grep -q …) ]` → `if ! grep -q …` (2 places).
- Light UUID validation in `up`/`down` (defence in depth; calls already use the
  no-shell list form of `subprocess`).

## Out of scope (YAGNI)

- The pinned OpenVPN package version stays at 1.10.0 (only its hash is verified);
  bumping it is a separate change.
- No routerHook/event usage added.

## Verification

- Build: `pnpm install && pnpm run build` produces `dist/index.js` (done on the
  build machine).
- Python: `python -m py_compile main.py` with a `decky` stub (syntax only).
- Runtime VPN behaviour (OpenVPN + WireGuard connect/disconnect) is verified by
  the maintainer on a real Steam Deck — it cannot be exercised on the build host.
