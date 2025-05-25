"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleSignOut} disabled={loading}>
      {loading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
