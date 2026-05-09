import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import { Link } from 'react-router-dom';
export class ErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(err) {
        console.error('UI error:', err);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("main", { className: "mx-auto max-w-xl px-6 py-24", children: [_jsx("h1", { className: "font-display text-2xl mb-2", children: "Something went wrong" }), _jsx("p", { className: "text-secondary mb-4", children: "An unexpected error occurred. Try refreshing." }), _jsx(Link, { to: "/dashboard", className: "text-accent underline", children: "Back to dashboard" })] }));
        }
        return this.props.children;
    }
}
