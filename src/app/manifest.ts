import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Relog — Review Your Backlog",
    short_name: "Relog",
    description: "Track and review your media backlog: films, TV, games, books.",
    start_url: "/films",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
