import type { MetadataRoute } from "next";

// Permite instalar o Dinastia como app pelo Chrome (menu ⋮ › Transmitir, salvar e compartilhar › Instalar)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dinastia · Estruturação de Patrimônio",
    short_name: "Dinastia",
    description: "Simulação e estruturação patrimonial com consórcio.",
    start_url: "/grupos",
    display: "standalone",
    background_color: "#0d0540",
    theme_color: "#0d0540",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
