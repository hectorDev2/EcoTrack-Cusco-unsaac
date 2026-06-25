import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Spinner } from '../components/ui/Spinner';

describe('Spinner', () => {
  it('renderiza sin explotar', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeTruthy();
  });

  it('aplica tamaño sm', () => {
    const { container } = render(<Spinner size="sm" />);
    expect(container.querySelector('span')?.className).toContain('w-4');
  });

  it('aplica tamaño lg', () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.querySelector('span')?.className).toContain('w-12');
  });

  it('aplica className personalizado', () => {
    const { container } = render(<Spinner className="test-class" />);
    expect(container.querySelector('span')?.className).toContain('test-class');
  });
});
