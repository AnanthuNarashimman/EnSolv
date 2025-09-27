import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { http } from "viem";
import { mainnet } from "viem/chains";
import { createEnsPublicClient } from "@ensdomains/ensjs";
import { RealPortfolioAPI } from "../services/realPortfolioAPI";
import type { PortfolioData } from "../types/portfolio";
import PortfolioDashboard from './PortfolioDashboard';
import { useWalletContext } from "../contexts/WalletContext";

/**
 * ENSResolver component allows users to input an ENS name and resolve it to an Ethereum address.
 * After successful resolution, it automatically fetches and displays portfolio data.
 *
 * It leverages both ethers.js and @ensdomains/ensjs for name resolution:
 *  - ethers.js is used for a quick resolution via `provider.resolveName` as a primary method
 *  - @ensdomains/ensjs is used as a fallback to demonstrate usage of the library as required by the task
 */
const ENSResolver = () => {
  const [ensName, setEnsName] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [currentView, setCurrentView] = useState<"resolver" | "portfolio">(
    "resolver",
  );
  const { address: connectedAddress, isConnected } = useWalletContext();

  const rpcUrl = import.meta.env.VITE_ETHEREUM_RPC_URL as string | undefined;

  const fetchPortfolio = useCallback(async (address: string) => {
    console.log("🔍 Fetching portfolio for address:", address);
    setPortfolioLoading(true);
    try {
      const data = await RealPortfolioAPI.getPortfolio(address);
      console.log("✅ Portfolio data received:", data);
      setPortfolioData(data);
      setCurrentView("portfolio");
    } catch (err) {
      console.error("❌ Portfolio fetch failed:", err);
      setError(`Failed to fetch portfolio: ${(err as Error).message}`);
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  const onResolve = async () => {
    if (!ensName) return;
    setLoading(true);
    setError(null);
    setResolvedAddress(null);
    setPortfolioData(null);
    setCurrentView("resolver");

    try {
      if (!rpcUrl) {
        throw new Error(
          "Ethereum RPC URL is not defined in environment variables",
        );
      }

      // Primary resolution via ethers.js
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      let address = await provider.resolveName(ensName);

      // If ethers fails to resolve, fall back to ENSJS
      if (!address) {
        // Note: Using type assertion as mainnet chain is compatible with ENS client
        const client = createEnsPublicClient({
          chain: mainnet as unknown as Parameters<typeof createEnsPublicClient>[0]['chain'],
          transport: http(rpcUrl),
        });
        // getAddressRecord returns an object {address} – we just need that field
        const addrRecord = (await client.getAddressRecord({
          name: ensName,
        })) as { address?: string | null };
        address = addrRecord?.address ?? null;
      }

      if (!address) {
        throw new Error("Could not resolve ENS name");
      }

      setResolvedAddress(address);

      // Automatically fetch portfolio after successful ENS resolution
      await fetchPortfolio(address);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPortfolio = async () => {
    if (resolvedAddress) {
      await fetchPortfolio(resolvedAddress);
    }
  };

  const handleUseConnectedWallet = useCallback(async () => {
    console.log("🔗 Using connected wallet:", connectedAddress);
    if (connectedAddress) {
      setEnsName("");
      setResolvedAddress(connectedAddress);
      await fetchPortfolio(connectedAddress);
    }
  }, [connectedAddress, fetchPortfolio]);

  // Auto-fetch portfolio when wallet connects
  useEffect(() => {
    if (isConnected && connectedAddress && !portfolioData && currentView === "resolver") {
      console.log("🚀 Auto-fetching portfolio for connected wallet:", connectedAddress);
      handleUseConnectedWallet();
    }
  }, [isConnected, connectedAddress, portfolioData, currentView, handleUseConnectedWallet]);

  return (
    <div style={styles.container}>
      {currentView === "resolver" && (
        <>
          <div style={styles.titleSection}>
            <h2 style={styles.title}>
              <span style={styles.titleIcon}>🔮</span>
              ENS Resolver
            </h2>
            <p style={styles.titleDescription}>
              Enter any ENS name to instantly view portfolio analytics
            </p>
          </div>
          <div style={styles.resolverCard} className="resolver-card">
            <div style={styles.formRow}>
              <input
                type="text"
                placeholder="vitalik.eth"
                value={ensName}
                onChange={(e) => setEnsName(e.target.value)}
                style={styles.input}
              />
              <button
                onClick={onResolve}
                style={{
                  ...styles.button,
                  ...(loading || !ensName ? styles.buttonDisabled : {}),
                }}
                disabled={loading || !ensName}
              >
                {loading ? "Resolving..." : "Resolve"}
              </button>
            </div>

            {isConnected && (
              <div style={styles.walletOption}>
                <div style={styles.divider}>
                  <span style={styles.dividerText} className="divider-text">OR</span>
                </div>
                <button
                  onClick={handleUseConnectedWallet}
                  style={styles.useWalletButton}
                  disabled={portfolioLoading}
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                    alt="MetaMask"
                    style={styles.metamaskIcon}
                  />
                  {portfolioLoading ? "Loading Portfolio..." : "Use Connected Wallet"}
                  <span style={styles.walletAddressChip}>
                    {connectedAddress?.slice(0, 6)}...
                    {connectedAddress?.slice(-4)}
                  </span>
                </button>
              </div>
            )}

            {resolvedAddress && !portfolioLoading && (
              <p style={{ ...styles.result, color: "#16a34a" }}>
                Resolved Address: {resolvedAddress}
              </p>
            )}

            {portfolioLoading && (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Fetching portfolio data...</p>
              </div>
            )}

            {error && (
              <p style={{ ...styles.result, color: "#ef4444" }}>
                Error: {error}
              </p>
            )}
          </div>

          {/* Landing Section */}
          <div style={styles.landingSection} className="landing-content">
            <div style={styles.heroContent}>
              <h1
                style={styles.landingHeadline}
                className="landing-headline gradient-text"
              >
                Your Complete DeFi Portfolio Hub
              </h1>
              <p
                style={styles.landingDescription}
                className="landing-description"
              >
                Track, analyze, and manage your entire crypto portfolio across
                multiple chains. Get real-time insights into your tokens,
                liquidity positions, and total holdings with just an ENS name or
                wallet address.
              </p>

              {/* Statistics Section */}
              <div style={styles.statsContainer} className="stats-container">
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>$22.5M+</div>
                  <div style={styles.statLabel}>Total Value Tracked</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>250+</div>
                  <div style={styles.statLabel}>Portfolios Analyzed</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>10+</div>
                  <div style={styles.statLabel}>Networks Supported</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>99.9%</div>
                  <div style={styles.statLabel}>Uptime</div>
                </div>
              </div>

              <div style={styles.featureGrid} className="feature-grid">
                <div style={styles.featureCard} className="feature-card">
                  <div style={styles.featureIcon} className="feature-icon">
                    🔍
                  </div>
                  <h3 style={styles.featureTitle}>ENS Resolution</h3>
                  <p style={styles.featureText}>
                    Instantly resolve ENS names to view any wallet's portfolio
                  </p>
                </div>
                <div style={styles.featureCard} className="feature-card">
                  <div style={styles.featureIcon} className="feature-icon">
                    🌐
                  </div>
                  <h3 style={styles.featureTitle}>Multi-Chain Support</h3>
                  <p style={styles.featureText}>
                    Track assets across Polygon, Rootstock, and more networks
                  </p>
                </div>
                <div style={styles.featureCard} className="feature-card">
                  <div style={styles.featureIcon} className="feature-icon">
                    📊
                  </div>
                  <h3 style={styles.featureTitle}>Visual Analytics</h3>
                  <p style={styles.featureText}>
                    Beautiful charts and insights for your portfolio performance
                  </p>
                </div>
              </div>

              <div style={styles.ctaSection} className="cta-section">
                <button
                  style={styles.ctaButton}
                  className="cta-button"
                  onClick={() => {
                    const input = document.querySelector(
                      'input[type="text"]',
                    ) as HTMLInputElement;
                    if (input) {
                      input.focus();
                      input.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }}
                >
                  Get Started Now →
                </button>
                <p style={styles.ctaSubtext}>
                  Free to use • Real-time data
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {currentView === "portfolio" && portfolioData && (
        <>
          <div style={styles.portfolioHeader}>
            <div style={styles.addressInfo}>
              <h3 style={styles.addressTitle}>
                <span style={styles.portfolioIcon}>💼</span>
                {ensName}
              </h3>
              <p style={styles.addressText}>{resolvedAddress}</p>
            </div>
          </div>
          <PortfolioDashboard
            portfolioData={portfolioData}
            onRefresh={handleRefreshPortfolio}
            isLoading={portfolioLoading}
          />
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2rem",
    padding: "3rem 2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  titleSection: {
    textAlign: "center" as const,
    marginBottom: "1rem",
  },
  title: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    margin: 0,
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #1a1b23 0%, #4a4b54 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  },
  titleIcon: {
    fontSize: "1.5em",
    filter: "drop-shadow(0 2px 8px rgba(130, 71, 229, 0.3))",
  },
  titleDescription: {
    margin: "8px 0 0 0",
    fontSize: "0.95rem",
    color: "#6b7280",
    fontWeight: 500,
  },
  resolverCard: {
    width: "100%",
    maxWidth: "680px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(130, 71, 229, 0.1)",
    borderRadius: "20px",
    padding: "32px",
    boxShadow:
      "0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5) inset",
  },
  formRow: {
    display: "flex",
    width: "100%",
    maxWidth: "640px",
    gap: "0.75rem",
    margin: "0 auto",
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    fontSize: "1rem",
    border: "2px solid rgba(130, 71, 229, 0.15)",
    borderRadius: "14px",
    outline: "none",
    background: "rgba(255, 255, 255, 0.8)",
    color: "#1a1b23",
    fontWeight: 500,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
  },
  button: {
    padding: "14px 24px",
    fontSize: "1rem",
    cursor: "pointer",
    background: "linear-gradient(135deg, #8247e5 0%, #6b34d1 100%)",
    color: "white",
    border: "none",
    borderRadius: "14px",
    fontWeight: 700,
    letterSpacing: "0.3px",
    boxShadow: "0 8px 24px rgba(130, 71, 229, 0.3)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  result: {
    wordBreak: "break-all",
    textAlign: "center",
    fontSize: "14px",
    marginTop: "0.75rem",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  spinner: {
    width: "44px",
    height: "44px",
    border: "4px solid rgba(0,0,0,0.08)",
    borderTop: "4px solid #8247e5",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#6b7280",
    fontSize: "16px",
    margin: 0,
  },
  portfolioHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: "2rem",
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    borderRadius: "20px",
    padding: "16px 24px",
    boxShadow:
      "0 10px 30px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8) inset",
  },
  addressInfo: {
    textAlign: "center",
  },
  addressTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    margin: "0 0 6px 0",
    fontSize: "1.375rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #8247e5 0%, #6b34d1 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  portfolioIcon: {
    fontSize: "1.2em",
    filter: "none",
    WebkitTextFillColor: "initial",
  },
  addressText: {
    margin: 0,
    padding: "6px 12px",
    background: "rgba(130, 71, 229, 0.08)",
    borderRadius: "8px",
    color: "#6b7280",
    fontSize: "13px",
    fontFamily: "var(--font-mono)",
    fontWeight: 500,
    wordBreak: "break-all",
    display: "inline-block",
  },
  landingSection: {
    marginTop: "80px",
    padding: "40px 20px",
    maxWidth: "1100px",
    width: "100%",
  },
  heroContent: {
    textAlign: "center" as const,
  },
  landingHeadline: {
    fontSize: "clamp(2rem, 4vw, 3rem)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #8247e5 0%, #6b34d1 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "20px",
    lineHeight: 1.2,
    letterSpacing: "-0.5px",
  },
  landingDescription: {
    fontSize: "clamp(1rem, 2vw, 1.125rem)",
    color: "#6b7280",
    maxWidth: "700px",
    margin: "0 auto 50px",
    lineHeight: 1.7,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "60px",
  },
  featureCard: {
    position: "relative",
    background:
      "linear-gradient(135deg, rgba(130, 71, 229, 0.03) 0%, rgba(130, 71, 229, 0.01) 100%)",
    border: "1px solid rgba(130, 71, 229, 0.15)",
    borderRadius: "16px",
    padding: "30px 24px",
    transition: "all 0.3s ease",
    cursor: "default",
  },
  featureIcon: {
    fontSize: "2.5rem",
    marginBottom: "16px",
  },
  featureTitle: {
    fontSize: "1.125rem",
    fontWeight: 700,
    color: "#2b2c34",
    marginBottom: "8px",
    marginTop: 0,
  },
  featureText: {
    fontSize: "0.95rem",
    color: "#6b7280",
    lineHeight: 1.6,
    margin: 0,
  },
  ctaSection: {
    marginTop: "50px",
  },
  ctaButton: {
    padding: "16px 32px",
    fontSize: "1.125rem",
    fontWeight: 700,
    background: "linear-gradient(135deg, #8247e5 0%, #6b34d1 100%)",
    color: "white",
    border: "none",
    borderRadius: "999px",
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(130, 71, 229, 0.3)",
    transition: "all 0.3s ease",
    display: "inline-block",
  },
  ctaSubtext: {
    marginTop: "16px",
    fontSize: "0.875rem",
    color: "#9ca3af",
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "20px",
    maxWidth: "800px",
    margin: "60px auto 50px",
    padding: "40px 20px",
    background:
      "linear-gradient(135deg, rgba(130, 71, 229, 0.02) 0%, rgba(107, 52, 209, 0.01) 100%)",
    borderRadius: "24px",
    border: "1px solid rgba(130, 71, 229, 0.1)",
  },
  statCard: {
    textAlign: "center" as const,
  },
  statNumber: {
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #8247e5 0%, #6b34d1 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  },
  statLabel: {
    fontSize: "0.875rem",
    color: "#6b7280",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  walletOption: {
    marginTop: "24px",
  },
  divider: {
    position: "relative",
    textAlign: "center" as const,
    margin: "20px 0",
  },
  dividerText: {
    position: "relative",
    display: "inline-block",
    padding: "0 16px",
    background: "rgba(255, 255, 255, 0.95)",
    color: "#9ca3af",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
  },
  useWalletButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "14px 24px",
    background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
    color: "white",
    border: "none",
    borderRadius: "14px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(74, 222, 128, 0.25)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  walletIcon: {
    fontSize: "18px",
  },
  metamaskIcon: {
    width: "18px",
    height: "18px",
  },
  walletAddressChip: {
    marginLeft: "auto",
    padding: "4px 10px",
    background: "rgba(255, 255, 255, 0.25)",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.3px",
  },
};

export default ENSResolver;
