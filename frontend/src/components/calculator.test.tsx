import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calculator } from './calculator';

describe('Calculator', () => {
  it('renders display with initial 0', () => {
    render(<Calculator />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('updates display when number is clicked', () => {
    render(<Calculator />);
    const btn5 = screen.getAllByRole('button', { name: '5' })[0];
    fireEvent.click(btn5);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('clears display when C is clicked', () => {
    render(<Calculator />);
    const btn7 = screen.getAllByRole('button', { name: '7' })[0];
    fireEvent.click(btn7);
    fireEvent.click(screen.getByRole('button', { name: 'C' }));
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('performs addition', () => {
    render(<Calculator />);
    fireEvent.click(screen.getAllByRole('button', { name: '3' })[0]);
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    fireEvent.click(screen.getAllByRole('button', { name: '2' })[0]);
    fireEvent.click(screen.getByRole('button', { name: '=' }));
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
