"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("promptlab:save"));
          break;
        case "n":
          e.preventDefault();
          router.push("/prompts/new");
          break;
        case "k":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("promptlab:search"));
          break;
        case "/":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("promptlab:help"));
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return null;
}
