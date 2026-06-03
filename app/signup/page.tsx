import Link from "next/link";
import { signupAction } from "@/app/actions";

export default function SignupPage() {
  return (
    <main className="login">
      <form className="card stack" action={signupAction}>
        <div>
          <span className="pill">Create Account</span>
          <h1>AasaMedChem</h1>
          <p className="muted">Sign up to join our platform as a buyer or seller</p>
        </div>

        <label>
          Full Name
          <input name="name" type="text" required />
        </label>

        <label>
          Email
          <input name="email" type="email" required />
        </label>

        <label>
          Password
          <input name="password" type="password" required minLength={8} />
          <small className="muted">At least 8 characters</small>
        </label>

        <label>
          Confirm Password
          <input name="confirmPassword" type="password" required minLength={8} />
        </label>

        <label>
          I want to signup as:
          <div className="role-options">
            <label>
              <input type="radio" name="role" value="buyer" required defaultChecked />
              Buyer - Purchase chemicals and products
            </label>
            <label>
              <input type="radio" name="role" value="seller" required />
              Seller - List and sell products
            </label>
          </div>
        </label>

        <button type="submit">Create Account</button>

        <p className="muted center">
          Already have an account?{" "}
          <Link href="/login" className="link">
            Login here
          </Link>
        </p>
        <hr />
        <p className="muted center">
          Go back to Home{" "}
          <Link href="/" className="link">
            Home
          </Link>
        </p>
      </form>
    </main>
  );
}
