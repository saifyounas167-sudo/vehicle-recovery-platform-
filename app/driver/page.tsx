import Link from "next/link";

export default function DriverPage() {
  return (
    <main className="page-shell">
      <div className="page-card">
        <span className="eyebrow">Driver / recovery company</span>
        <h1>Driver area foundation</h1>
        <p>
          Approved recovery professionals will eventually access available
          jobs, offers, job details, documents, services, coverage and
          subscription information here.
        </p>
        <Link href="/driver/register" className="button primary">Register as a driver</Link>
      </div>
    </main>
  );
}