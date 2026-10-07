import Link from "next/link";

export default function DriverRegisterPage() {
  return (
    <main className="page-shell">
      <div className="page-card">
        <span className="eyebrow">Driver / recovery company</span>
        <h1>Join the recovery network.</h1>
        <p>Build a professional profile, submit your details for approval and prepare to receive suitable recovery opportunities.</p>
        <div className="request-steps"><span><b>01</b>Profile</span><span><b>02</b>Coverage</span><span><b>03</b>Documents</span><span><b>04</b>Approval</span></div>
        <form className="form-grid">
          <label>Full name<input placeholder="Full name" autoComplete="name" /></label>
          <label>Company name <small>Optional</small><input placeholder="Company name" /></label>
          <div className="two-column"><label>Phone<input type="tel" placeholder="UK phone number" autoComplete="tel" /></label><label>Email<input type="email" placeholder="Email address" autoComplete="email" /></label></div>
          <div className="form-divider" />
          <div><span className="form-section-title">Next in the application</span><p className="form-help">The full verification flow will collect service coverage, recovery vehicle details, insurance and supporting documents.</p></div>
          <button type="button" className="button primary button-large">Start driver application →</button>
        </form>
        <p className="estimate-note"><strong>Approval required.</strong> Customer information access is reserved for approved recovery professionals.</p>
        <Link href="/driver" className="text-link">Back to driver area →</Link>
      </div>
    </main>
  );
}