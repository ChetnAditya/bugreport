import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { StatusBadge } from '@/components/bugs/StatusBadge';
import { SeverityChip } from '@/components/bugs/SeverityChip';
import { PriorityChip } from '@/components/bugs/PriorityChip';

describe('chips', () => {
  it('StatusBadge shows label + status text (color not alone)', () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });

  it('SeverityChip shows label', () => {
    render(<SeverityChip severity="CRITICAL" />);
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });

  it('PriorityChip handles null', () => {
    const { container } = render(<PriorityChip priority={null} />);
    expect(container.textContent).toMatch(/—/);
  });

  it('a11y smoke', async () => {
    const { container } = render(
      <div>
        <StatusBadge status="NEW" />
        <SeverityChip severity="HIGH" />
        <PriorityChip priority="P2" />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
