import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const UserNavbar = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <nav className="dark:bg-[#0b1331] text-sidebar-foreground flex flex-col h-full w-16 md:w-64">
      <div className="flex flex-col flex-1 flex-wrap items-start justify-between mx-auto px-6 pt-8 pb-6">
        <Link to="/" className="flex items-center">
          <span className="hidden md:block self-start text-4xl font-extralight whitespace-nowrap">
            Bulti
          </span>
          <span className="md:hidden self-center text-xl font-bold">B</span>
        </Link>

        <div className="flex items-center md:order-2">
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 h-auto p-0"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url as string}
                    />
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm max-w-[150px] truncate">
                    {user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="dark:bg-card dark:text-card-foreground"
              >
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex space-x-2">
              <Button asChild size="sm" variant="ghost">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default UserNavbar;
