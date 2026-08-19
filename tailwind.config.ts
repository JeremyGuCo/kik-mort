import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    // Pas d'arrondis en 8-bit : tout est carré / pixelisé.
    borderRadius: {
      none: "0px",
      DEFAULT: "0px",
      full: "9999px", // réservé aux avatars/pastilles rondes explicites
    },
    extend: {
      colors: {
        gbc: {
          // Fonds
          bg: "#0f0f1b", // noir profond violacé (fond global)
          panel: "#1a1a2e", // panneaux / cartes
          screen: "#0d1b0d", // fond "écran" (pour zones type modale)

          // Verts acides (accent principal, style écran GBC)
          acid: {
            DEFAULT: "#9bbc0f",
            light: "#c6e26a",
            dark: "#3e5c1f",
          },

          // Violets (accent secondaire / actions)
          violet: {
            DEFAULT: "#8b5cf6",
            light: "#c4b5fd",
            dark: "#4c1d95",
          },

          // Gris (texte secondaire, états désactivés)
          gray: {
            100: "#e8e8e8",
            300: "#a8a8a8",
            500: "#6b6b6b",
            700: "#3a3a3a",
          },

          // Noir pur pour bordures/texte (contraste net, sans transparence)
          ink: "#000000",

          // États sémantiques
          danger: "#ff4d5e",
          success: "#4ade80",
        },
      },

      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
      },

      fontSize: {
        // Échelle resserrée : Press Start 2P est très large, on garde les
        // tailles petites pour rester lisible en mobile-first.
        xs: ["0.5rem", { lineHeight: "1.6" }],
        sm: ["0.625rem", { lineHeight: "1.6" }],
        base: ["0.75rem", { lineHeight: "1.8" }],
        lg: ["1rem", { lineHeight: "1.8" }],
        xl: ["1.25rem", { lineHeight: "1.8" }],
        "2xl": ["1.75rem", { lineHeight: "1.6" }],
      },

      // Ombres portées nettes, sans blur, façon sprite 8-bit.
      boxShadow: {
        "pixel-sm": "2px 2px 0 0 #000",
        pixel: "4px 4px 0 0 #000",
        "pixel-lg": "6px 6px 0 0 #000",
        "pixel-acid": "4px 4px 0 0 #9bbc0f",
        "pixel-violet": "4px 4px 0 0 #8b5cf6",
        "pixel-inset": "inset 2px 2px 0 0 #000",
      },

      // Décalage utilisé conjointement au boxShadow pour l'effet "pressé".
      translate: {
        pixel: "4px",
      },

      borderWidth: {
        3: "3px",
        6: "6px",
      },

      keyframes: {
        "pixel-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "pixel-pop": {
          "0%": { transform: "scale(0.9)" },
          "60%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "pixel-blink": "pixel-blink 1s step-start infinite",
        "pixel-pop": "pixel-pop 0.15s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
