'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit3, Trash2, RefreshCw } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import type { Holding } from '@/lib/database.types';

interface AddHoldingFormProps {
  onAdd: (symbol: string, shares: number, averageCost?: number, companyName?: string, useCurrentPrice?: boolean) => Promise<boolean>;
  loading?: boolean;
}

function AddHoldingForm({ onAdd, loading }: AddHoldingFormProps) {
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [averageCost, setAverageCost] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [useCurrentPrice, setUseCurrentPrice] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Fetch current price when symbol changes
  const fetchCurrentPrice = async (symbolValue: string) => {
    if (!symbolValue || symbolValue.length < 1) {
      setCurrentPrice(null);
      return;
    }

    setPriceLoading(true);
    try {
      const response = await fetch(`/api/ticker/${symbolValue}`);
      if (response.ok) {
        const data = await response.json();
        if (data.currentPrice) {
          setCurrentPrice(data.currentPrice);
          if (useCurrentPrice) {
            setAverageCost(data.currentPrice.toFixed(2));
          }
          if (!companyName && data.companyName) {
            setCompanyName(data.companyName);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch current price:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  // Debounced price fetch
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (symbol) {
        fetchCurrentPrice(symbol);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [symbol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol || !shares) return;
    
    const success = await onAdd(
      symbol.trim().toUpperCase(),
      parseFloat(shares),
      useCurrentPrice ? undefined : parseFloat(averageCost),
      companyName.trim() || undefined,
      useCurrentPrice
    );
    
    if (success) {
      setSymbol('');
      setShares('');
      setAverageCost('');
      setCompanyName('');
      setCurrentPrice(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Holding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-default mb-1">
                Symbol *
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL"
                  required
                  disabled={loading}
                />
                {priceLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {currentPrice && (
                <p className="text-sm text-green-600 mt-1">
                  Current Price: ${currentPrice.toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-default mb-1">
                Company Name
              </label>
              <Input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apple Inc."
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-default mb-1">
                Shares *
              </label>
              <Input
                type="number"
                step="0.000001"
                min="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="e.g. 10"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-default mb-1">
                Average Cost *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={averageCost}
                onChange={(e) => setAverageCost(e.target.value)}
                placeholder="e.g. 150.00"
                required
                disabled={loading || useCurrentPrice}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useCurrentPrice"
              checked={useCurrentPrice}
              onChange={(e) => {
                setUseCurrentPrice(e.target.checked);
                if (e.target.checked && currentPrice) {
                  setAverageCost(currentPrice.toFixed(2));
                }
              }}
              className="rounded border-gray-300"
              disabled={loading}
            />
            <label htmlFor="useCurrentPrice" className="text-sm font-medium text-text-default">
              Use current market price as average cost
            </label>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || !symbol || !shares || (!useCurrentPrice && !averageCost)}
          >
            {loading ? 'Adding...' : 'Add Holding'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface EditHoldingFormProps {
  holding: Holding;
  onUpdate: (holdingId: string, shares: number, averageCost: number) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

function EditHoldingForm({ holding, onUpdate, onCancel, loading }: EditHoldingFormProps) {
  const [shares, setShares] = useState(holding.shares.toString());
  const [averageCost, setAverageCost] = useState(holding.average_cost.toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shares || !averageCost) return;
    
    const success = await onUpdate(
      holding.id,
      parseFloat(shares),
      parseFloat(averageCost)
    );
    
    if (success) {
      onCancel();
    }
  };

  return (
    <div className="border border-border-default rounded-lg p-4 bg-background-subtle">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-text-default">
            Edit {holding.symbol}
          </h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-default mb-1">
              Shares
            </label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-default mb-1">
              Average Cost
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={averageCost}
              onChange={(e) => setAverageCost(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            type="submit" 
            size="sm"
            disabled={loading || !shares || !averageCost}
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function PortfolioManager() {
  const { 
    portfolio, 
    loading, 
    error, 
    addHolding, 
    updateHolding, 
    removeHolding,
    fetchPortfolio
  } = usePortfolio();
  
  const [editingHolding, setEditingHolding] = useState<string | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPortfolio(true); // Force refresh
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveHolding = async (holdingId: string) => {
    if (confirm('Are you sure you want to remove this holding?')) {
      await removeHolding(holdingId);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading portfolio: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portfolio</h2>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      <AddHoldingForm onAdd={addHolding} loading={loading} />
      
      {portfolio && portfolio.holdings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolio.holdings.map((holding) => (
                <div key={holding.id}>
                  {editingHolding === holding.id ? (
                    <EditHoldingForm
                      holding={holding}
                      onUpdate={updateHolding}
                      onCancel={() => setEditingHolding(null)}
                      loading={loading}
                    />
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-border-default rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium text-text-default">
                              {holding.symbol}
                            </div>
                            {holding.company_name && (
                              <div className="text-sm text-text-muted">
                                {holding.company_name}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-text-muted">
                            {holding.shares} shares @ ${holding.average_cost.toFixed(2)}
                          </div>
                          <div className="text-sm font-medium text-text-default">
                            Cost: ${(holding.shares * holding.average_cost).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingHolding(holding.id)}
                          disabled={loading}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveHolding(holding.id)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
