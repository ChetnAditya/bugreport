import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { StatusBadge } from '@/components/bugs/StatusBadge';
import { SeverityChip } from '@/components/bugs/SeverityChip';
import { PriorityChip } from '@/components/bugs/PriorityChip';
describe('chips', () => {
    it('StatusBadge shows label + status text (color not alone)', () => {
        render(_jsx(StatusBadge, { status: "IN_PROGRESS" }));
        expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    });
    it('SeverityChip shows label', () => {
        render(_jsx(SeverityChip, { severity: "CRITICAL" }));
        expect(screen.getByText(/critical/i)).toBeInTheDocument();
    });
    it('PriorityChip handles null', () => {
        const { container } = render(_jsx(PriorityChip, { priority: null }));
        expect(container.textContent).toMatch(/—/);
    });
    it('a11y smoke', async () => {
        const { container } = render(_jsxs("div", { children: [_jsx(StatusBadge, { status: "NEW" }), _jsx(SeverityChip, { severity: "HIGH" }), _jsx(PriorityChip, { priority: "P2" })] }));
        expect(await axe(container)).toHaveNoViolations();
    });
});
