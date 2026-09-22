import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function Button({ className = "", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={`min-h-11 rounded-2xl bg-[#315b46] px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  }
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`min-h-11 w-full rounded-2xl border border-[#cfd8d2] bg-white px-3 text-[#203a2e] ${className}`}
        {...props}
      />
    );
  }
);
