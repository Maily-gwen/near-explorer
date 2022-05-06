import { createStitches, PropertyValue } from "@stitches/react";

const stitches = createStitches({
  utils: {
    size: (value: PropertyValue<"width" | "height">) => ({
      width: value,
      height: value,
    }),
    marginHorizontal: (value: PropertyValue<"marginLeft" | "marginRight">) => ({
      marginLeft: value,
      marginRight: value,
    }),
    marginVertical: (value: PropertyValue<"marginTop" | "marginBottom">) => ({
      marginTop: value,
      marginBottom: value,
    }),
    paddingHorizontal: (
      value: PropertyValue<"paddingLeft" | "paddingRight">
    ) => ({
      paddingLeft: value,
      paddingRight: value,
    }),
    paddingVertical: (
      value: PropertyValue<"paddingTop" | "paddingBottom">
    ) => ({
      paddingTop: value,
      paddingBottom: value,
    }),
  },
  theme: {
    colors: {
      background: "#1b1d1f",
      avatarFallback: "#c4c4c4",
      textColor: "#ffffff",
      backgroundTextColor: "#c9c9c9",
      divider: "rgba(255, 255, 255, 0.1)",
    },
    fontSizes: {
      "font-xs": "10px",
      "font-s": "12px",
      "font-m": "14px",
      "font-l": "24px",
      "font-xl": "40px",
    },
    space: {
      "space-s": "8px",
      "space-m": "16px",
      "space-l": "40px",
      "padding-m": "8px",
      "padding-s": "4px",
    },
    sizes: {
      avatarSize: "60px",
    },
    radii: {
      round: "50%",
      "radius-s": "4px",
    },
  },
});

export const { styled, globalCss, getCssText, css } = stitches;
