export default function DriverRegisterPage() {
  return (
    <main className="page-shell">
      <div className="page-card">
        <span className="eyebrow">Driver registration</span>
        <h1>Apply to join the recovery network.</h1>
        <p>Registration and document verification will be implemented after the core architecture is established.</p>
        <form className="form-grid">
          <label>Full name<input placeholder="Full name" /></label>
          <label>Company name<input placeholder="Company name (optional)" /></label>
          <label>Phone<input type="tel" placeholder="UK phone number" /></label>
          <label>Email<input type="email" placeholder="Email address" /></label>
          <button type="button" className="button primary">Start application</button>
        </form>
      </div>
    </main>
  );
}