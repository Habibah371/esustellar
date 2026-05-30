/**
 * Transactions API Service
 * Handles REST API calls for transaction-related operations
 */

import { ApiResponse } from './groupsApi';
import { logger } from '../logger';

export interface Transaction {
  id: string;
  groupId: string;
  userAddress: string;
  amount: number;
  type: 'contribution' | 'payout';
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  txHash: string;
}

class TransactionsApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.esustellar.com/v1';
  }

  /**
   * Get all transactions for a user (paginated)
   */
  async getUserTransactions(
    userAddress: string,
    cursor?: string,
    limit: number = 20
  ): Promise<ApiResponse<Transaction[]>> {
    try {
      logger.debug('TransactionsApi', 'Fetching user transactions');

      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockTransactions: Transaction[] = [
        {
          id: 'tx_1',
          groupId: 'group_1',
          userAddress,
          amount: 100,
          type: 'contribution',
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          txHash: '0xabc123',
        },
        {
          id: 'tx_2',
          groupId: 'group_1',
          userAddress,
          amount: 600,
          type: 'payout',
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          txHash: '0xdef456',
        },
      ];

      return {
        success: true,
        data: mockTransactions,
      };
    } catch (error) {
      logger.error('TransactionsApi', 'Failed to fetch transactions', error);
      return {
        success: false,
        error: 'Failed to fetch transactions',
      };
    }
  }

  /**
   * Get paginated transactions with cursor
   */
  async getPaginatedTransactions(
    userAddress: string,
    cursor?: string,
    limit: number = 20
  ): Promise<ApiResponse<{
    transactions: Transaction[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
  }>> {
    try {
      console.log(`Fetching paginated transactions for user: ${userAddress}`);

      await new Promise(resolve => setTimeout(resolve, 800));

      const totalMockEntities = 50;
      const allMockTx: Transaction[] = Array.from({ length: totalMockEntities }, (_, i) => ({
        id: `tx_${i + 1}`,
        groupId: `group_${(i % 3) + 1}`,
        userAddress,
        amount: (i + 1) * 100,
        type: i % 2 === 0 ? 'contribution' : 'payout',
        status: 'confirmed',
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        txHash: `0xhash${i}${Date.now().toString(16)}`,
      }));

      const pageIndex = cursor ? parseInt(cursor, 10) : 0;
      const startIndex = pageIndex * limit;
      const endIndex = Math.min(startIndex + limit, allMockTx.length);
      const pageTx = allMockTx.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          transactions: pageTx,
          hasMore: endIndex < allMockTx.length,
          nextCursor: endIndex < allMockTx.length ? String(pageIndex + 1) : undefined,
          totalCount: allMockTx.length,
        },
      };
    } catch (error) {
      console.error('Failed to fetch paginated transactions:', error);
      return {
        success: false,
        error: 'Failed to fetch paginated transactions',
      };
    }
  }
}

export const transactionsApi = new TransactionsApiService();

export default TransactionsApiService;
