import { useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useLookupUser, getLookupUserQueryKey } from "@workspace/api-client-react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function LookupRedirect() {
  const [, params] = useRoute("/u/:username");
  const [, setLocation] = useLocation();
  const username = params?.username || "";

  const { data, isLoading, isError } = useLookupUser(
    { username },
    { query: { enabled: !!username, queryKey: getLookupUserQueryKey({ username }) } }
  );

  useEffect(() => {
    if (data?.id) {
      setLocation(`/user/${data.id}`);
    }
  }, [data, setLocation]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-card p-8 rounded-3xl shadow-sm border"
        >
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-8">
            We couldn't find a Roblox user with the username <span className="font-semibold text-foreground">"{username}"</span>.
          </p>
          <Link href="/">
            <Button size="lg" className="w-full rounded-xl">Back to Search</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-medium animate-pulse text-muted-foreground">Looking up {username}...</h2>
    </div>
  );
}
