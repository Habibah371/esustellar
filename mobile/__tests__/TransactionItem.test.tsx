import React from 'react';
import { render } from '@testing-library/react-native';
import { TransactionItem } from '@/components/transactions/TransactionItem';

const BASE = {
  description: 'Monthly contribution',
  amount: 10,
  date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

describe('TransactionItem', () => {
  it('renders contribution with red icon', () => {
    const { getByText } = render(<TransactionItem {...BASE} type="contribution" />);
    expect(getByText('↑')).toBeTruthy();
    expect(getByText('Monthly contribution')).toBeTruthy();
    expect(getByText('10 XLM')).toBeTruthy();
  });

  it('renders payout with green icon', () => {
    const { getByText } = render(<TransactionItem {...BASE} type="payout" />);
    expect(getByText('↓')).toBeTruthy();
  });

  it('renders fee with minus icon', () => {
    const { getByText } = render(<TransactionItem {...BASE} type="fee" />);
    expect(getByText('−')).toBeTruthy();
  });

  it('shows relative date', () => {
    const { getByText } = render(<TransactionItem {...BASE} type="contribution" />);
    expect(getByText('2d ago')).toBeTruthy();
  });
});
