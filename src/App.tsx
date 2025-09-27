import { useState, useEffect, useRef } from "react";
import "./App.css";
import ENSResolver from "./components/ENSResolver";
import SwapComponent from "./components/SwapComponent";
import MetaMaskModal from "./components/MetaMaskModal";
import APIStatus from "./components/APIStatus";
import { ToastProvider } from "./providers/ToastProvider";
import { useWalletContext } from "./contexts/WalletContext";

type View = "portfolio" | "swap";

function App() {
  const [currentView, setCurrentView] = useState<View>("portfolio");
  const [showMetaMaskModal, setShowMetaMaskModal] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const {
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    shortAddress,
    address,
    error,
  } = useWalletContext();

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      setShowMetaMaskModal(true);
    } else {
      await connectWallet();
    }
  };

  // Handle click outside to close dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowWalletMenu(false);
      }
    };

    if (showWalletMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showWalletMenu]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address || "");
    setShowCopyToast(true);
    setShowWalletMenu(false);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  return (
    <ToastProvider>
      <div className="app">
      <nav style={styles.nav}>
        <div style={styles.navGlass}></div>
        <div style={styles.navInner}>
          <div style={styles.logoGroup}>
            <div style={styles.logoIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect
                  width="32"
                  height="32"
                  rx="8"
                  fill="url(#logo-gradient)"
                />
                <path
                  d="M16 8L22 12L22 20L16 24L10 20L10 12L16 8Z"
                  fill="white"
                  opacity="0.9"
                />
                <defs>
                  <linearGradient
                    id="logo-gradient"
                    x1="0"
                    y1="0"
                    x2="32"
                    y2="32"
                  >
                    <stop offset="0%" stopColor="#8247e5" />
                    <stop offset="100%" stopColor="#5928b2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 style={styles.logo}>
              <span style={styles.logoText}>Ensolv</span>
              <span style={styles.logoBeta}>BETA</span>
            </h1>
          </div>

          <div style={styles.navCenter}>
            <div style={styles.navLinks}>
              <button
                onClick={() => setCurrentView("portfolio")}
                style={{
                  ...styles.navLink,
                  ...(currentView === "portfolio" ? styles.navLinkActive : {}),
                }}
              >
                <span style={styles.navLinkIcon}>📊</span>
                <span>Portfolio</span>
                {currentView === "portfolio" && (
                  <div style={styles.navIndicator}></div>
                )}
              </button>
              <button
                onClick={() => setCurrentView("swap")}
                style={{
                  ...styles.navLink,
                  ...(currentView === "swap" ? styles.navLinkActive : {}),
                }}
              >
                <span style={styles.navLinkIcon}>🔄</span>
                <span>Swap</span>
                {currentView === "swap" && (
                  <div style={styles.navIndicator}></div>
                )}
              </button>
            </div>
          </div>

          <div style={styles.navActions}>
            {!isConnected ? (
              <button
                style={styles.connectWallet}
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <span style={styles.loadingDot}></span>
                    Connecting...
                  </>
                ) : (
                  <>
                    <span style={styles.walletDot}></span>
                    Connect Wallet
                  </>
                )}
              </button>
            ) : (
              <div style={styles.walletInfo}>
                <div style={styles.walletDropdown} ref={dropdownRef}>
                  <button
                    style={styles.walletAddress}
                    onClick={() => setShowWalletMenu(!showWalletMenu)}
                    title="Click for options"
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                      alt="MetaMask"
                      style={styles.metamaskLogo}
                    />
                    {shortAddress}
                    <span style={styles.dropdownArrow}>▼</span>
                  </button>
                  {showWalletMenu && (
                    <div style={styles.dropdownMenu}>
                      <button
                        style={styles.dropdownItem}
                        onClick={handleCopyAddress}
                      >
                        <span style={styles.dropdownIcon}>📋</span>
                        Copy Address
                      </button>
                      <div style={styles.dropdownDivider}></div>
                      <button
                        style={styles.dropdownItemDanger}
                        onClick={() => {
                          disconnectWallet();
                          setShowWalletMenu(false);
                        }}
                      >
                        <span style={styles.dropdownIcon}>🚪</span>
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {error && <div style={styles.errorToast}>{error}</div>}
          </div>
        </div>
      </nav>

      <header style={styles.hero}>
        <div style={styles.heroBackground}>
          <div style={styles.heroGrid}></div>
          <div style={styles.heroGlow}></div>
        </div>
        <div style={styles.heroInner}>
          <div style={styles.heroBadge}>
            {currentView === "portfolio"
              ? "📊 PORTFOLIO TRACKER"
              : "🔄 TOKEN SWAP"}
          </div>
          <h2 style={styles.heroTitle}>
            {currentView === "portfolio" ? (
              <>
                Track Your{" "}
                <span style={styles.heroGradient}>DeFi Portfolio</span>
              </>
            ) : (
              <>
                Swap Tokens <span style={styles.heroGradient}>Instantly</span>
              </>
            )}
          </h2>
          <p style={styles.heroSubtitle}>
            {currentView === "portfolio"
              ? "Resolve ENS names and explore comprehensive cross-chain analytics"
              : "Experience seamless token swaps with the best rates across networks"}
          </p>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.container}>
          {currentView === "portfolio" && <ENSResolver />}
          {currentView === "swap" && <SwapComponent />}
        </div>
      </main>

      <MetaMaskModal
        isOpen={showMetaMaskModal}
        onClose={() => setShowMetaMaskModal(false)}
      />

      {showCopyToast && (
        <div style={styles.copyToast}>✓ Address copied to clipboard</div>
      )}

      {/* API Status in development mode */}
      {import.meta.env.DEV && <APIStatus />}
    </div>
    </ToastProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    height: "72px",
  },
  navGlass: {
    position: "absolute",
    inset: 0,
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
  },
  navInner: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
    padding: "0 2rem",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  logoGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "float 4s ease-in-out infinite",
  },
  logo: {
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoText: {
    fontSize: "1.375rem",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    background: "linear-gradient(135deg, #8247e5 0%, #5928b2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  logoBeta: {
    fontSize: "10px",
    fontWeight: 700,
    padding: "2px 6px",
    background: "linear-gradient(135deg, #ff6b35 0%, #f53e4c 100%)",
    color: "white",
    borderRadius: "4px",
    letterSpacing: "0.5px",
  },
  navCenter: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
  },
  navLinks: {
    display: "flex",
    gap: "8px",
    background: "rgba(0, 0, 0, 0.04)",
    padding: "4px",
    borderRadius: "12px",
  },
  navLink: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    background: "transparent",
    color: "#6b7280",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  navLinkActive: {
    background: "white",
    color: "#8247e5",
    boxShadow: "0 4px 12px rgba(130, 71, 229, 0.15)",
  },
  navLinkIcon: {
    fontSize: "16px",
  },
  navIndicator: {
    position: "absolute",
    bottom: "-2px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "24px",
    height: "3px",
    background: "linear-gradient(90deg, #8247e5 0%, #5928b2 100%)",
    borderRadius: "3px",
    animation: "slideIn 0.3s ease",
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  connectWallet: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    background: "linear-gradient(135deg, #8247e5 0%, #6b34d1 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(130, 71, 229, 0.25)",
    transition: "all 0.3s ease",
  },
  walletDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#6b7280",
    boxShadow: "0 0 0 2px rgba(107, 114, 128, 0.3)",
  },
  loadingDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#8247e5",
    animation: "pulse 1s infinite",
  },
  connectedDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 0 2px rgba(74, 222, 128, 0.3)",
    animation: "pulse 2s infinite",
  },
  walletInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  walletDropdown: {
    position: "relative",
  },
  walletAddress: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    background: "rgba(255, 255, 255, 0.95)",
    color: "#1a1b23",
    border: "1px solid rgba(130, 71, 229, 0.2)",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    transition: "all 0.3s ease",
  },
  metamaskLogo: {
    width: "20px",
    height: "20px",
  },
  dropdownArrow: {
    marginLeft: "4px",
    fontSize: "10px",
    opacity: 0.6,
    transition: "transform 0.3s ease",
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    minWidth: "180px",
    background: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(0, 0, 0, 0.08)",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
    padding: "8px",
    zIndex: 1001,
    animation: "slideDown 0.2s ease-out",
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "10px 12px",
    background: "transparent",
    color: "#1a1b23",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.2s ease",
  },
  dropdownItemDanger: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "10px 12px",
    background: "transparent",
    color: "#ef4444",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.2s ease",
  },
  dropdownIcon: {
    fontSize: "16px",
  },
  dropdownDivider: {
    height: "1px",
    background: "rgba(0, 0, 0, 0.08)",
    margin: "4px 0",
  },
  errorToast: {
    position: "absolute",
    top: "80px",
    right: "20px",
    padding: "12px 20px",
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "white",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 500,
    boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
    animation: "slideIn 0.3s ease",
    zIndex: 1001,
  },
  copyToast: {
    position: "fixed" as const,
    top: "100px",
    right: "20px",
    padding: "12px 20px",
    background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
    color: "white",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 600,
    boxShadow: "0 4px 16px rgba(74, 222, 128, 0.3)",
    animation: "slideInOut 2s ease-out",
    zIndex: 10001,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)",
  },
  heroBackground: {
    position: "absolute",
    inset: 0,
    opacity: 0.4,
  },
  heroGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `linear-gradient(rgba(130, 71, 229, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(130, 71, 229, 0.1) 1px, transparent 1px)`,
    backgroundSize: "50px 50px",
    animation: "gridMove 20s linear infinite",
  },
  heroGlow: {
    position: "absolute",
    top: "-50%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "800px",
    height: "800px",
    background:
      "radial-gradient(circle, rgba(130, 71, 229, 0.15) 0%, transparent 70%)",
    animation: "glow 8s ease-in-out infinite",
  },
  heroInner: {
    position: "relative",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "3rem 2rem",
    textAlign: "center",
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 12px",
    background: "rgba(130, 71, 229, 0.1)",
    border: "1px solid rgba(130, 71, 229, 0.2)",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1px",
    color: "#8247e5",
    marginBottom: "16px",
  },
  heroTitle: {
    margin: "0 0 12px 0",
    fontSize: "clamp(2rem, 4vw, 2.75rem)",
    fontWeight: 800,
    color: "#1a1b23",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  heroGradient: {
    background: "linear-gradient(135deg, #8247e5 0%, #ff6b35 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSubtitle: {
    margin: 0,
    color: "#6b7280",
    fontSize: "clamp(0.95rem, 2vw, 1.125rem)",
    lineHeight: 1.6,
    maxWidth: "600px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  main: {
    minHeight: "calc(100vh - 120px)",
    padding: "2rem 0",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 1rem",
  },
};

export default App;
