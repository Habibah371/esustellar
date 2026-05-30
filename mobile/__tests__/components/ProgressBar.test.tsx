import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';

describe('ProgressBar', () => {
  it('renders with progress=0 (empty bar)', () => {
    const { getByTestId } = render(<ProgressBar progress={0} />);
    const fill = getByTestId('progress-fill');
    expect(fill.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '0%' })]),
    );
  });

  it('renders with progress=1 (full bar)', () => {
    const { getByTestId } = render(<ProgressBar progress={1} />);
    const fill = getByTestId('progress-fill');
    expect(fill.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '100%' })]),
    );
  });

  it('clamps values above 1', () => {
    const { getByTestId } = render(<ProgressBar progress={2} />);
    const fill = getByTestId('progress-fill');
    expect(fill.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '100%' })]),
    );
  });

  it('clamps values below 0', () => {
    const { getByTestId } = render(<ProgressBar progress={-1} />);
    const fill = getByTestId('progress-fill');
    expect(fill.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '0%' })]),
    );
  });

  it('renders optional label when provided', () => {
    const { getByText } = render(<ProgressBar progress={0.5} label="50% funded" />);
    expect(getByText('50% funded')).toBeTruthy();
  });

  it('renders a partial fill for values inside [0, 1]', () => {
    const { getByTestId } = render(<ProgressBar progress={0.375} />);
    const fill = getByTestId('progress-fill');
    expect(fill.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '37.5%' })]),
    );
  });

  it('does not render label when not provided', () => {
    const { queryByText } = render(<ProgressBar progress={0.5} />);
    expect(queryByText('50% funded')).toBeNull();
  });
});
