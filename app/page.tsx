import Link from "next/link";

const services = [
  "Breakdown Recovery",
  "Accident Recovery",
  "Vehicle Transport",
  "Car Towing",
  "Jump Start / Flat Battery",
  "Flat Tyre Assistance",
  "Motorbike Recovery",
  "Van Recovery",
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand">UK Recovery</Link>
        <nav aria-label="Main navigation">
          <Link href="/driver">For Drivers</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">UK Vehicle Recovery Marketplace</span>
          <h1>Get the right recovery service when you need it.</h1>
          <p>
            Request vehicle recovery or transport, receive an estimated quote,
            and connect with approved recovery professionals.
          </p>
          <div className="hero-actions">
            <Link href="/recovery/request" className="button primary">
              Get a recovery quote
            </Link>
            <Link href="/driver/register" className="button secondary">
              Join as a recovery driver
            </Link>
          </div>
        </div>

        <div className="request-card">
          <p className="card-label">Start your request</p>
          <h2>What do you need help with?</h2>
          <div className="service-grid">
            {services.slice(0, 6).map((service) => (
              <Link href="/recovery/request" key={service} className="service-card">
                {service}
              </Link>
            ))}
          </div>
          <Link href="/recovery/request" className="text-link">
            See all recovery options →
          </Link>
        </div>
      </section>

      <section className="trust-section">
        <div>
          <span className="eyebrow">Built for the UK</span>
          <h2>A simple foundation for customers, drivers and administrators.</h2>
        </div>
        <div className="trust-grid">
          <article><strong>Customers</strong><p>Request recovery without needing an account first.</p></article>
          <article><strong>Approved drivers</strong><p>Find suitable jobs based on services and coverage.</p></article>
          <article><strong>Admin control</strong><p>Manage approvals, jobs, pricing and platform activity.</p></article>
        </div>
      </section>
    </main>
  );
}