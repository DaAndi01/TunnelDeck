import {
  PanelSection,
  PanelSectionRow,
  ToggleField,
  ButtonItem,
  Navigation,
  Field,
  staticClasses,
} from "@decky/ui";
import {
  callable,
  definePlugin,
} from "@decky/api";
import { useEffect, useState } from "react";
import { FaShieldAlt } from "react-icons/fa";

type Connection = {
  name: string;
  uuid: string;
  type: string;
  connected: boolean;
  ipv6_disabled?: boolean;
};

interface PluginResponse {
  success: boolean;
  data: string;
}

interface InterfaceResponse extends PluginResponse {
  ip: string;
}

interface NetworkResponse extends PluginResponse {
  gateway_ping: boolean;
}

// Backend method bindings (@decky/api). Each returns its value directly and throws on error.
const show = callable<[], Connection[]>("show");
const up = callable<[uuid: string], string>("up");
const down = callable<[uuid: string], string>("down");
const activeConnection = callable<[], Connection | null>("active_connection");
const resetCachedData = callable<[], boolean>("reset_cached_data");
const disableIpv6 = callable<[], boolean>("disable_ipv6");
const enableIpv6 = callable<[], boolean>("enable_ipv6");
const isOpenvpnPacmanInstalled = callable<[], boolean>("is_openvpn_pacman_installed");
const isOpenvpnEnabled = callable<[], boolean>("is_openvpn_enabled");
const enableOpenvpn = callable<[], boolean>("enable_openvpn");
const disableOpenvpn = callable<[], boolean>("disable_openvpn");
const getPriorityInterface = callable<[], InterfaceResponse>("get_priority_interface");
const isInternetAvailable = callable<[], boolean>("is_internet_available");
const getPrioritizedNetworkInfo = callable<[], NetworkResponse>("get_prioritized_network_info");

// Polling state kept at module scope so it survives re-renders.
let interfaceCheckerId: number;
let isActuallyRefreshing = true;

function Content() {
  const [loaded, setLoaded] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [priorityInterface, setPriorityInterface] = useState("N/A");
  const [priorityInterfaceLanIp, setPriorityInterfaceLanIp] = useState("N/A");
  const [canReachGateway, setCanReachGateway] = useState("N/A");
  const [canReachSteam, setCanReachSteam] = useState("N/A");
  const [priorityNetworkInfo, setPriorityNetworkInfo] = useState<string[]>(["N/A"]);
  const [activeConn, setActiveConn] = useState<Connection>();
  const [ipv6Disabled, setIpv6Disabled] = useState(false);
  const [openVPNEnabled, setOpenVPNEnabled] = useState(false);
  const [openVPNDisabled, setOpenVPNDisabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);

  const interfaceChecker = () => {
    clearTimeout(interfaceCheckerId);
    interfaceCheckerId = window.setTimeout(() => {
      if (isActuallyRefreshing) {
        return interfaceChecker();
      }
      getInterfaceData().finally(interfaceChecker);
    }, 5000);
  };

  const collectNetworkInfo = () => {
    if (isActuallyRefreshing && loaded) {
      return;
    }
    isActuallyRefreshing = true;
    clearTimeout(interfaceCheckerId);
    window.setTimeout(() => {
      getInterfaceData().finally(interfaceChecker);
    }, 1000);
  };

  const setRefreshState = () => {
    clearTimeout(interfaceCheckerId);
    setIsRefreshing(true);
    setPriorityInterface("N/A");
    setPriorityInterfaceLanIp("N/A");
    setCanReachSteam("N/A");
    setCanReachGateway("N/A");
    setPriorityNetworkInfo(["N/A"]);
  };

  const getInterfaceData = async () => {
    setIsRefreshing(true);
    isActuallyRefreshing = true;
    console.log("TunnelDeck - Collecting interface data");
    try {
      try {
        await resetCachedData();
      } catch (e) {
        console.error("TunnelDeck - reset_cached_data failed", e);
      }

      const pPriorityInterface = getPriorityInterface()
        .then((res) => {
          setPriorityInterfaceLanIp(res.success ? res.ip : "N/A");
          setPriorityInterface(res.success ? res.data : "N/A");
        })
        .catch((e) => {
          console.error("TunnelDeck - get_priority_interface failed", e);
          setPriorityInterfaceLanIp("N/A");
          setPriorityInterface("N/A");
        });

      const pIsSteamAvailable = isInternetAvailable()
        .then((res) => setCanReachSteam(res ? "Yes" : "No"))
        .catch((e) => {
          console.error("TunnelDeck - is_internet_available failed", e);
          setCanReachSteam("No");
        });

      const pPriorityNetworkInfo = getPrioritizedNetworkInfo()
        .then((res) => {
          setPriorityNetworkInfo(res.success ? res.data.split("\n") : ["N/A"]);
          setCanReachGateway(res.success && res.gateway_ping ? "Yes" : "No");
        })
        .catch((e) => {
          console.error("TunnelDeck - get_prioritized_network_info failed", e);
          setPriorityNetworkInfo(["N/A"]);
          setCanReachGateway("No");
        });

      await Promise.all([pIsSteamAvailable, pPriorityInterface, pPriorityNetworkInfo]);
    } catch (e) {
      console.error("TunnelDeck - Error: ", e);
    } finally {
      console.log("TunnelDeck - Finished refreshing");
      setIsRefreshing(false);
      isActuallyRefreshing = false;
    }
  };

  const loadConnections = async () => {
    try {
      const conn = await activeConnection();
      if (conn) {
        setActiveConn(conn);
        setIpv6Disabled(!!conn.ipv6_disabled);
      }
    } catch (error) {
      console.error(error);
    }

    let pacmanInstalled = false;
    try {
      pacmanInstalled = await isOpenvpnPacmanInstalled();
      setOpenVPNDisabled(pacmanInstalled);
    } catch (error) {
      console.error(error);
    }

    if (!pacmanInstalled) {
      try {
        setOpenVPNEnabled(await isOpenvpnEnabled());
      } catch (error) {
        console.error(error);
      }
    }

    try {
      const all = await show();
      const filtered = all
        // Keep OpenVPN ("vpn") and WireGuard ("wireguard") connections.
        .filter((connection) => ["vpn", "wireguard"].includes(connection.type))
        .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
      setConnections(filtered);
    } catch (error) {
      console.error(error);
    }

    setLoaded(true);
    collectNetworkInfo();
  };

  const toggleConnection = async (connection: Connection, switchValue: boolean) => {
    setRefreshState();
    try {
      await (switchValue ? up(connection.uuid) : down(connection.uuid));
    } catch (e) {
      console.error("TunnelDeck - toggleConnection failed", e);
    }
    collectNetworkInfo();
  };

  const toggleIpv6 = async (switchValue: boolean) => {
    setIpv6Disabled(switchValue);
    setRefreshState();
    try {
      await (switchValue ? disableIpv6() : enableIpv6());
    } catch (e) {
      console.error("TunnelDeck - toggleIpv6 failed", e);
    }
    collectNetworkInfo();
  };

  const toggleOpenVPN = async (switchValue: boolean) => {
    setOpenVPNEnabled(switchValue);
    setRefreshState();
    try {
      await (switchValue ? enableOpenvpn() : disableOpenvpn());
    } catch (e) {
      console.error("TunnelDeck - toggleOpenVPN failed", e);
    }
    collectNetworkInfo();
  };

  useEffect(() => {
    loadConnections();
    return () => {
      clearTimeout(interfaceCheckerId);
    };
  }, []);

  return (
    <>
      <PanelSection title="Connections">
        {loaded && connections.length == 0 && (
          <PanelSectionRow>No Connections Found</PanelSectionRow>
        )}

        {connections.length > 0 &&
          connections.map((connection) => (
            <PanelSectionRow>
              <ToggleField
                bottomSeparator="standard"
                checked={connection.connected}
                label={connection.name}
                description={`Type: ${connection.type}`}
                onChange={(switchValue: boolean) => {
                  toggleConnection(connection, switchValue);
                }}
              />
            </PanelSectionRow>
          ))}

        <PanelSectionRow>
          <ButtonItem
            onClick={() => {
              Navigation.NavigateToExternalWeb("https://github.com/DaAndi01/TunnelDeck#readme");
              Navigation.CloseSideMenus();
            }}
          >
            How Do I Add Connections?
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Network Info" spinner={isRefreshing}>
        <PanelSectionRow>
          <Field label="Prioritized Network Interface" description={priorityInterface} focusable={true} />
        </PanelSectionRow>
        <PanelSectionRow>
          <Field label="Prioritized Interface LAN IP" description={priorityInterfaceLanIp} focusable={true} />
        </PanelSectionRow>
        <PanelSectionRow>
          <Field label="Can reach gateway" description={canReachGateway} focusable={true} />
        </PanelSectionRow>
        <PanelSectionRow>
          <Field label="Can reach steampowered.com" description={canReachSteam} focusable={true} />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Settings">
        <PanelSectionRow>
          <ToggleField
            bottomSeparator="standard"
            checked={openVPNEnabled || openVPNDisabled}
            label="Enable OpenVPN"
            disabled={!loaded || openVPNDisabled}
            description="Installs OpenVPN support for Network Manager. WireGuard needs no install."
            onChange={toggleOpenVPN}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <ToggleField
            bottomSeparator="standard"
            checked={ipv6Disabled}
            label="Disable IPV6"
            disabled={!activeConn || !loaded}
            description="Disables IPV6 support for the current connection. Required for some VPNs."
            onChange={toggleIpv6}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Additional network info" spinner={isRefreshing}>
        {loaded && priorityNetworkInfo.length == 0 && (
          <PanelSectionRow>No Network Info found</PanelSectionRow>
        )}

        {priorityNetworkInfo.length > 0 &&
          priorityNetworkInfo.map((infoItem) => (
            <PanelSectionRow>
              <Field description={infoItem} focusable={true} padding={"none"} />
            </PanelSectionRow>
          ))}
      </PanelSection>
    </>
  );
}

export default definePlugin(() => {
  return {
    name: "TunnelDeck",
    titleView: <div className={staticClasses.Title}>TunnelDeck</div>,
    content: <Content />,
    icon: <FaShieldAlt />,
    onDismount() {
      clearTimeout(interfaceCheckerId);
    },
  };
});
