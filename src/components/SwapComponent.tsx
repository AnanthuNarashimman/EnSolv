import React from "react";

/**
 * Placeholder Swap component for future implementation
 * This will be enhanced in future phases with token swapping functionality
 */
const SwapComponent: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card} className="swap-card">
        <div style={styles.badgeContainer}>
          <div style={styles.badge}>
            <span style={styles.badgeDot}></span>
            IN DEVELOPMENT
          </div>
        </div>

        <div style={styles.iconContainer}>
          <div style={styles.iconGlow}></div>
          <div style={styles.icon}>🔄</div>
        </div>

        <h2 style={styles.title}>
          <span style={styles.titleMain}>Token Swap</span>
          <span style={styles.titleGradient}>Coming Soon</span>
        </h2>

        <p style={styles.subtitle}>
          Experience lightning-fast cross-chain swaps with best-in-class rates
          and seamless portfolio integration.
        </p>

        <div style={styles.comingSoon}>
          <div style={styles.featureGrid}>
            <div style={styles.feature} className="feature-item">
              <span style={styles.featureIcon}>⚡</span>
              <div>
                <h4 style={styles.featureTitle}>Lightning Fast</h4>
                <p style={styles.featureDesc}>Sub-second route discovery</p>
              </div>
            </div>
            <div style={styles.feature} className="feature-item">
              <span style={styles.featureIcon}>🌐</span>
              <div>
                <h4 style={styles.featureTitle}>Multi-Chain</h4>
                <p style={styles.featureDesc}>15+ networks supported</p>
              </div>
            </div>
            <div style={styles.feature} className="feature-item">
              <span style={styles.featureIcon}>💎</span>
              <div>
                <h4 style={styles.featureTitle}>Best Rates</h4>
                <p style={styles.featureDesc}>Aggregated from 10+ DEXs</p>
              </div>
            </div>
            <div style={styles.feature} className="feature-item">
              <span style={styles.featureIcon}>🔐</span>
              <div>
                <h4 style={styles.featureTitle}>Secure</h4>
                <p style={styles.featureDesc}>Audited smart contracts</p>
              </div>
            </div>
          </div>

          <div style={styles.notifySection}>
            <p style={styles.notifyText}>Get notified when we launch</p>
            <div style={styles.notifyForm}>
              <input
                type="email"
                placeholder="your@email.com"
                style={styles.notifyInput}
                disabled
              />
              <button style={styles.notifyButton} disabled>
                Notify Me
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "820px",
    margin: "0 auto",
    padding: "3rem 24px",
  },
  card: {
    position: "relative",
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    padding: "48px 40px",
    borderRadius: "24px",
    boxShadow:
      "0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8) inset",
    textAlign: "center",
    overflow: "hidden",
  },
  badgeContainer: {
    position: "absolute",
    top: "24px",
    right: "24px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #ff6b35 0%, #f53e4c 100%)",
    color: "white",
    fontWeight: 700,
    fontSize: "10px",
    letterSpacing: "1px",
    boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)",
  },
  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "white",
    animation: "pulse 2s infinite",
  },
  iconContainer: {
    position: "relative",
    width: "100px",
    height: "100px",
    margin: "0 auto 24px",
  },
  iconGlow: {
    position: "absolute",
    inset: "-20px",
    background:
      "radial-gradient(circle, rgba(130, 71, 229, 0.15) 0%, transparent 70%)",
    animation: "glow 3s ease-in-out infinite",
  },
  icon: {
    position: "relative",
    fontSize: "4rem",
    lineHeight: "100px",
    filter: "drop-shadow(0 4px 16px rgba(130, 71, 229, 0.3))",
  },
  title: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "16px",
    marginTop: 0,
  },
  titleMain: {
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
    fontWeight: 800,
    color: "#1a1b23",
    letterSpacing: "-0.5px",
  },
  titleGradient: {
    fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #8247e5 0%, #ff6b35 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    color: "#6b7280",
    marginTop: 0,
    marginBottom: "48px",
    fontSize: "clamp(0.95rem, 1.5vw, 1.0625rem)",
    maxWidth: "500px",
    margin: "0 auto 48px",
    lineHeight: 1.6,
  },
  comingSoon: {
    paddingTop: "32px",
    borderTop: "1px solid rgba(130, 71, 229, 0.1)",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "48px",
  },
  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "20px",
    background:
      "linear-gradient(135deg, rgba(130, 71, 229, 0.03) 0%, rgba(255, 107, 53, 0.02) 100%)",
    border: "1px solid rgba(130, 71, 229, 0.1)",
    borderRadius: "16px",
    textAlign: "left",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "default",
  },
  featureIcon: {
    fontSize: "1.5rem",
    lineHeight: 1,
  },
  featureTitle: {
    margin: "0 0 4px 0",
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#1a1b23",
  },
  featureDesc: {
    margin: 0,
    fontSize: "0.75rem",
    color: "#6b7280",
    lineHeight: 1.4,
  },
  notifySection: {
    padding: "32px",
    background: "rgba(130, 71, 229, 0.03)",
    borderRadius: "16px",
    border: "1px solid rgba(130, 71, 229, 0.1)",
  },
  notifyText: {
    margin: "0 0 16px 0",
    fontSize: "0.875rem",
    color: "#6b7280",
    fontWeight: 500,
  },
  notifyForm: {
    display: "flex",
    gap: "8px",
    maxWidth: "400px",
    margin: "0 auto",
  },
  notifyInput: {
    flex: 1,
    padding: "12px 16px",
    fontSize: "0.875rem",
    border: "1px solid rgba(130, 71, 229, 0.2)",
    borderRadius: "12px",
    outline: "none",
    background: "rgba(255, 255, 255, 0.8)",
    color: "#1a1b23",
    fontWeight: 500,
    opacity: 0.5,
    cursor: "not-allowed",
  },
  notifyButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #8247e5 0%, #6b34d1 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: 700,
    cursor: "not-allowed",
    opacity: 0.5,
  },
};

export default SwapComponent;
