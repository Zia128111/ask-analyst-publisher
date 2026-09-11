import type { NextConfig } from 'next';

/* ============================================================================
 * The design system needs no `transpilePackages`: it ships built ESM, carries
 * its own "use client" banner, and its JS imports no CSS (the library build
 * extracts styles to a separate entry, imported in app/layout.tsx). If a future
 * version starts importing CSS from its JS, add it here — the symptom is an
 * opaque "Global CSS cannot be imported from within node_modules" build error.
 * ========================================================================= */
const nextConfig: NextConfig = {};

export default nextConfig;
