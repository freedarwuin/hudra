import { createTheme } from "@vanilla-extract/css";

export const SPACING_UNIT = 8;

export const [themeClass, vars] = createTheme({
  color: {
    background: "#1c1c1c",
    darkBackground: "#151515",
    muted: "#c0c1c7",
    body: "#8e919b",
    border: "#424244",
    success: "#1c9749",
    danger: "#e11d48",
  },
  opacity: {
    disabled: "0.5",
    active: "0.7",
  },
  size: {
    body: "14px",
  },
});
