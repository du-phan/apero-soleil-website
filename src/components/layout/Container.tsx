import React from "react";
import { twMerge } from "tailwind-merge";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  fullWidth = false,
}) => {
  return (
    <div
      className={twMerge(
        `mx-auto px-4 sm:px-6 ${fullWidth ? "w-full" : "max-w-7xl"}`,
        className
      )}
    >
      {children}
    </div>
  );
};

export default Container;
