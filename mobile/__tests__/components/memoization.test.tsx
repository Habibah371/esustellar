import React, { Profiler } from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { GroupCard } from '@/components/ui/GroupCard';
import { Avatar } from '@/components/ui/Avatar';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { NotificationItem as TimelineNotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationItem as StoreNotificationItem } from '@/components/NotificationItem';
import { useNotificationsStore } from '@/stores/notificationsStore';

describe('memoized component render stability', () => {
  beforeEach(() => {
    useNotificationsStore.setState({
      notifications: [],
      unreadCount: 0,
    });
  });

  it('keeps GroupCard at one commit when the parent rerenders with stable props', () => {
    // Before memoization this stable-props parent rerender committed twice; after memoization it stays at one.
    const onRender = jest.fn();
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
        <Profiler id="group-card" onRender={onRender}>
          <GroupCard
            name="Family Savings"
            status="active"
            contributionAmount={contributionAmount}
            dueDate="2025-05-01"
            onPress={onPress}
          />
        </Profiler>
      </View>
    );

    const { rerender } = render(<Parent tick={0} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={1} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={2} contributionAmount="60 XLM / month" />);
    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it('keeps Avatar at one commit when the parent rerenders with stable props', () => {
    // Before memoization this stable-props parent rerender committed twice; after memoization it stays at one.
    const onRender = jest.fn();

    const Parent = ({
      tick,
      size = 'md',
    }: {
      tick: number;
      size?: 'sm' | 'md' | 'lg';
    }) => (
      <View>
        <Text>{tick}</Text>
        <Profiler id="avatar" onRender={onRender}>
          <Avatar name="John Doe" size={size} />
        </Profiler>
      </View>
    );

    const { rerender } = render(<Parent tick={0} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={1} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={2} size="lg" />);
    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it('keeps TransactionItem at one commit when the parent rerenders with stable props', () => {
    // Before memoization this stable-props parent rerender committed twice; after memoization it stays at one.
    const onRender = jest.fn();
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
        <Profiler id="transaction-item" onRender={onRender}>
          <TransactionItem
            type="contribution"
            description="Monthly contribution"
            amount={amount}
            date={date}
          />
        </Profiler>
      </View>
    );

    const { rerender } = render(<Parent tick={0} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={1} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={2} amount={20} />);
    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it('keeps timeline NotificationItem at one commit when the parent rerenders with equivalent props', () => {
    // Before memoization this stable-props parent rerender committed twice; after memoization it stays at one.
    const onRender = jest.fn();
    const onPress = jest.fn();
    const timestamp = new Date(Date.now() - 60 * 60 * 1000);

    const Parent = ({
      tick,
      read = false,
    }: {
      tick: number;
      read?: boolean;
    }) => (
      <View>
        <Text>{tick}</Text>
        <Profiler id="timeline-notification-item" onRender={onRender}>
          <TimelineNotificationItem
            type="contribution"
            title="Contribution due"
            message="Your next contribution is due soon."
            date={new Date(timestamp.getTime())}
            read={read}
            onPress={onPress}
          />
        </Profiler>
      </View>
    );

    const { rerender } = render(<Parent tick={0} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={1} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={2} read />);
    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it('keeps store NotificationItem at one commit when the parent rerenders with stable props', () => {
    // Before memoization this stable-props parent rerender committed twice; after memoization it stays at one.
    const onRender = jest.fn();
    const item = {
      id: '1',
      title: 'Welcome',
      message: 'Thanks for joining!',
      read: false,
      createdAt: new Date().toISOString(),
    };

    const Parent = ({
      tick,
      read = false,
    }: {
      tick: number;
      read?: boolean;
    }) => (
      <View>
        <Text>{tick}</Text>
        <Profiler id="store-notification-item" onRender={onRender}>
          <StoreNotificationItem item={{ ...item, read }} />
        </Profiler>
      </View>
    );

    const { rerender } = render(<Parent tick={0} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={1} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    rerender(<Parent tick={2} read />);
    expect(onRender).toHaveBeenCalledTimes(2);
  });
});
