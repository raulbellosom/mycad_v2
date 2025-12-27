/* eslint-env browser */
export const THEME_KEY = "mycad.theme";

export function applyTheme(mode) {
  const root = document.documentElement;
  root.classList.remove("dark");

  if (mode === "dark") {
    root.classList.add("dark");
    return;
  }

  if (mode === "light") return;

  const prefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)"
  )?.matches;
  if (prefersDark) root.classList.add("dark");
}
