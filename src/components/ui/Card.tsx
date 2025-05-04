import React from "react";
import { twMerge } from "tailwind-merge";

export interface CardProps {
  variant?: "standard" | "interactive" | "highlighted";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  variant = "standard",
  className = "",
  children,
  onClick,
}) => {
  // Base styles
  const baseStyles = "rounded-lg overflow-hidden";

  // Variant styles
  const variantStyles = {
    standard: "bg-white shadow-sm",
    interactive: "bg-white shadow hover:shadow-md transition cursor-pointer",
    highlighted: "bg-white shadow-md border-l-4 border-primary",
  };

  return (
    <div
      className={twMerge(baseStyles, variantStyles[variant], className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "", children }) => {
  return (
    <div className={twMerge("px-4 py-3 border-b border-gray-100", className)}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "", children }) => {
  return <div className={twMerge("px-4 py-4", className)}>{children}</div>;
};

export const CardFooter: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "", children }) => {
  return (
    <div className={twMerge("px-4 py-3 bg-slate-50", className)}>
      {children}
    </div>
  );
};

export default Card;
