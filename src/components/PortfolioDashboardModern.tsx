import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  PieChart, 
  BarChart3,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { formatCurrency, formatNumber, formatPercentage, getChangeColor, cn } from '../lib/utils';
import { ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, Tooltip } from 'recharts';
import { DashboardSkeleton } from './Loading';
import type { PortfolioData } from '../types/portfolio';

interface PortfolioDashboardProps {
  portfolioData: PortfolioData;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const COLORS = ['#8247e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06d6a0', '#ffd23f'];

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ 
  portfolioData, 
  onRefresh, 
  isLoading = false 
}) => {
  const [hideSmallBalances, setHideSmallBalances] = useState(false);

  // Memoized calculations for performance
  const { chartData, networkData, totalChange, filteredTokens } = useMemo(() => {
    const tokens = hideSmallBalances 
      ? portfolioData.tokenHoldings.filter(token => token.usdValue >= 1)
      : portfolioData.tokenHoldings;

    const topTokens = [...tokens]
      .sort((a, b) => b.usdValue - a.usdValue)
      .slice(0, 10);

    const chartData = topTokens.map((token, index) => ({
      name: token.symbol,
      value: token.usdValue,
      change: token.change24h || 0,
      fill: COLORS[index % COLORS.length],
      network: token.network,
    }));

    // Network distribution
    const networkTotals = tokens.reduce((acc, token) => {
      acc[token.network] = (acc[token.network] || 0) + token.usdValue;
      return acc;
    }, {} as Record<string, number>);

    const networkData = Object.entries(networkTotals).map(([network, value], index) => ({
      name: network.charAt(0).toUpperCase() + network.slice(1),
      value,
      fill: COLORS[index % COLORS.length],
      percentage: (value / portfolioData.summary.totalUsdValue) * 100,
    }));

    // Calculate total 24h change
    const totalChange = tokens.reduce((sum, token) => {
      const weight = token.usdValue / portfolioData.summary.totalUsdValue;
      return sum + (weight * (token.change24h || 0));
    }, 0);

    return { chartData, topTokens, networkData, totalChange, filteredTokens: tokens };
  }, [portfolioData, hideSmallBalances]);

  const performanceMetrics = useMemo(() => {
    const tokens = filteredTokens.filter(t => t.usdValue > 0.01);
    
    if (tokens.length === 0) {
      return { best: null, worst: null, average: 0 };
    }

    const best = tokens.reduce((best, token) => 
      (token.change24h || 0) > (best?.change24h || -Infinity) ? token : best
    );

    const worst = tokens.reduce((worst, token) => 
      (token.change24h || 0) < (worst?.change24h || Infinity) ? token : worst
    );

    const average = tokens.reduce((sum, token) => sum + (token.change24h || 0), 0) / tokens.length;

    return { best, worst, average };
  }, [filteredTokens]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Last updated: {new Date(portfolioData.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideSmallBalances(!hideSmallBalances)}
          >
            {hideSmallBalances ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {hideSmallBalances ? 'Show All' : 'Hide Small'}
          </Button>
          <Button onClick={onRefresh} size="sm" disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioData.summary.totalUsdValue)}</div>
            <div className={cn("text-xs flex items-center", getChangeColor(totalChange))}>
              {totalChange > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : totalChange < 0 ? (
                <TrendingDown className="w-3 h-3 mr-1" />
              ) : null}
              {formatPercentage(totalChange)} (24h)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Count</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(filteredTokens.length)}</div>
            <p className="text-xs text-muted-foreground">
              {portfolioData.summary.tokenCount - filteredTokens.length > 0 && 
                `${portfolioData.summary.tokenCount - filteredTokens.length} hidden`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{performanceMetrics.best?.symbol || 'N/A'}</div>
            <p className={cn("text-sm", performanceMetrics.best && getChangeColor(performanceMetrics.best.change24h || 0))}>
              {performanceMetrics.best ? formatPercentage(performanceMetrics.best.change24h || 0) : 'No data'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Networks</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkData.length}</div>
            <div className="text-xs text-muted-foreground space-y-1">
              {networkData.slice(0, 2).map(network => (
                <div key={network.name} className="flex justify-between">
                  <span>{network.name}</span>
                  <span>{network.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="networks">Networks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Composition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Portfolio Composition
                </CardTitle>
                <CardDescription>Distribution by token value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Value']}
                        labelFormatter={(label) => `${label}`}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {chartData.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Network Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Network Distribution
                </CardTitle>
                <CardDescription>Value distribution across networks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {networkData.map((network) => (
                    <div key={network.name} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <Badge 
                            variant="outline" 
                            className="mr-2 capitalize"
                            style={{ color: network.fill, borderColor: network.fill }}
                          >
                            {network.name}
                          </Badge>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(network.value)} ({network.percentage.toFixed(1)}%)
                        </div>
                      </div>
                      <Progress 
                        value={network.percentage} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="holdings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Holdings</CardTitle>
              <CardDescription>
                Your complete token portfolio {hideSmallBalances && '(excluding balances under $1)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">24h Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTokens.map((token, index) => (
                    <TableRow key={`${token.address}-${token.network}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            >
                              {token.symbol.slice(0, 2)}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-32">
                              {token.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {token.network}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(parseFloat(token.balance) / Math.pow(10, token.decimals))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(token.price)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(token.usdValue)}
                      </TableCell>
                      <TableCell className={cn("text-right", getChangeColor(token.change24h || 0))}>
                        <div className="flex items-center justify-end">
                          {token.change24h && token.change24h > 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : token.change24h && token.change24h < 0 ? (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          ) : null}
                          {formatPercentage(token.change24h || 0)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>24-hour performance analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Best Performer</p>
                    {performanceMetrics.best ? (
                      <div>
                        <p className="font-bold">{performanceMetrics.best.symbol}</p>
                        <p className={cn("text-sm", getChangeColor(performanceMetrics.best.change24h || 0))}>
                          {formatPercentage(performanceMetrics.best.change24h || 0)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No data</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Worst Performer</p>
                    {performanceMetrics.worst ? (
                      <div>
                        <p className="font-bold">{performanceMetrics.worst.symbol}</p>
                        <p className={cn("text-sm", getChangeColor(performanceMetrics.worst.change24h || 0))}>
                          {formatPercentage(performanceMetrics.worst.change24h || 0)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No data</p>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Portfolio Average</p>
                    <p className={cn("font-medium", getChangeColor(performanceMetrics.average))}>
                      {formatPercentage(performanceMetrics.average)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Best performing tokens by percentage change</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...filteredTokens]
                    .filter(token => token.change24h !== undefined)
                    .sort((a, b) => (b.change24h || 0) - (a.change24h || 0))
                    .slice(0, 5)
                    .map((token, index) => (
                      <div key={token.address} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium">#{index + 1}</div>
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-sm text-muted-foreground">{formatCurrency(token.usdValue)}</div>
                          </div>
                        </div>
                        <div className={cn("text-right", getChangeColor(token.change24h || 0))}>
                          <div className="font-medium">{formatPercentage(token.change24h || 0)}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="networks">
          <Card>
            <CardHeader>
              <CardTitle>Network Analysis</CardTitle>
              <CardDescription>Detailed breakdown by blockchain network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {networkData.map((network) => (
                  <Card key={network.name} className="border-l-4" style={{ borderLeftColor: network.fill }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="capitalize">{network.name}</span>
                        <Badge variant="secondary">
                          {network.percentage.toFixed(1)}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Value</span>
                          <span className="font-medium">{formatCurrency(network.value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Token Count</span>
                          <span className="font-medium">
                            {filteredTokens.filter(t => t.network === network.name.toLowerCase()).length}
                          </span>
                        </div>
                        <Progress value={network.percentage} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioDashboard;