const manifest = {"name":"TunnelDeck"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var attr = props.attr,
      size = props.size,
      title = props.title,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaShieldAlt (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M466.5 83.7l-192-80a48.15 48.15 0 0 0-36.9 0l-192 80C27.7 91.1 16 108.6 16 128c0 198.5 114.5 335.7 221.5 380.3 11.8 4.9 25.1 4.9 36.9 0C360.1 472.6 496 349.3 496 128c0-19.4-11.7-36.9-29.5-44.3zM256.1 446.3l-.1-381 175.9 73.3c-3.3 151.4-82.1 261.1-175.8 307.7z"},"child":[]}]})(props);
}

// Backend method bindings (@decky/api). Each returns its value directly and throws on error.
const show = callable("show");
const up = callable("up");
const down = callable("down");
const activeConnection = callable("active_connection");
const resetCachedData = callable("reset_cached_data");
const disableIpv6 = callable("disable_ipv6");
const enableIpv6 = callable("enable_ipv6");
const isOpenvpnPacmanInstalled = callable("is_openvpn_pacman_installed");
const isOpenvpnEnabled = callable("is_openvpn_enabled");
const enableOpenvpn = callable("enable_openvpn");
const disableOpenvpn = callable("disable_openvpn");
const getPriorityInterface = callable("get_priority_interface");
const isInternetAvailable = callable("is_internet_available");
const getPrioritizedNetworkInfo = callable("get_prioritized_network_info");
// Polling state kept at module scope so it survives re-renders.
let interfaceCheckerId;
let isActuallyRefreshing = true;
function Content() {
    const [loaded, setLoaded] = SP_REACT.useState(false);
    const [connections, setConnections] = SP_REACT.useState([]);
    const [priorityInterface, setPriorityInterface] = SP_REACT.useState("N/A");
    const [priorityInterfaceLanIp, setPriorityInterfaceLanIp] = SP_REACT.useState("N/A");
    const [canReachGateway, setCanReachGateway] = SP_REACT.useState("N/A");
    const [canReachSteam, setCanReachSteam] = SP_REACT.useState("N/A");
    const [priorityNetworkInfo, setPriorityNetworkInfo] = SP_REACT.useState(["N/A"]);
    const [activeConn, setActiveConn] = SP_REACT.useState();
    const [ipv6Disabled, setIpv6Disabled] = SP_REACT.useState(false);
    const [openVPNEnabled, setOpenVPNEnabled] = SP_REACT.useState(false);
    const [openVPNDisabled, setOpenVPNDisabled] = SP_REACT.useState(false);
    const [isRefreshing, setIsRefreshing] = SP_REACT.useState(true);
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
            }
            catch (e) {
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
        }
        catch (e) {
            console.error("TunnelDeck - Error: ", e);
        }
        finally {
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
        }
        catch (error) {
            console.error(error);
        }
        let pacmanInstalled = false;
        try {
            pacmanInstalled = await isOpenvpnPacmanInstalled();
            setOpenVPNDisabled(pacmanInstalled);
        }
        catch (error) {
            console.error(error);
        }
        if (!pacmanInstalled) {
            try {
                setOpenVPNEnabled(await isOpenvpnEnabled());
            }
            catch (error) {
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
        }
        catch (error) {
            console.error(error);
        }
        setLoaded(true);
        collectNetworkInfo();
    };
    const toggleConnection = async (connection, switchValue) => {
        setRefreshState();
        try {
            await (switchValue ? up(connection.uuid) : down(connection.uuid));
        }
        catch (e) {
            console.error("TunnelDeck - toggleConnection failed", e);
        }
        collectNetworkInfo();
    };
    const toggleIpv6 = async (switchValue) => {
        setIpv6Disabled(switchValue);
        setRefreshState();
        try {
            await (switchValue ? disableIpv6() : enableIpv6());
        }
        catch (e) {
            console.error("TunnelDeck - toggleIpv6 failed", e);
        }
        collectNetworkInfo();
    };
    const toggleOpenVPN = async (switchValue) => {
        setOpenVPNEnabled(switchValue);
        setRefreshState();
        try {
            await (switchValue ? enableOpenvpn() : disableOpenvpn());
        }
        catch (e) {
            console.error("TunnelDeck - toggleOpenVPN failed", e);
        }
        collectNetworkInfo();
    };
    SP_REACT.useEffect(() => {
        loadConnections();
        return () => {
            clearTimeout(interfaceCheckerId);
        };
    }, []);
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Connections", children: [loaded && connections.length == 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: "No Connections Found" })), connections.length > 0 &&
                        connections.map((connection) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { bottomSeparator: "standard", checked: connection.connected, label: connection.name, description: `Type: ${connection.type}`, onChange: (switchValue) => {
                                    toggleConnection(connection, switchValue);
                                } }) }))), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { onClick: () => {
                                DFL.Navigation.NavigateToExternalWeb("https://github.com/DaAndi01/TunnelDeck#readme");
                                DFL.Navigation.CloseSideMenus();
                            }, children: "How Do I Add Connections?" }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Network Info", spinner: isRefreshing, children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Prioritized Network Interface", description: priorityInterface, focusable: true }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Prioritized Interface LAN IP", description: priorityInterfaceLanIp, focusable: true }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Can reach gateway", description: canReachGateway, focusable: true }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Can reach steampowered.com", description: canReachSteam, focusable: true }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Settings", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { bottomSeparator: "standard", checked: openVPNEnabled || openVPNDisabled, label: "Enable OpenVPN", disabled: !loaded || openVPNDisabled, description: "Installs OpenVPN support for Network Manager. WireGuard needs no install.", onChange: toggleOpenVPN }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { bottomSeparator: "standard", checked: ipv6Disabled, label: "Disable IPV6", disabled: !activeConn || !loaded, description: "Disables IPV6 support for the current connection. Required for some VPNs.", onChange: toggleIpv6 }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Additional network info", spinner: isRefreshing, children: [loaded && priorityNetworkInfo.length == 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: "No Network Info found" })), priorityNetworkInfo.length > 0 &&
                        priorityNetworkInfo.map((infoItem) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { description: infoItem, focusable: true, padding: "none" }) })))] })] }));
}
var index = definePlugin(() => {
    return {
        name: "TunnelDeck",
        titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "TunnelDeck" }),
        content: SP_JSX.jsx(Content, {}),
        icon: SP_JSX.jsx(FaShieldAlt, {}),
        onDismount() {
            clearTimeout(interfaceCheckerId);
        },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
