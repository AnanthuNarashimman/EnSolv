import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { PortfolioData, TokenHolding } from "../types/portfolio";

interface PortfolioDashboardProps {
  portfolioData: PortfolioData;
  onRefresh: () => void;
  isLoading: boolean;
}

/**
 * PortfolioDashboard component displays comprehensive portfolio data
 * with charts and detailed breakdowns
 */
const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({
  portfolioData,
  onRefresh,
  isLoading,
}) => {
  const { summary, tokenHoldings, liquidityPositions } = portfolioData;

  // Prepare data for network distribution pie chart
  const networkData = [
    { name: "Polygon", value: summary.networkTotals.polygon, color: "#8247e5" },
    {
      name: "Rootstock",
      value: summary.networkTotals.rootstock,
      color: "#ff6b35",
    },
  ].filter((item) => item.value > 0);

  // Prepare data for token holdings bar chart (top 10 tokens)
  const topTokens = [...tokenHoldings]
    .sort((a, b) => b.usdValue - a.usdValue)
    .slice(0, 10)
    .map(token => ({
      ...token,
      displayName: token.network === 'ethereum' 
        ? token.symbol 
        : `${token.symbol} (${token.network.charAt(0).toUpperCase() + token.network.slice(1)})`
    }));

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: string, decimals: number): string => {
    const num = parseFloat(value) / Math.pow(10, decimals);
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  };

  return (
    <div style={styles.container} className="container">
      <div style={styles.header}>
        <h2 style={styles.title}>Portfolio Dashboard</h2>
        <button
          onClick={onRefresh}
          style={styles.refreshButton}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Portfolio Summary */}
      <div style={styles.summaryCard}>
        <h3 style={styles.sectionTitle}>Portfolio Summary</h3>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Value</span>
            <span style={styles.summaryValue}>
              {formatCurrency(summary.totalUsdValue)}
            </span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Token Count</span>
            <span style={styles.summaryValue}>{summary.tokenCount}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>LP Positions</span>
            <span style={styles.summaryValue}>
              {summary.liquidityPositionCount}
            </span>
          </div>
        </div>
      </div>

      {/* Network Distribution */}
      {networkData.length > 0 && (
        <div style={styles.chartCard}>
          <h3 style={styles.sectionTitle}>Network Distribution</h3>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={networkData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: { name?: string; percent?: number }) =>
                    `${props.name || ''}: ${((props.percent || 0) * 100).toFixed(1)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {networkData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(value as number),
                    "Value",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.networkBreakdown}>
            {Object.entries(summary.networkTotals).map(
              ([network, value]) =>
                (value && value > 0) && (
                  <div key={network} style={styles.networkItem}>
                    <span style={styles.networkName}>
                      {network.charAt(0).toUpperCase() + network.slice(1)}
                    </span>
                    <span style={styles.networkValue}>
                      {formatCurrency(value)}
                    </span>
                  </div>
                ),
            )}
          </div>
        </div>
      )}

      {/* Top Token Holdings Chart */}
      {topTokens.length > 0 && (
        <div style={styles.chartCard}>
          <h3 style={styles.sectionTitle}>Top Token Holdings</h3>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={topTokens}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayName" />
                <YAxis
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "USD Value",
                  ]}
                  labelFormatter={(label: string, payload: readonly unknown[]) => {
                    if (payload && payload[0] && typeof payload[0] === 'object' && payload[0] !== null && 'payload' in payload[0]) {
                      const data = (payload[0] as { payload: TokenHolding }).payload;
                      return `${data.symbol} on ${data.network.charAt(0).toUpperCase() + data.network.slice(1)} Network`;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar dataKey="usdValue" fill="#8247e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Token Holdings List */}
      {tokenHoldings.length > 0 && (
        <div style={styles.tableCard}>
          <h3 style={styles.sectionTitle}>Token Holdings</h3>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.tableHeaderCell}>Token</th>
                  <th style={styles.tableHeaderCell}>Network</th>
                  <th style={styles.tableHeaderCell}>Balance</th>
                  <th style={styles.tableHeaderCell}>USD Value</th>
                </tr>
              </thead>
              <tbody>
                {tokenHoldings.map((token, index) => (
                  <tr
                    key={`${token.symbol}-${token.network}-${index}`}
                    style={styles.tableRow}
                  >
                    <td style={styles.tableCell}>
                      <div style={styles.tokenCell}>
                        <span style={styles.tokenSymbol}>{token.symbol}</span>
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={styles.networkTag}>{token.network}</span>
                    </td>
                    <td style={styles.tableCell}>
                      {formatNumber(token.balance, token.decimals)}
                    </td>
                    <td style={styles.tableCell}>
                      {formatCurrency(token.usdValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Liquidity Positions */}
      {liquidityPositions.length > 0 && (
        <div style={styles.tableCard}>
          <h3 style={styles.sectionTitle}>Liquidity Positions</h3>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.tableHeaderCell}>Protocol</th>
                  <th style={styles.tableHeaderCell}>Pair</th>
                  <th style={styles.tableHeaderCell}>Network</th>
                  <th style={styles.tableHeaderCell}>USD Value</th>
                </tr>
              </thead>
              <tbody>
                {liquidityPositions.map((position, index) => (
                  <tr
                    key={`${position.protocol}-${position.pair}-${index}`}
                    style={styles.tableRow}
                  >
                    <td style={styles.tableCell}>{position.protocol}</td>
                    <td style={styles.tableCell}>{position.pair}</td>
                    <td style={styles.tableCell}>
                      <span style={styles.networkTag}>{position.network}</span>
                    </td>
                    <td style={styles.tableCell}>
                      {formatCurrency(position.usdValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          Last updated: {new Date(portfolioData.updatedAt).toLocaleString()}
        </p>
        {portfolioData.metadata && (
          <p style={styles.footerText}>
            Response time: {portfolioData.metadata.responseTime}
          </p>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  title: {
    fontSize: "1.75rem",
    color: "var(--text)",
    margin: 0,
    fontWeight: 800,
    letterSpacing: "0.2px",
  },
  refreshButton: {
    padding: "10px 20px",
    backgroundColor: "var(--brand)",
    color: "white",
    border: "1px solid var(--brand)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    boxShadow: "var(--shadow-sm)",
  },
  summaryCard: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "30px",
    boxShadow: "var(--shadow-md)",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    color: "var(--text)",
    marginBottom: "20px",
    marginTop: 0,
    fontWeight: 700,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  summaryLabel: {
    fontSize: "14px",
    color: "var(--text-muted)",
    marginBottom: "8px",
  },
  summaryValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "var(--brand)",
  },
  chartCard: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "30px",
    boxShadow: "var(--shadow-md)",
  },
  chartContainer: {
    marginBottom: "20px",
  },
  networkBreakdown: {
    display: "flex",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: "20px",
  },
  networkItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  networkName: {
    fontSize: "14px",
    color: "var(--text-muted)",
    marginBottom: "4px",
  },
  networkValue: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "var(--text)",
  },
  tableCard: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "30px",
    boxShadow: "var(--shadow-md)",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
  },
  tableHeader: {
    backgroundColor: "rgba(130,71,229,0.06)",
  },
  tableHeaderCell: {
    padding: "12px",
    textAlign: "left",
    fontWeight: "600",
    color: "var(--text)",
    borderBottom: "2px solid var(--border)",
  },
  tableRow: {
    borderBottom: "1px solid var(--border)",
  },
  tableCell: {
    padding: "12px",
    verticalAlign: "middle",
  },
  tokenCell: {
    display: "flex",
    alignItems: "center",
  },
  tokenSymbol: {
    fontWeight: "600",
    color: "var(--text)",
  },
  networkTag: {
    backgroundColor: "rgba(130,71,229,0.06)",
    color: "#4b38a7",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "capitalize",
    border: "1px solid rgba(130,71,229,0.35)",
  },
  footer: {
    textAlign: "center",
    paddingTop: "20px",
    borderTop: "1px solid var(--border)",
    color: "var(--text-muted)",
  },
  footerText: {
    margin: "5px 0",
    fontSize: "12px",
  },
};

export default PortfolioDashboard;
