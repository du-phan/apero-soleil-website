import React from "react";
import Link from "next/link";
import Container from "./Container";

export const Footer: React.FC = () => {
  return (
    <footer className="py-6 bg-background-alt">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-secondary mb-4 md:mb-0">
            © {new Date().getFullYear()} Terrasse au Soleil. All rights
            reserved.
          </div>
          <div className="flex space-x-6">
            <Link
              href="/privacy"
              className="text-xs text-secondary hover:text-primary transition"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-secondary hover:text-primary transition"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-xs text-secondary hover:text-primary transition"
            >
              Contact
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
