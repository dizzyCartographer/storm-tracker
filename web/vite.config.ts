import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      // Proxy auth requests to production during local dev
      "/api/auth": {
        target: "https://storm-tracker-murex.vercel.app",
        changeOrigin: true,
        cookieDomainRewrite: {
          "storm-tracker-murex.vercel.app": "",
        },
        // Ensure cookies work on localhost (strip Secure flag for http)
        configure: (proxy) => {
          // Rename cookies back to __Secure- prefix when sending to production
          proxy.on("proxyReq", (proxyReq) => {
            const cookie = proxyReq.getHeader("cookie") as string | undefined;
            if (cookie) {
              proxyReq.setHeader(
                "cookie",
                cookie.replace(
                  /better-auth\.session_token/g,
                  "__Secure-better-auth.session_token"
                )
              );
            }
          });
          proxy.on("proxyRes", (proxyRes) => {
            const setCookie = proxyRes.headers["set-cookie"];
            if (setCookie) {
              proxyRes.headers["set-cookie"] = setCookie.map((cookie) =>
                cookie
                  .replace(/^__Secure-/i, "")
                  .replace(/;\s*Secure/gi, "")
                  .replace(/;\s*SameSite=\w+/gi, "; SameSite=Lax")
              );
            }
          });
        },
      },
    },
  },
})
