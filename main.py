import subprocess
import pprint
import os
from os import path
import re
import json
import traceback

# The decky plugin module is located at decky-loader/plugin.
# It exposes constants (paths, user info), a `logger`, and `emit` for events.
import decky

logger = decky.logger

# Settings are stored as a small JSON file in decky's recommended settings dir.
SETTINGS_PATH = path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "tunneldeck.json")


def _read_settings():
    try:
        with open(SETTINGS_PATH, "r") as fh:
            return json.load(fh)
    except (FileNotFoundError, ValueError):
        return {}
    except Exception as err:
        logger.error("Failed reading settings: %s", err)
        return {}


def _get_setting(key, default=None):
    return _read_settings().get(key, default)


def _set_setting(key, value):
    data = _read_settings()
    data[key] = value
    os.makedirs(decky.DECKY_PLUGIN_SETTINGS_DIR, exist_ok=True)
    with open(SETTINGS_PATH, "w") as fh:
        json.dump(data, fh)


# Only allow characters that appear in NetworkManager UUIDs / connection ids.
# subprocess is always invoked in list form (no shell), so this is defence in depth.
_SAFE_ID = re.compile(r"^[0-9A-Za-z][0-9A-Za-z._\- ]*$")


def _is_safe_id(value):
    return isinstance(value, str) and bool(_SAFE_ID.match(value))


badResponse = {
    "success": False,
    "data": 'N/A'
}

ipv6_gateways = ['IP6.GATEWAY', 'IP6.DNS[3]', 'IP6.DNS[2]', 'IP6.DNS[1]']
ipv4_gateways = ['IP4.GATEWAY', 'IP4.DNS[3]', 'IP4.DNS[2]', 'IP4.DNS[1]']
backup_gateway = ':domain_name_servers'


def connection_mapper(xn):
    # Filter out connection names like "FBI: Surveillance van" (nmcli escapes them for us).
    components = re.split(r"(?<!\\):", xn)
    return {
        "name": components[0],
        "uuid": components[1],
        "type": components[2],
        "device": components[3],
        "connected": False if not components[3] else True
    }


def gateway_finder(new_id, parser_type):
    if parser_type == 0:
        # IPV4
        item = new_id.split(':')
        item.pop(0)
        return ''.join(item)
    if parser_type == 1:
        # IPV6
        item = new_id.split(':')
        item.pop(0)
        return ':'.join(item)
    if parser_type == 2:
        # :domain_name_servers
        final_res = new_id.strip().split(":")  # 'domain_name_servers = 8.8.8.8 192.168.2.1'
        final_res.pop(0)
        final_res = ''.join(final_res).split("=") if final_res[1] else [""]  # ' 8.8.8.8 192.168.2.1'
        final_res = final_res[1].split(" ") if final_res[1] else []  # ['8.8.8.8', '192.168.2.1']
        return final_res[-1] if len(final_res) else None
    return None


def get_active_connection():
    result = subprocess.run(["nmcli", "-t", "connection", "show", "--active"],
                            text=True, capture_output=True).stdout
    connections = result.splitlines()
    mapped = map(connection_mapper, connections)
    return next(filter(lambda xn: 'wireless' in xn["type"] or 'ethernet' in xn["type"], mapped), None)


def run_install_script():
    logger.info("Running Install Script")
    subprocess.run(["bash", path.dirname(__file__) + "/extensions/install"],
                   cwd=path.dirname(__file__) + "/extensions")


def run_uninstall_script():
    logger.info("Running Uninstall Script")
    subprocess.run(["bash", path.dirname(__file__) + "/extensions/uninstall"],
                   cwd=path.dirname(__file__) + "/extensions")


def log_pretty(obj):
    pp = pprint.PrettyPrinter(indent=2, sort_dicts=False)
    return f"{pp.pformat(obj)}"


class Plugin:
    current_data = {
        "steam_ip": "",
        "active_connection": {
            "name": "",
            "uuid": "",
            "type": "",
            "device": "",
            "connected": False,
            "ipv6_disabled": False,
        },
        "priority_interface": {
            "success": False,
            "data": "N/A",
            "ip": '',
        },
        "ping_results": [],
    }  # Data structure template of "cached" data to prevent redundant calls.

    # region Plugin entry / exit
    async def _main(self):
        logger.info("Loading OpenVPN setting")
        await self.reset_cached_data()
        openvpn_enabled = _get_setting("openvpn_enabled", False)
        logger.info("OpenVPN enabled: " + ("yes" if openvpn_enabled else "no"))
        if openvpn_enabled:
            run_install_script()

    async def _unload(self):
        openvpn_enabled = _get_setting("openvpn_enabled", False)
        logger.info("OpenVPN enabled: " + ("yes" if openvpn_enabled else "no"))
        if openvpn_enabled:
            run_uninstall_script()

    async def _uninstall(self):
        logger.info("Uninstalling: removing OpenVPN system extension if present")
        run_uninstall_script()

    # endregion

    # region Network info collectors
    # Reset all cached network information.
    async def reset_cached_data(self):
        logger.debug("reset_cached_data called - last set was %s", log_pretty(self.current_data))
        self.current_data = {
            "steam_ip": "",
            "active_connection": {
                "name": "",
                "uuid": "",
                "type": "",
                "device": "",
                "connected": False,
                "ipv6_disabled": False,
            },
            "priority_interface": {
                "success": False,
                "data": "N/A",
                "ip": '',
            },
            "ping_results": [],
        }
        return True

    # Collect the IP address of steam.
    async def get_steam_ip(self):
        logger.debug("Collecting steam's IP")
        try:
            getent_data = subprocess.run(["getent", "ahosts", "steampowered.com"],
                                         text=True, capture_output=True, timeout=15)
        except subprocess.TimeoutExpired:
            logger.debug("Collecting steam's IP timed out")
            return
        if getent_data.stderr and not getent_data.stdout:
            return
        for e in getent_data.stdout.splitlines():
            if "STREAM" in e:
                res = e.split(" ")[0]
                logger.debug("steam's ip is %s", res)
                self.current_data["steam_ip"] = res
                return res

    # Collect both priority interface name and IP.
    async def get_priority_interface(self):
        try:
            logger.debug("get_priority_interface - enter")

            steam_ip = self.current_data["steam_ip"]
            if not steam_ip:
                steam_ip = await self.get_steam_ip()

            if not steam_ip:
                logger.debug("get_priority_interface - no steam IP found")
                return badResponse

            try:
                ip_data = subprocess.run(["ip", "-j", "route", "get", steam_ip],
                                         text=True, capture_output=True, timeout=15)
            except subprocess.TimeoutExpired:
                logger.debug("get_priority_interface - ip route timed out")
                return badResponse

            if ip_data.stderr or not ip_data.stdout:
                result = badResponse
            else:
                try:
                    ip_route_data = json.loads(ip_data.stdout)
                    result = {
                        "success": True,
                        "data": ip_route_data[0]["dev"],
                        "ip": ip_route_data[0]['prefsrc']
                    }
                except ValueError as e:
                    logger.error("get_priority_interface - JSON parsing failed due to %s", e)
                    result = badResponse

            self.current_data['priority_interface'] = result
            return result
        except Exception as err:
            logger.error("get_priority_interface error - %s", log_pretty(err))
            return {
                "success": False,
                "data": log_pretty(err)
            }

    # Collect detailed networking information based on the prioritized interface name.
    async def get_prioritized_network_info(self):
        try:
            logger.debug("get_prioritized_network_info enter")

            connection_data = self.current_data['active_connection']
            if connection_data['connected'] is False or connection_data['name'] == "":
                connection_data = await self.active_connection()
            logger.debug("get_prioritized_network_info connection_data %s", connection_data)

            interface_name = self.current_data["priority_interface"]
            if not interface_name['success'] or not interface_name['data']:
                interface_name = await self.get_priority_interface()

            logger.debug("get_prioritized_network_info interface_name %s", interface_name)

            if connection_data is None or not interface_name['success'] or not interface_name['data']:
                logger.debug("get_prioritized_network_info drop out due to no response or bad interface")
                return badResponse

            nmcli_res = subprocess.run(["nmcli", "-f", "all", "-t", "device", "show", interface_name['data']],
                                       text=True,
                                       capture_output=True).stdout.splitlines()
            logger.debug("get_prioritized_network_info nmcli_res %s", nmcli_res)

            network_info = []
            collected_gateway = None
            for e in nmcli_res:
                found_value = e.split(":")
                found_value = found_value[1] if len(found_value) > 1 else None
                # region Priority network data
                if "GENERAL.DEVICE" in e and found_value:
                    network_info.append(f"DEVICE: {found_value}")
                if "GENERAL.TYPE" in e and found_value:
                    network_info.append(f"TYPE: {found_value}")
                if "GENERAL.STATE" in e and found_value:
                    network_info.append(f"STATE: {found_value}")
                if "GENERAL.REASON" in e and found_value:
                    network_info.append(f"REASON: {found_value}")
                if "GENERAL.IP4-CONNECTIVITY" in e and found_value:
                    network_info.append(f"IP4-CONN: {found_value}")
                if "GENERAL.IP6-CONNECTIVITY" in e and found_value:
                    network_info.append(f"IP6-CONN: {found_value}")
                if "GENERAL.IP-IFACE" in e and found_value:
                    network_info.append(f"IP-IFACE: {found_value}")
                if "GENERAL.CONNECTION" in e and found_value:
                    network_info.append(f"CONNECTION: {found_value}")
                if "GENERAL.METERED" in e and found_value:
                    network_info.append(f"METERED: {found_value}")
                if "CAPABILITIES.SPEED" in e and found_value:
                    network_info.append(f"SPEED: {found_value}")

                if ".ADDRESS" in e and found_value:
                    item = e.split(':')
                    network_info.append(f"{item.pop(0)}: {':'.join(item)}")
                if ".GATEWAY" in e and found_value:
                    item = e.split(':')
                    item.pop(0)
                    network_info.append(f"{e.split(':')[0]}: {':'.join(item)}")
                if ".DNS" in e and found_value:
                    item = e.split(':')
                    item.pop(0)
                    network_info.append(f"{e.split(':')[0]}: {':'.join(item)}")
                # endregion
                # region gateway data
                if not connection_data["ipv6_disabled"]:
                    for i in ipv6_gateways:
                        if collected_gateway:
                            break
                        if i in e and found_value:
                            collected_gateway = gateway_finder(e, 1)
                            break
                for i in ipv4_gateways:
                    if collected_gateway:
                        break
                    if i in e and found_value:
                        collected_gateway = gateway_finder(e, 0)

                if not collected_gateway and ":domain_name_servers" in e and found_value:
                    collected_gateway = gateway_finder(e, 2)
                # endregion

            if collected_gateway is None:
                logger.debug("get_prioritized_network_info did not find a gateway address")
                gateway_ping = False
            else:
                gateway_ping = await self.can_ping_address(collected_gateway)

            ping_res = []
            for ping in self.current_data['ping_results']:
                str_builder = f'Pinging {ping["address"]}'
                str_builder = f'{str_builder} {"succeeded" if ping["could_ping"] else "failed"}'
                if ping["could_ping"]:
                    str_builder = f'{str_builder} in {ping["ping_time"]}'
                ping_res.append(str_builder)

            final_res = '\n'.join(ping_res + network_info)
            return {
                "success": bool(network_info),
                "data": final_res,
                "gateway_ping": gateway_ping,
            }
        except Exception as err:
            logger.error("get_prioritized_network_info error - %s - %s", log_pretty(err), traceback.format_exc())
            return {
                "success": False,
                "data": log_pretty(err)
            }

    # Can we ping steampowered.com
    async def is_internet_available(self):
        return await self.can_ping_address("steampowered.com")

    # Can we ping the provided network address
    async def can_ping_address(self, address):
        logger.debug("Pinging %s", address)
        try:
            ping_data = subprocess.run(["ping", "-c", "1", "-W", "5", address],
                                       text=True, capture_output=True, timeout=15)
        except subprocess.TimeoutExpired:
            self.current_data['ping_results'].append({'address': address, 'could_ping': False})
            return False

        ping_res = not bool(ping_data.stderr)
        if not ping_res:
            self.current_data['ping_results'].append({'address': address, 'could_ping': False})
        else:
            ping_time = ''
            for item in ping_data.stdout.splitlines():
                if 'rtt' in item.lower():
                    ping_time = item.split('=')[1].split('/')[1]
            self.current_data['ping_results'].append({
                'address': address,
                'could_ping': True,
                'ping_time': f'{ping_time} ms'
            })
        logger.debug("Pinging %s finished. Result: %s", address, ping_res)
        return ping_res

    # endregion

    # region Collect and set current VPN
    # Lists the connections from NetworkManager. If device is empty then it's disconnected.
    async def show(self):
        result = subprocess.run(["nmcli", "-t", "connection", "show"], text=True, capture_output=True).stdout
        mapped = list(map(connection_mapper, result.splitlines()))
        logger.info("SHOW - found the following possible networks: %s", log_pretty(mapped))
        return mapped

    # Establishes a connection to a VPN (works for OpenVPN and WireGuard connections).
    async def up(self, uuid):
        if not _is_safe_id(uuid):
            logger.error("up() called with invalid uuid: %r", uuid)
            return ""
        logger.info("OPENING connection to: " + uuid)
        await self.reset_cached_data()
        result = subprocess.run(["nmcli", "connection", "up", uuid], text=True, capture_output=True).stdout
        return result

    # Closes a connection to a VPN (works for OpenVPN and WireGuard connections).
    async def down(self, uuid):
        if not _is_safe_id(uuid):
            logger.error("down() called with invalid uuid: %r", uuid)
            return ""
        logger.info("CLOSING connection to: " + uuid)
        await self.reset_cached_data()
        result = subprocess.run(["nmcli", "connection", "down", uuid], text=True, capture_output=True).stdout
        return result

    # Determines the active physical connection and whether IPV6 is disabled on it.
    async def active_connection(self):
        logger.debug("active_connection enter")

        connection = get_active_connection()
        if connection is None:
            logger.debug("active_connection connection is none")
            return None

        # nmcli terse, only the ipv6.method field for this connection.
        result = subprocess.run(
            ["nmcli", "-t", "-f", "ipv6.method", "connection", "show", connection["uuid"]],
            text=True, capture_output=True).stdout
        connection["ipv6_disabled"] = "disabled" in result

        logger.debug("active_connection ipv6 disabled is %s", connection["ipv6_disabled"])
        self.current_data['active_connection'] = connection
        return connection

    # endregion

    # region Collect and modify connection settings
    # Disables IPV6 on currently active connection.
    async def disable_ipv6(self):
        await self.reset_cached_data()

        connection = get_active_connection()
        if connection is None:
            return True

        logger.info("DISABLING IPV6 for: " + connection["uuid"])
        subprocess.run(["nmcli", "connection", "modify", connection["uuid"], "ipv6.method", "disabled"])
        subprocess.run(["systemctl", "restart", "NetworkManager"])
        return True

    # Enable IPV6 on currently active connection.
    async def enable_ipv6(self):
        await self.reset_cached_data()

        connection = get_active_connection()
        if connection is None:
            return True

        logger.info("ENABLING IPV6 for: " + connection["uuid"])
        subprocess.run(["nmcli", "connection", "modify", connection["uuid"], "ipv6.method", "auto"])
        subprocess.run(["systemctl", "restart", "NetworkManager"])
        return True

    # Checks if the OpenVPN package is installed via pacman.
    async def is_openvpn_pacman_installed(self):
        try:
            subprocess.run(["pacman", "-Qi", "networkmanager-openvpn"], check=True,
                           capture_output=True)
            return True
        except subprocess.CalledProcessError:
            return False

    # The OpenVPN setting.
    async def is_openvpn_enabled(self):
        return _get_setting("openvpn_enabled", False)

    # Enable OpenVPN.
    async def enable_openvpn(self):
        logger.info("Enabling OpenVPN")
        await self.reset_cached_data()
        _set_setting("openvpn_enabled", True)
        run_install_script()
        return True

    # Disable OpenVPN.
    async def disable_openvpn(self):
        logger.info("Disabling OpenVPN")
        await self.reset_cached_data()
        _set_setting("openvpn_enabled", False)
        run_uninstall_script()
        return True

    # endregion
