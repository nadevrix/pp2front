// Wrapper común a /, /precios y /faq.
// Server component porque PublicNav lee la sesión del cookie.

import PublicNav from './PublicNav';
import PublicFooter from './PublicFooter';

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </>
  );
}
