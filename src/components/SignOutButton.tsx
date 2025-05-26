import { useState } from "react";
import { Button } from "./ui/button";
import { supabase } from "@/utils/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      toast.success("Signed out successfully");
      navigate("/login");
    } catch (error: unknown) {
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
