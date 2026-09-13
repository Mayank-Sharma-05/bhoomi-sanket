import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 transition-colors">
      <div className="w-full max-w-4xl">
        {children}
      </div>
    </div>
  );
}
