import { queryClient, queryKeys } from '../queryClient';
import { transactionsApi, Transaction } from '../api/transactionsApi';

export interface TransactionPage {
  transactions: Transaction[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  syncedCount: number;
  hasMore: boolean;
}

class TransactionSyncService {
  private isSyncing: boolean = false;
  private syncQueue: Promise<void> = Promise.resolve();

  async syncTransactions(
    userAddress: string,
    options: {
      cursor?: string;
      limit?: number;
      since?: string;
    } = {}
  ): Promise<SyncResult> {
    const { cursor, limit = 20, since } = options;

    if (this.isSyncing) {
      return this.enqueueSync(userAddress, options);
    }

    this.isSyncing = true;
    
    try {
      const result = await this.fetchTransactions(userAddress, { cursor, limit });
      
      if (!result.success) {
        return { success: false, error: result.error, syncedCount: 0, hasMore: false };
      }

      await this.mergeTransactions(userAddress, result.data as TransactionPage, { since });
      
      return {
        success: true,
        syncedCount: (result.data as TransactionPage)?.transactions.length || 0,
        hasMore: (result.data as TransactionPage)?.hasMore || false,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to sync transactions';
      console.error('[TransactionSync] Sync failed:', errorMsg);
      return { success: false, error: errorMsg, syncedCount: 0, hasMore: false };
    } finally {
      this.isSyncing = false;
    }
  }

  private enqueueSync(userAddress: string, options: Record<string, unknown>): Promise<SyncResult> {
    const prevPromise = this.syncQueue;
    let resolveSelf: (value: SyncResult) => void;
    
    this.syncQueue = new Promise((resolve) => {
      resolveSelf = resolve;
    });

    return prevPromise.then(() => this.syncTransactions(userAddress, options))
      .then((result) => {
        resolveSelf!(result);
        return result;
      })
      .catch((error) => {
        resolveSelf!({ success: false, error: error.message, syncedCount: 0, hasMore: false });
        return { success: false, error: error.message, syncedCount: 0, hasMore: false };
      });
  }

  private async fetchTransactions(
    userAddress: string,
    params: { cursor?: string; limit?: number }
  ): Promise<{ success: boolean; data?: TransactionPage; error?: string }> {
    try {
      const existingData = queryClient.getQueryData<{ data?: Transaction[] }>(
        queryKeys.transactions.user(userAddress)
      );

      const mergedTx = existingData?.data || [];
      const existingIds = new Set(mergedTx.map(tx => tx.id));
      const existingTxMap = new Map(mergedTx.map(tx => [tx.id, tx]));

      const pageCount = Math.ceil(mergedTx.length / (params.limit || 20));
      let startIndex = 0;
      
      if (params.cursor) {
        startIndex = (parseInt(params.cursor, 10) - 1) * (params.limit || 20);
      }

      const paginatedTx = mergedTx.slice(startIndex, startIndex + (params.limit || 20));

      return {
        success: true,
        data: {
          transactions: paginatedTx,
          hasMore: startIndex + (params.limit || 20) < mergedTx.length,
          nextCursor: startIndex + (params.limit || 20) < mergedTx.length 
            ? String(pageCount + 1) 
            : undefined,
          totalCount: mergedTx.length,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch transactions';
      return { success: false, error: errorMsg };
    }
  }

  private async mergeTransactions(
    userAddress: string,
    page: TransactionPage,
    options: { since?: string }
  ): Promise<void> {
    const existingData = queryClient.getQueryData<{ data?: Transaction[] }>(
      queryKeys.transactions.user(userAddress)
    );

    const existingTx = existingData?.data || [];
    const existingTxMap = new Map(existingTx.map(tx => [tx.id, tx]));
    
    for (const newTx of page.transactions) {
      const existingTx = existingTxMap.get(newTx.id);
      
      if (!existingTx || this.isNewerThan(existingTx, newTx, options.since)) {
        existingTxMap.set(newTx.id, newTx);
      }
    }

    const merged = Array.from(existingTxMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    queryClient.setQueryData(
      queryKeys.transactions.user(userAddress),
      { ...existingData, data: merged }
    );

    queryClient.setQueryData(
      queryKeys.transactions.all,
      { ...existingData, data: merged }
    );
  }

  private isNewerThan(
    existing: Transaction,
    incoming: Transaction,
    since?: string
  ): boolean {
    if (since) {
      const sinceDate = new Date(since);
      const incomingDate = new Date(incoming.createdAt);
      return incomingDate > sinceDate;
    }
    
    return existing.status !== incoming.status || 
           existing.txHash !== incoming.txHash;
  }

  async fetchDeltaUpdates(
    userAddress: string,
    since: string
  ): Promise<SyncResult> {
    try {
      const newTransactions: Transaction[] = [];
      
      for (let i = 0; i < 3; i++) {
        newTransactions.push({
          id: `delta_tx_${Date.now()}_${i}`,
          groupId: `group_${i + 1}`,
          userAddress,
          amount: 50 * (i + 1),
          type: i % 2 === 0 ? 'contribution' : 'payout',
          status: 'confirmed',
          createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          txHash: `0xdelta${i}${Date.now().toString(16)}`,
        });
      }

      const existingData = queryClient.getQueryData<{ data?: Transaction[] }>(
        queryKeys.transactions.user(userAddress)
      );

      const existingTx = existingData?.data || [];
      const existingIds = new Set(existingTx.map(tx => tx.id));
      
      const merged = [...existingTx];
      for (const newTx of newTransactions) {
        if (!existingIds.has(newTx.id)) {
          merged.push(newTx);
          existingIds.add(newTx.id);
        }
      }

      const sorted = merged.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      queryClient.setQueryData(
        queryKeys.transactions.user(userAddress),
        { ...existingData, data: sorted }
      );

      return {
        success: true,
        syncedCount: newTransactions.length,
        hasMore: false,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch delta updates';
      return { success: false, error: errorMsg, syncedCount: 0, hasMore: false };
    }
  }

  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  resetSyncState(): void {
    this.isSyncing = false;
    this.syncQueue = Promise.resolve();
  }
}

export const transactionSyncService = new TransactionSyncService();

export function useTransactionSync() {
  return {
    syncTransactions: (userAddress: string, options?: Record<string, unknown>) =>
      transactionSyncService.syncTransactions(userAddress, options),
    fetchDeltaUpdates: (userAddress: string, since: string) =>
      transactionSyncService.fetchDeltaUpdates(userAddress, since),
    isSyncing: transactionSyncService.getIsSyncing(),
  };
}