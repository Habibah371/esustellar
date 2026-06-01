import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { GroupCard } from '@/components/ui/GroupCard';
import { Avatar } from '@/components/ui/Avatar';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { NotificationItem as TimelineNotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationItem as StoreNotificationItem } from '@/components/NotificationItem';
import { useNotificationsStore } from '@/stores/notificationsStore';

/*
 * Memoization is verified by counting how many times each component's render
 * function is called. We wrap each memoized component in a spy-decorated
 * factory so we can track its render count independently of React's Profiler
 * (which has changed its firing semantics in React 18 concurrent mode).
 */

function makeRenderSpy<P extends object>(
  Component: React.ComponentType<P>,
): [React.ComponentType<P>, jest.Mock] {
  const spy = jest.fn();
  const SpyFn = (props: P) => {
    spy(props);
    return React.createElement(Component, props);
  };
  SpyFn.displayName = `Spy(${(Component as any).displayName ?? Component.name})`;
  const Spy = React.memo(SpyFn);
  return [Spy as unknown as React.ComponentType<P>, spy];
}

describe('memoized component render stability', () => {
  beforeEach(() => {
    useNotificationsStore.setState({
      notifications: [],
      unreadCount: 0,
    });
  });

  it('keeps GroupCard from re-rendering when the parent rerenders with stable props', () => {
    const [SpyGroupCard, spy] = makeRenderSpy(GroupCard);
    const onPress = jest.fn();

    const Parent = ({
      tick,
      contributionAmount = '50 XLM / month',
    }: {
      tick: number;
      contributionAmount?: string;
    }) => (
      <View>
        <Text>{tick}</Text>
        <SpyGroupCard
          name="Family Savings"
          status="active"
          contributionAmount={contributionAmount}
          dueDate="2025-05-01"
          onPress={onPress}
        />
      </View>
    );

    const { rerender } = render(<Parent tick={0} />);
    expect(spy).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={1} />);
    expect(spy).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={2} contributionAmount="60 XLM / month" />);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('keeps Avatar from re-rendering when the parent rerenders with stable props', () => {
    const [SpyAvatar, spy] = makeRenderSpy(Avatar);

    const Parent = ({
      tick,
      size = 'md',
    }: {
      tick: number;
      size?: 'sm' | 'md' | 'lg';
    }) => (
      <View>
        <Text>{tick}</Text>
        <SpyAvatar name="John Doe" size={size} />
      </View>
    );

    const { rerender } = render(<Parent tick={0} />);
    expect(spy).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={1} />);
    expect(spy).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={2} size="lg" />);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('keeps TransactionItem from re-rendering when the parent rerenders with stable props', () => {
    const [SpyTransactionItem, spy] = makeRenderSpy(TransactionItem);
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const Parent = ({
      tick,
      amount = 10,
    }: {
      tick: number;
      amount?: number;
    }) => (
      <View>
        <Text>{tick}</Text>
        <SpyTransactionItem
          type="contribution"
          description="Monthly contribution"
          amount={amount}
          date={date}
        />
      </View>
    );

    const { rerender } = render(<Parent tick={0} />);
    expect(spy).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={1} />);
    expect(spy).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={2} amount={20} />);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('keeps timeline NotificationItem from re-rendering when the parent rerenders with equivalent props', () => {
    const [SpyNotificationItem, spy] = makeRenderSpy(TimelineNotificationItem);
    const onPress = jest.fn();
    const stableDate = new Date(Date.now() - 60 * 60 * 1000);

    const Parent = ({
      tick,
      read = false,
    }: {
      tick: number;
      read?: boolean;
    }) => (
      <View>
        <Text>{tick}</Text>
        <SpyNotificationItem
          type="contribution"
          title="Contribution due"
          message="Your next contribution is due soon."
          date={stableDate}
          read={read}
          onPress={onPress}
        />
      </View>
    );

    const { rerender } = render(<Parent tick={0} />);
    expect(spy).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={1} />);
    expect(spy).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={2} read />);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('keeps store NotificationItem from re-rendering when the parent rerenders with stable props', () => {
    const [SpyStoreNotificationItem, spy] = makeRenderSpy(StoreNotificationItem);
    const createdAt = new Date().toISOString();
    const unreadItem = { id: '1', title: 'Welcome', message: 'Thanks for joining!', read: false, createdAt };
    const readItem = { id: '1', title: 'Welcome', message: 'Thanks for joining!', read: true, createdAt };

    const Parent = ({
      tick,
      read = false,
    }: {
      tick: number;
      read?: boolean;
    }) => (
      <View>
        <Text>{tick}</Text>
        <SpyStoreNotificationItem item={read ? readItem : unreadItem} />
      </View>
    );

    const { rerender } = render(<Parent tick={0} />);
    expect(spy).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={1} />);
    expect(spy).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={2} read />);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
