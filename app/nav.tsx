import Link from "next/link";
import { logoutAction } from "./actions";
import type { CurrentUser } from "@/lib/auth";

export function Nav({ user }: { user: CurrentUser }) {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        AasaMedChem
      </Link>
      <nav className="nav">
        {user.role === "admin" ? (
          <>
            <Link className="button ghost" href="/admin">
              Admin
            </Link>
            <Link className="button ghost" href="/admin/orders">
              Orders
            </Link>
            <Link className="button ghost" href="/admin/product-requests">
              Requests
            </Link>
          </>
        ) : user.role === "seller" ? (
          <>
            <Link className="button ghost" href="/seller">
              My Listings
            </Link>
            <Link className="button ghost" href="/seller/orders">
              Sales
            </Link>
          </>
        ) : (
          <>
            <Link className="button ghost" href="/products">
              Products
            </Link>
            <Link className="button ghost" href="/orders">
              My Orders
            </Link>
          </>
        )}
        <span className="pill">{user.role}</span>
        <form action={logoutAction}>
          <button className="secondary" type="submit">
            Logout
          </button>
        </form>
      </nav>
    </header>
  );
}
