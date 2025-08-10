import { clsx } from "clsx";
import * as React from "react";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx("inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium shadow-sm hover:shadow transition",
                      "bg-black text-white disabled:opacity-50", className)}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-2xl bg-white p-5 shadow-sm", className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx("w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring",
                                 className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={clsx("mb-1 block text-sm font-medium text-gray-700", className)} {...props} />;
}
