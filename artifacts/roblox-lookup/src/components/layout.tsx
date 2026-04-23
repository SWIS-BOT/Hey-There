import { Link } from "wouter";
import { useHealthCheck } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: health } = useHealthCheck();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container max-w-5xl mx-auto flex h-14 items-center px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary transition-opacity hover:opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <path d="M9 9h6v6H9z"/>
            </svg>
            Roblox Lookup
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>Unofficial — uses public Roblox APIs.</p>
        <p className="mt-1 opacity-60 flex items-center justify-center gap-2">
          Not affiliated with Roblox Corporation. 
          {health?.status === 'ok' && (
             <span className="flex items-center gap-1.5 ml-2" title="API Status: OK">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
               </span>
             </span>
          )}
        </p>
      </footer>
    </div>
  );
}
