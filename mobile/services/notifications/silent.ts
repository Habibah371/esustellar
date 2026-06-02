/**
 * Silent Notification Handler
 * Processes push notifications that update app data in background without showing UI
 */

import * as Notifications from 'expo-notifications';
import { queryClient, queryKeys } from '../queryClient';
import { useAuthStore } from '../../store/authStore';
import { useGroupsStore } from '../../stores/groupsStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { groupsApi } from '../api/groupsApi';
import { transactionsApi } from '../api/transactionsApi';
import { notificationsApi } from '../api/notificationsApi';
import { logger } from '../logger';

export type SilentNotificationType = 'groups' | 'transactions' | 'notifications' | 'all';

interface SilentNotificationData {
  silent?: boolean;
  syncType?: SilentNotificationType;
  groupId?: string;
  [key: string]: unknown;
}

class SilentNotificationHandler {
  private isSyncing: boolean = false;
  private syncQueue: Promise<void> = Promise.resolve();

  /**
   * Check if a notification is silent (should not show UI)
   */
  isSilent(notification: Notifications.Notification): boolean {
    const data = notification.request.content.data as unknown;
    const hasTitle = notification.request.content.title;
    const hasBody = notification.request.content.body;

    // Treat as silent if explicitly marked or has no title/body
    if (data && typeof data === 'object') {
      const silentFlag = (data as Record<string, unknown>).silent;
      if (silentFlag === true || silentFlag === 'true') {
        return true;
      }
    }

    // If it has a sync type but no visible content, treat as silent
    if (!hasTitle && !hasBody && this.getSyncType(data) !== null) {
      return true;
    }

    return false;
  }

  /**
   * Extract sync type from notification data
   */
  private getSyncType(data: unknown): SilentNotificationType | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const syncType = (data as Record<string, unknown>).syncType;
    if (syncType && ['groups', 'transactions', 'notifications', 'all'].includes(String(syncType))) {
      return String(syncType) as SilentNotificationType;
    }

    return null;
  }

  /**
   * Handle silent notification - sync data in background
   */
  async handleSilentNotification(notification: Notifications.Notification): Promise<boolean> {
    const data = notification.request.content.data as unknown;

    // Enqueue sync to prevent concurrent syncs
    this.syncQueue = this.syncQueue.then(() => this.performSync(data));

    try {
      await this.syncQueue;
      return true;
    } catch (error) {
      logger.error('SilentNotification', 'Failed to handle silent notification', error);
      return false;
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(data: unknown): Promise<void> {
    if (this.isSyncing) {
      logger.debug('SilentNotification', 'Sync already in progress, waiting...');
      return;
    }

    this.isSyncing = true;

    try {
      const wallet = useAuthStore.getState().wallet;
      if (!wallet?.publicKey) {
        logger.debug('SilentNotification', 'No wallet connected, skipping sync');
        return;
      }

      const syncType = this.getSyncType(data);
      const userAddress = wallet.publicKey;

      logger.info('SilentNotification', `Processing silent notification: ${syncType || 'all'}`);

      // Sync based on type
      if (syncType === 'all' || syncType === 'groups') {
        await this.syncGroups(userAddress);
      }

      if (syncType === 'all' || syncType === 'transactions') {
        await this.syncTransactions(userAddress);
      }

      if (syncType === 'all' || syncType === 'notifications') {
        await this.syncNotifications(userAddress);
      }

      // Trigger specific group sync if groupId provided
      if (data && typeof data === 'object' && 'groupId' in data) {
        const groupId = (data as Record<string, unknown>).groupId;
        if (groupId) {
          await this.syncGroupDetail(String(groupId));
        }
      }

      logger.info('SilentNotification', 'Silent notification processed successfully');
    } catch (error) {
      logger.error('SilentNotification', 'Error processing silent notification', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync groups data
   */
  private async syncGroups(userAddress: string): Promise<void> {
    try {
      logger.debug('SilentNotification', 'Syncing groups...');
      const result = await groupsApi.getUserGroups(userAddress);

      if (result.success && result.data) {
        useGroupsStore.getState().setGroups(result.data);
        // Invalidate groups query for updates
        await queryClient.invalidateQueries({ queryKey: queryKeys.groups.user(userAddress) });
      }
    } catch (error) {
      logger.error('SilentNotification', 'Failed to sync groups', error);
      throw error;
    }
  }

  /**
   * Sync transactions data
   */
  private async syncTransactions(userAddress: string): Promise<void> {
    try {
      logger.debug('SilentNotification', 'Syncing transactions...');
      const result = await transactionsApi.getUserTransactions(userAddress);

      if (result.success && result.data) {
        // Invalidate transactions query for updates
        await queryClient.invalidateQueries({
          queryKey: queryKeys.transactions.user(userAddress),
        });
      }
    } catch (error) {
      logger.error('SilentNotification', 'Failed to sync transactions', error);
      throw error;
    }
  }

  /**
   * Sync notifications data
   */
  private async syncNotifications(userAddress: string): Promise<void> {
    try {
      logger.debug('SilentNotification', 'Syncing notifications...');
      const result = await notificationsApi.getUserNotifications(userAddress);

      if (result.success && result.data) {
        useNotificationsStore.getState().setNotifications(result.data);
        // Invalidate notifications query for updates
        await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      }
    } catch (error) {
      logger.error('SilentNotification', 'Failed to sync notifications', error);
      throw error;
    }
  }

  /**
   * Sync specific group detail
   */
  private async syncGroupDetail(groupId: string): Promise<void> {
    try {
      logger.debug('SilentNotification', `Syncing group detail for ${groupId}...`);
      // Invalidate specific group query
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
    } catch (error) {
      logger.error('SilentNotification', 'Failed to sync group detail', error);
      throw error;
    }
  }
}

export const silentNotificationHandler = new SilentNotificationHandler();
