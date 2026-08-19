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
          // Fonds — indigo profond plutôt que noir pur : garde le contraste
          // fort mais moins "écran éteint", plus accueillant.
          bg: "#181430",
          panel: "#251d47", // panneaux / cartes, un cran plus clair (hiérarchie visuelle)
          panel2: "#2f2557", // sous-panneaux / zones actives dans une carte

          // Vert acide — accent principal (actions positives, score, CTA).
          acid: {
            DEFAULT: "#9dff2e",
            light: "#d0ff9c",
            dark: "#4d8a0f",
          },

          // Violet — accent secondaire (liens, éléments neutres interactifs).
          violet: {
            DEFAULT: "#a78bfa",
            light: "#dccbff",
            dark: "#5b2a9e",
          },

          // Rose/magenta — accent "émotion" (vote émotion, highlights ludiques).
          pink: {
            DEFAULT: "#ff5ca8",
            light: "#ffb3d9",
            dark: "#a11e63",
          },

          // Cyan — accent "info" (liens secondaires, badges neutres).
          cyan: {
            DEFAULT: "#3ee6e6",
            light: "#a6f7f7",
            dark: "#0f7a7a",
          },

          // Jaune — avertissements, séries/streaks, mise en avant ponctuelle.
          yellow: {
            DEFAULT: "#ffd23f",
            light: "#ffe89c",
            dark: "#a3760a",
          },

          // Gris (texte secondaire, états désactivés) — plus clair pour la lisibilité.
          gray: {
            100: "#f5f4fa",
            300: "#c7c2e0",
            500: "#8f89b3",
            700: "#453a6e",
          },

          // Noir pur pour bordures (contraste net, sans transparence).
          ink: "#000000",

          // États sémantiques
          danger: "#ff4d5e",
          success: "#4ade80",
        },
      },

      fontFamily: {
        // Réservée aux titres, scores, boutons et badges : usage ponctuel,
        // jamais pour de longs textes (lisibilité).
        pixel: ['"Press Start 2P"', "monospace"],
        // Police du contenu courant : lisible, moderne, mobile-friendly.
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },

      letterSpacing: {
        pixel: "0.02em",
      },

      // Ombres portées nettes, sans blur, façon sprite 8-bit.
      boxShadow: {
        "pixel-sm": "2px 2px 0 0 #000",
        pixel: "4px 4px 0 0 #000",
        "pixel-lg": "6px 6px 0 0 #000",
        "pixel-acid": "4px 4px 0 0 #9dff2e",
        "pixel-violet": "4px 4px 0 0 #a78bfa",
        "pixel-pink": "4px 4px 0 0 #ff5ca8",
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
