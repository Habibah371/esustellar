import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders label text', () => {
    const { getByText } = render(<Button>Submit</Button>);
    expect(getByText('Submit')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>Click me</Button>);
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress} disabled>Disabled</Button>);
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies primary variant styles', () => {
    const { getByText } = render(<Button variant="primary">Primary</Button>);
    const pressable = getByText('Primary').parent?.parent;
    expect(pressable?.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#6366F1', borderColor: '#6366F1' }),
    );
  });

  it('applies secondary variant styles', () => {
    const { getByText } = render(<Button variant="secondary">Secondary</Button>);
    const pressable = getByText('Secondary').parent?.parent;
    expect(pressable?.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#1E293B', borderColor: '#1E293B' }),
    );
  });

  it('applies outline variant styles', () => {
    const { getByText } = render(<Button variant="outline">Outline</Button>);
    const pressable = getByText('Outline').parent?.parent;
    expect(pressable?.props.style).toEqual(
      expect.objectContaining({ backgroundColor: 'transparent', borderColor: '#6366F1' }),
    );
  });
});
