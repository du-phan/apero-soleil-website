import React, { useState } from "react";
import Link from "next/link";
import Container from "./Container";

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <header className="py-4 shadow-sm bg-white">
      <Container>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">☀️</span>
            <span className="text-xl font-bold font-display">
              Terrasse au Soleil
            </span>
          </Link>
          <nav className="hidden md:flex space-x-6 items-center">
            <Link
              href="/"
              className="text-sm font-medium text-secondary-dark hover:text-primary transition"
            >
              Find a Terrace
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-secondary-dark hover:text-primary transition"
            >
              About
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <button
              className="md:hidden text-secondary-dark hover:text-primary transition p-2"
              aria-label="Menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu-panel"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu-panel"
            className="md:hidden fixed inset-0 z-50 bg-white bg-opacity-95 p-4 flex flex-col gap-4 animate-fade-in"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <button
              className="self-end p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Close menu"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <Link
              href="/"
              className="text-lg font-medium text-secondary-dark hover:text-primary transition py-2"
              onClick={() => setIsMobileMenuOpen(false)}
              role="menuitem"
            >
              Find a Terrace
            </Link>
            <Link
              href="/about"
              className="text-lg font-medium text-secondary-dark hover:text-primary transition py-2"
              onClick={() => setIsMobileMenuOpen(false)}
              role="menuitem"
            >
              About
            </Link>
          </div>
        )}
      </Container>
    </header>
  );
};

export default Header;
