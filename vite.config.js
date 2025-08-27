import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // allow external access
    allowedHosts: [".csb.app"], // allow all csb.app subdomains
  },
});
