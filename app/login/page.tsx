import { loginAction } from "@/app/actions";

export default function LoginPage() {
  return (
    <main className="login">
      <form className="card stack" action={loginAction}>
        <div>
          <span className="pill">Secure demo login</span>
          <h1>AasaMedChem</h1>
          <p className="muted">Use the seeded admin or seller account to explore each role.</p>
        </div>
        <label>
          Email
          <input name="email" type="email" defaultValue="seller@aasamedchem.test" required />
        </label>
        <label>
          Password
          <input name="password" type="password" defaultValue="Seller@123" required />
        </label>
        <button type="submit">Login</button>
        <p className="muted">
          Admin: admin@aasamedchem.test / Admin@123
          <br />
          Seller: seller@aasamedchem.test / Seller@123
        </p>
      </form>
    </main>
  );
}
