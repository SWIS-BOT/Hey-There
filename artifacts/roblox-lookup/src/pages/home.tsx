import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, History, Loader2, ArrowRight } from "lucide-react";
import { useSearchUsers } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useDebounce } from "@/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";

const POPULAR_USERS = ["Roblox", "builderman", "Shedletsky", "Linkmon99"];

export function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    document.title = "Roblox Lookup";
    const stored = localStorage.getItem("roblox_search_history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const { data: searchResults, isLoading } = useSearchUsers(
    { keyword: debouncedQuery },
    { query: { enabled: debouncedQuery.length >= 3, queryKey: ["search", debouncedQuery] } }
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    const newHistory = [query.trim(), ...history.filter(h => h !== query.trim())].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("roblox_search_history", JSON.stringify(newHistory));
    
    setLocation(`/u/${encodeURIComponent(query.trim())}`);
  };

  const handleSelectUser = (username: string) => {
    const newHistory = [username, ...history.filter(h => h !== username)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("roblox_search_history", JSON.stringify(newHistory));
    setLocation(`/u/${encodeURIComponent(username)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <path d="M9 9h6v6H9z"/>
          </svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
          Find any <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Roblox</span> player
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
          Instantly look up public profiles, friends, badges, and groups with a playful stat-card experience.
        </p>

        <div className="relative w-full max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="relative z-20">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search exact username..."
                className="w-full h-14 pl-12 pr-24 text-lg rounded-2xl shadow-sm border-muted-foreground/20 focus-visible:ring-primary/50"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                data-testid="input-search"
              />
              <Button 
                type="submit" 
                size="sm" 
                className="absolute right-2 h-10 rounded-xl"
                disabled={!query.trim()}
                data-testid="button-search"
              >
                Search
              </Button>
            </div>
          </form>

          <AnimatePresence>
            {isFocused && query.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-10 text-left"
              >
                {isLoading ? (
                  <div className="p-6 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Searching...
                  </div>
                ) : searchResults?.results && searchResults.results.length > 0 ? (
                  <div className="py-2">
                    {searchResults.results.map((user) => (
                      <button
                        key={user.id}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => handleSelectUser(user.name)}
                        data-testid={`button-search-result-${user.id}`}
                      >
                        <Avatar className="w-10 h-10 border border-border/50">
                          {user.avatarHeadshotUrl ? (
                            <AvatarImage src={user.avatarHeadshotUrl} />
                          ) : (
                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-semibold truncate">{user.displayName}</div>
                          <div className="text-sm text-muted-foreground truncate">@{user.name}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No exact matches found. Hit enter to lookup anyway.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-xl mx-auto">
          {history.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <History className="w-4 h-4" /> Recent Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                  <Button
                    key={i}
                    variant="secondary"
                    size="sm"
                    className="rounded-full bg-secondary/50 hover:bg-secondary"
                    onClick={() => handleSelectUser(h)}
                    data-testid={`button-history-${h}`}
                  >
                    {h}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Popular
            </h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_USERS.map((u, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border/60 hover:bg-muted/50"
                  onClick={() => handleSelectUser(u)}
                  data-testid={`button-popular-${u}`}
                >
                  {u}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
