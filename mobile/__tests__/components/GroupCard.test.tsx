import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GroupCard } from '@/components/ui/GroupCard';

describe('GroupCard', () => {
  const baseProps = {
    name: 'Family Savings',
    status: 'active' as const,
    contributionAmount: '50 XLM / month',
  };

  it('renders group name', () => {
    const { getByText } = render(<GroupCard {...baseProps} />);
    expect(getByText('Family Savings')).toBeTruthy();
  });

  it('renders status badge', () => {
    const { getByText, rerender } = render(<GroupCard {...baseProps} />);
    expect(getByText('active')).toBeTruthy();

    rerender(<GroupCard {...baseProps} status="pending" />);
    expect(getByText('pending')).toBeTruthy();
  });

  it('renders contribution amount', () => {
    const { getByText } = render(<GroupCard {...baseProps} />);
    expect(getByText('50 XLM / month')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<GroupCard {...baseProps} onPress={onPress} />);
    fireEvent.press(getByTestId('group-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows due date badge when dueDate is provided', () => {
    const { getByText } = render(<GroupCard {...baseProps} dueDate="2025-05-01" />);
    expect(getByText('Due: 2025-05-01')).toBeTruthy();
  });

  it('does not show due date badge when dueDate is absent', () => {
    const { queryByText } = render(<GroupCard {...baseProps} />);
    expect(queryByText(/Due:/)).toBeNull();
  });
});
