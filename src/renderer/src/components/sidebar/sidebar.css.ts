import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";
import { SPACING_UNIT, vars } from "../../theme.css";

export const sidebar = recipe({
  base: {
    backgroundColor: vars.color.darkBackground,
    color: vars.color.muted,
    flexDirection: "column",
    display: "flex",
    transition: "opacity ease 0.2s",
    borderRight: `solid 1px ${vars.color.border}`,
    position: "relative",
  },
  variants: {
    resizing: {
      true: {
        opacity: vars.opacity.active,
        pointerEvents: "none",
      },
    },
  },
});

export const content = recipe({
  base: {
    display: "flex",
    flexDirection: "column",
    padding: `${SPACING_UNIT * 2}px`,
    paddingBottom: "0",
    width: "100%",
    overflow: "auto",
  },
  variants: {
    macos: {
      true: {
        paddingTop: `${SPACING_UNIT * 6}px`,
      },
    },
  },
});

export const handle = style({
  width: "5px",
  height: "100%",
  cursor: "col-resize",
  position: "absolute",
  right: "0",
});

export const menu = style({
  listStyle: "none",
  padding: "0",
  margin: "0",
  gap: `${SPACING_UNIT / 2}px`,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const menuItem = recipe({
  base: {
    transition: "all ease 0.1s",
    cursor: "pointer",
    textWrap: "nowrap",
    display: "flex",
    color: vars.color.muted,
    borderRadius: "4px",
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
  },
  variants: {
    active: {
      true: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
      },
    },
    muted: {
      true: {
        opacity: vars.opacity.disabled,
        ":hover": {
          opacity: "1",
        },
      },
    },
  },
});

export const menuItemButton = style({
  color: "inherit",
  display: "flex",
  alignItems: "center",
  gap: `${SPACING_UNIT}px`,
  cursor: "pointer",
  overflow: "hidden",
  width: "100%",
  padding: `9px ${SPACING_UNIT}px`,
});

export const menuItemButtonLabel = style({
  textOverflow: "ellipsis",
  overflow: "hidden",
});

export const gameIcon = style({
  width: "20px",
  height: "20px",
  minWidth: "20px",
  minHeight: "20px",
  borderRadius: "4px",
  backgroundSize: "cover",
});

export const sectionHeader = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: `${SPACING_UNIT}px`,
});

export const sectionTitle = style({
  textTransform: "uppercase",
  fontWeight: "bold",
});

export const sortingButton = style({
  padding: "6px",
  borderRadius: "4px",
  color: vars.color.bodyText,
  fill: vars.color.bodyText,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: `${SPACING_UNIT}px`,
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  ":hover": {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
});

export const section = style({
  padding: `${SPACING_UNIT * 2}px 0`,
  gap: `${SPACING_UNIT * 2}px`,
  display: "flex",
  flexDirection: "column",
  paddingBottom: `${SPACING_UNIT}px`,
});
