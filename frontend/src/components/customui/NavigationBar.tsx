import { Link, useLocation } from "react-router-dom";
import { CircleUser, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";import toast from "react-hot-toast"
import { supabase_client } from "@/services/SupabaseClient"
import { useNavigate } from "react-router-dom"

const NavigationBar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

    const navigate = useNavigate()
    const handleLogout = async () => {
        const { error } = await supabase_client.auth.signOut()
        if (error) {
            toast.error(error.message);
        }
        navigate('/login')
    }
  
    const handleProfileButtonClick = async () => {
        navigate('/profile')
    }
    return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-muted px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-base lg:gap-6">
        <Link
          to="/"
          className={`transition-colors hover:text-foreground ${
            isActive("/") ? "font-bold" : "text-foreground"
          }`}
        >
          Dashboard
        </Link>
        <Link
          to="/orders"
          className={`transition-colors hover:text-foreground ${
            isActive("/orders") ? "font-bold" : "text-foreground"
          }`}
        >
          Orders
        </Link>
        <Link
          to="/parts"
          className={`transition-colors hover:text-foreground ${
            isActive("/parts") ? "font-bold" : "text-foreground"
          }`}
        >
          Parts
        </Link>
        <Link
          to="/storage"
          className={`transition-colors hover:text-foreground ${
            isActive("/storage") ? "font-bold" : "text-foreground"
          }`}
        >
          Storage
        </Link>
        <Link
          to="/machine"
          className={`transition-colors hover:text-foreground ${
            isActive("/machine") ? "font-bold" : "text-foreground"
          }`}
        >
          Machine
        </Link>
        <Link
          to="/damagedparts"
          className={`transition-colors whitespace-nowrap hover:text-foreground ${
            isActive("/damagedparts") ? "font-bold" : "text-foreground"
          }`}
        >
          Damaged-Parts
        </Link>
        <Link
          to="/management"
          className={`transition-colors whitespace-nowrap hover:text-foreground ${
            isActive("/management") ? "font-bold" : "text-foreground"
          }`}
        >
          Management
        </Link>
      </nav>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg">
            <Link
              to="/"
              className={`hover:text-foreground ${
                isActive("/") ? "font-bold" : "text-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/orders"
              className={`hover:text-foreground ${
                isActive("/orders") ? "font-bold" : "text-foreground"
              }`}
            >
              Orders
            </Link>
            <Link
              to="/parts"
              className={`hover:text-foreground ${
                isActive("/parts") ? "font-bold" : "text-foreground"
              }`}
            >
              Parts
            </Link>
            <Link
              to="/storage"
              className={`hover:text-foreground ${
                isActive("/storage") ? "font-bold" : "text-foreground"
              }`}
            >
              Storage
            </Link>
            <Link
              to="/machine"
              className={`hover:text-foreground ${
                isActive("/machine") ? "font-bold" : "text-foreground"
              }`}
            >
              Machine
            </Link>
            <Link
              to="/damagedparts"
              className={`hover:text-foreground whitespace-nowrap ${
                isActive("/damagedparts") ? "font-bold" : "text-foreground"
              }`}
            >
              Damaged-Parts
            </Link>
            <Link
              to="/management"
              className={`transition-colors whitespace-nowrap hover:text-foreground ${
                isActive("/management") ? "font-bold" : "text-foreground"
              }`}
            >
              Management
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

        <div className="flex justify-end w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileButtonClick}>Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
  )
}

export default NavigationBar;
