import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/ui/Badge';

describe('Badge', () => {
  it('renderiza el texto del hijo', () => {
    render(<Badge>ORGANIC</Badge>);
    expect(screen.getByText('ORGANIC')).toBeInTheDocument();
  });

  it('aplica className personalizado', () => {
    render(<Badge className="my-class">TEST</Badge>);
    expect(screen.getByText('TEST').className).toContain('my-class');
  });

  it('renderiza con color explícito', () => {
    render(<Badge color="#ff0000">Rojo</Badge>);
    expect(screen.getByText('Rojo')).toBeInTheDocument();
  });
});
