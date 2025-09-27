import React from 'react';

interface MetaMaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MetaMaskModal: React.FC<MetaMaskModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleInstallClick = () => {
    window.open('https://metamask.io/download/', '_blank');
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>
          ×
        </button>

        <div style={styles.iconContainer}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
            alt="MetaMask Fox"
            style={styles.icon}
          />
        </div>

        <h2 style={styles.title}>MetaMask Required</h2>

        <p style={styles.description}>
          To connect your wallet and use all features of Ensolv, you need to have MetaMask installed in your browser.
        </p>

        <div style={styles.features}>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🔒</span>
            <span>Secure wallet management</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🌐</span>
            <span>Multi-chain support</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>⚡</span>
            <span>Fast transactions</span>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.installButton} onClick={handleInstallClick}>
            Install MetaMask
          </button>
          <button style={styles.cancelButton} onClick={onClose}>
            Maybe Later
          </button>
        </div>

        <p style={styles.note}>
          After installing MetaMask, refresh this page to connect your wallet.
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '480px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
    animation: 'slideUp 0.3s ease-out',
  },
  closeButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0, 0, 0, 0.05)',
    color: '#6b7280',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  icon: {
    width: '80px',
    height: '80px',
    filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1b23',
    marginBottom: '12px',
    marginTop: 0,
  },
  description: {
    fontSize: '15px',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: '24px',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '32px',
    padding: '20px',
    background: 'rgba(130, 71, 229, 0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(130, 71, 229, 0.1)',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#4b5563',
  },
  featureIcon: {
    fontSize: '18px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  installButton: {
    flex: 1,
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #8247e5 0%, #6b34d1 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(130, 71, 229, 0.25)',
    transition: 'all 0.3s ease',
  },
  cancelButton: {
    flex: 1,
    padding: '14px 24px',
    background: 'rgba(0, 0, 0, 0.05)',
    color: '#6b7280',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  note: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
    margin: 0,
  },
};

export default MetaMaskModal;
