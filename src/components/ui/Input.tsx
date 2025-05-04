import React from "react";
import { twMerge } from "tailwind-merge";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  icon?: React.ReactNode;
  onClear?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = "",
  inputClassName = "",
  labelClassName = "",
  errorClassName = "",
  icon,
  onClear,
  ...props
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      // Trigger a change event to update any form state
      const event = new Event("input", { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={twMerge("flex flex-col space-y-1", className)}>
      {label && (
        <label
          htmlFor={props.id}
          className={twMerge(
            "text-sm font-medium text-gray-700",
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          className={twMerge(
            "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm",
            icon && "pl-10",
            onClear && "pr-10",
            error && "border-error focus:border-error focus:ring-error",
            inputClassName
          )}
          {...props}
        />
        {onClear && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={handleClear}
            aria-label="Clear input"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400 hover:text-gray-600"
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
        )}
      </div>
      {error && (
        <p className={twMerge("text-xs text-error", errorClassName)}>{error}</p>
      )}
    </div>
  );
};

export default Input;
