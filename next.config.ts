import type { NextConfig } from "next";
// @ts-ignore
import withPWA from "next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
});

// @ts-ignore
const nextConfig: any = {
  /* config options here */
  turbopack: {},
};

export default withPWAConfig(nextConfig);
