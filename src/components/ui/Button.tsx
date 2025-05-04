import React from "react";
import { twMerge } from "tailwind-merge";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}) => {
  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Variant styles
  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
    secondary:
      "bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary",
    tertiary:
      "bg-transparent text-secondary border border-secondary hover:bg-secondary-light hover:bg-opacity-10 focus:ring-secondary",
  };

  // Size styles
  const sizeStyles = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
  };

  // Width styles
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={twMerge(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyles,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
