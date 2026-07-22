import { Outlet, NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Explore", end: true },
  { to: "/about", label: "About", end: false },
] as const;

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] items-end justify-between gap-6 px-6 pt-6 pb-4">
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="font-display text-[26px] font-semibold leading-none tracking-[-0.01em] text-forest-deep">
                The Genome Gap
              </h1>
              <span className="hidden text-[13px] text-muted sm:inline">
                reference genomes for the world&rsquo;s vertebrates
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-5 text-[13px]">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `border-b-2 pb-1 font-medium transition-colors ${
                    isActive
                      ? "border-forest text-forest-deep"
                      : "border-transparent text-muted hover:text-ink"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 py-7">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 px-6 py-5 text-[12px] text-muted">
          <span>
            Conservation status from the IUCN Red List · genome availability from NCBI ·
            reconciled through the GBIF taxonomic backbone
          </span>
          <span>
            Data as versioned collections on{" "}
            <a
              href="https://underlay.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest underline decoration-line-strong underline-offset-2 hover:decoration-forest"
            >
              the Underlay
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
