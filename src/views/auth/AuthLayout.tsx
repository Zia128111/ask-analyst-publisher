'use client';

import { AuthMenu } from '../../components/auth/AuthMenu';
import { BrandPanel } from '../../components/auth/BrandPanel';
import { ProductLockup } from '../../components/ProductLockup';
import { SecureNotice } from '../../components/auth/SecureNotice';

import classes from './AuthLayout.module.css';

/* ============================================================================
 * AUTH LAYOUT
 * ============================================================================
 * The benchmark's shape: a form column with the logo at the top, the form in
 * the middle and the "your data is secure" note at the foot; beside it a brand
 * panel carrying a preview of the product. Below the lg breakpoint the panel is
 * dropped and the form column is the page.
 *
 * Landmarks: the lockup row is the <header>, the form is <main> (with the
 * page's single <h1> inside it), the brand panel is an <aside>. A client
 * component because the colour-scheme toggle holds state; each page's form is
 * passed through as `children`.
 * ========================================================================= */

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={classes.shell}>
      <div className={classes.column}>
        <header className={classes.top}>
          <ProductLockup />
          {/* A burger opening a drawer, with the colour-scheme toggle inside:
              the scheme is a reader preference so the control stays, but out
              of the header row. Reading direction is a locale decision and is
              not offered — see providers.tsx. */}
          <AuthMenu />
        </header>

        <main id="main" tabIndex={-1} className={classes.main}>
          {children}
        </main>

        <div className={classes.bottom}>
          <SecureNotice />
        </div>
      </div>

      <BrandPanel />
    </div>
  );
}
