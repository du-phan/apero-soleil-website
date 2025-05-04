import React from "react";
import Link from "next/link";
import Container from "./Container";

export const Header: React.FC = () => {
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
              className="md:hidden text-secondary-dark hover:text-primary transition"
              aria-label="Menu"
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
      </Container>
    </header>
  );
};

export default Header;
