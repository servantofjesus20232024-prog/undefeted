"use client";

import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    window.location.replace("/undefeted/");
  }, []);

  return (
    <main className="notFoundRedirect">
      <p>Redirecting</p>
      <a href="/undefeted/">Open scoreboard</a>
    </main>
  );
}
