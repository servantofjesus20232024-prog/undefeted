"use client";

import { useEffect } from "react";

const homePath = process.env.NEXT_PUBLIC_BASE_PATH
  ? `${process.env.NEXT_PUBLIC_BASE_PATH}/`
  : "/";

export default function NotFound() {
  useEffect(() => {
    window.location.replace(homePath);
  }, []);

  return (
    <main className="notFoundRedirect">
      <p>Redirecting</p>
      <a href={homePath}>Open scoreboard</a>
    </main>
  );
}
