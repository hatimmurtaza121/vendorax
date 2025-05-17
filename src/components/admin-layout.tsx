"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Package2Icon,
  SearchIcon,
  LayoutDashboardIcon,
  DollarSignIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
  ShoppingBagIcon,
  FactoryIcon,
  MenuIcon,
} from "lucide-react";

const pageNames: { [key: string]: string } = {
  "/admin": "Dashboard",
  "/admin/accounts": "Accounts",
  "/admin/cashier": "Transactions",
  "/admin/products": "Inventory",
  "/admin/orders": "Orders",
  "/admin/sale": "Sale",
  "/admin/purchase": "Purchase",
  "/admin/manufacture": "Manufacture",
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

   // Closing sidebar when page changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);
  
  // Sign out and send back to login
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
    } else {
      router.push("/login");
    }
  };

  const handleAddDemoData = async () => {
    const confirmed = confirm("Generate realistic demo data for your account?");
    if (!confirmed) return;

    const res = await fetch("/api/demo/generate", { method: "POST" });
    const data = await res.json();
    alert(data.message || data.error);
  };

  const handleDeleteDemoData = async () => {
    const confirmed = confirm("This will delete all your demo data. Continue?");
    if (!confirmed) return;

    const res = await fetch("/api/demo/delete", { method: "DELETE" });
    const data = await res.json();
    alert(data.message || data.error);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
        <button
          className="sm:hidden p-2 rounded hover:bg-muted-foreground/10"
          onClick={() => setSidebarOpen(o => !o)}
        >
          <MenuIcon className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </button>

        <Link
          href="/admin"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <Image
            src="/Vendorax_cleanlogo.png"
            alt="Company Logo"
            width={28}
            height={28}
            sizes="auto"
            className="h-8 w-8"
            unoptimized
          />
          {/* <span className="sr-only">Vendora Ax</span> */}
        </Link>

        <h1 className="text-xl font-bold">{pageNames[pathname]}</h1>
        <div className="relative ml-auto flex-1 md:grow-0">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Image
                src="/placeholder-user.jpg"
                width={36}
                height={36}
                alt="Avatar"
                className="overflow-hidden rounded-full"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>

            {/* <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAddDemoData}>Add Demo Data</DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteDemoData}>Delete Demo Data</DropdownMenuItem> */}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-56">
        <aside
          className={`fixed mt-[56px] inset-y-0 left-0 z-20 w-56 border-r bg-background
                      ${sidebarOpen ? "flex" : "hidden"} sm:flex flex-col`}
        >
          <nav className="flex flex-col gap-1 p-4">
            <Link href="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted
              ${pathname === "/admin" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
              <LayoutDashboardIcon className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>

            <Link href="/admin/cashier" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted
              ${pathname === "/admin/cashier" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
              <DollarSignIcon className="h-5 w-5" />
              <span>Transactions</span>
            </Link>

            <Link href="/admin/products" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted
              ${pathname === "/admin/products" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
              <PackageIcon className="h-5 w-5" />
              <span>Inventory</span>
            </Link>

            <Link href="/admin/accounts" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted
              ${pathname === "/admin/accounts" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
              <UsersIcon className="h-5 w-5" />
              <span>Accounts</span>
            </Link>

            <Link href="/admin/orders" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted
              ${pathname === "/admin/orders" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
              <ShoppingBagIcon className="h-5 w-5" />
              <span>Orders</span>
            </Link>

            <Link href="/admin/sale" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted
              ${pathname === "/admin/sale" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
              <ShoppingCartIcon className="h-5 w-5" />
              <span>Sale</span>
            </Link>
            <Link href="/admin/purchase" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted
              ${pathname === "/admin/purchase" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
              <Package2Icon className="h-5 w-5" />
              <span>Purchase</span>
            </Link>
            <Link href="/admin/manufacture" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted 
              ${pathname === "/admin/manufacture" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
              <FactoryIcon className="h-5 w-5" />
              <span>Manufacture</span>
            </Link>
          </nav>
        </aside>
        {/* Overlay for small screens */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-10 bg-black bg-opacity-50 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </div>
    </div>
  );
}
