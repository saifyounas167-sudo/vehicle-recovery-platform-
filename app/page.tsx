import Link from "next/link";

const services = [
  { title: "Breakdown Recovery", text: "Get moving again when your vehicle lets you down.", icon: "⚡" },
  { title: "Accident Recovery", text: "Safe, careful recovery after a road accident.", icon: "✦" },
  { title: "Car Towing", text: "Professional towing for cars, 4x4s and small vehicles.", icon: "↗" },
  { title: "Vehicle Transport", text: "Move running or non-running vehicles across the UK.", icon: "▣" },
  { title: "Jump Start", text: "Fast help for flat batteries and no-start situations.", icon: "＋" },
  { title: "Flat Tyre Assistance", text: "Roadside support when a tyre stops your journey.", icon: "◌" },
  { title: "Motorbike Recovery", text: "Specialist recovery for motorcycles and scooters.", icon: "◇" },
  { title: "Van Recovery", text: "Reliable recovery for vans and commercial vehicles.", icon: "▰" },
];

const steps = [
  ["01", "Tell us what happened", "Share your location, vehicle details and what you need."],
  ["02", "Get an estimated quote", "See a transparent estimate before you submit your request."],
  ["03", "Connect with a pro", "Suitable approved recovery professionals can respond to your job."],
];

export default function HomePage() {
  return (
    <main className="home">
      <header className="site-header">
        <div className="nav-wrap">
          <Link href="/" className="brand" aria-label="UK Recovery home">
            <span className="brand-mark">UK</span>
            <span><strong>Recovery</strong><small>Vehicle recovery marketplace</small></span>
          </Link>
          <nav aria-label="Main navigation">
            <a href="#services">Services</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/driver">For drivers</Link>
            <Link href="/admin">Admin</Link>
          </nav>
          <Link href="/recovery/request" className="button primary nav-cta">Get a quote</Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> UK-wide vehicle recovery</div>
            <h1>Roadside help, <span>when you need it.</span></h1>
            <p className="hero-lead">Request breakdown recovery, towing or vehicle transport and connect with approved recovery professionals across the UK.</p>
            <div className="hero-actions">
              <Link href="/recovery/request" className="button primary button-large">Get a Recovery Quote <span>→</span></Link>
              <Link href="/driver/register" className="button ghost button-large">Join as a Recovery Driver</Link>
            </div>
            <div className="hero-trust">
              <span>✓ No account needed to request help</span>
              <span>✓ Estimated pricing upfront</span>
              <span>✓ Built for UK roads</span>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-top"><span className="status-dot" /> <span>Recovery request</span><span className="live-label">START NOW</span></div>
            <h2>What do you need help with?</h2>
            <div className="quick-services">
              {services.slice(0, 6).map((service) => (
                <Link href="/recovery/request" key={service.title} className="quick-card">
                  <span className="service-icon">{service.icon}</span><span>{service.title}</span><span className="arrow">↗</span>
                </Link>
              ))}
            </div>
            <Link href="/recovery/request" className="panel-link">View all recovery options <span>→</span></Link>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-items">
          <div><span className="trust-icon">✓</span><div><strong>Approved professionals</strong><small>Driver approval built into the platform</small></div></div>
          <div><span className="trust-icon">£</span><div><strong>Clear estimates</strong><small>Pricing designed to be transparent</small></div></div>
          <div><span className="trust-icon">⌖</span><div><strong>UK-focused</strong><small>Designed around UK recovery needs</small></div></div>
          <div><span className="trust-icon">▣</span><div><strong>Available on mobile</strong><small>Install the app for quick access</small></div></div>
        </div>
      </section>

      <section className="section services-section" id="services">
        <div className="container">
          <div className="section-heading">
            <div><div className="eyebrow">Recovery services</div><h2>Help for the journey ahead.</h2></div>
            <p>From a flat battery at home to vehicle transport across the country, choose the service that fits your situation.</p>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <Link href="/recovery/request" key={service.title} className="service-card">
                <div className="service-icon large">{service.icon}</div><div className="service-content"><h3>{service.title}</h3><p>{service.text}</p><span>Request help <b>→</b></span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="center-heading"><div className="eyebrow">Simple by design</div><h2>How it works</h2><p>Getting recovery help should be straightforward. We keep the process clear from request to recovery.</p></div>
          <div className="steps">
            {steps.map(([number, title, text]) => <article className="step" key={number}><span className="step-number">{number}</span><div className="step-line" /><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <div className="how-cta"><div><strong>Need recovery now?</strong><span>Start your request in a few simple steps.</span></div><Link href="/recovery/request" className="button primary">Get a Recovery Quote →</Link></div>
        </div>
      </section>

      <section className="driver-section">
        <div className="container driver-card">
          <div><div className="eyebrow">For recovery professionals</div><h2>Grow your recovery business with better jobs.</h2><p>Join the marketplace, build your professional profile and discover suitable recovery work based on your services and coverage.</p><Link href="/driver/register" className="button light">Join as a Recovery Driver →</Link></div>
          <div className="driver-points"><span>01 <b>Build your profile</b><small>Tell customers what you offer.</small></span><span>02 <b>Choose your coverage</b><small>Work within the areas that suit you.</small></span><span>03 <b>Manage your jobs</b><small>Keep requests and completed work organised.</small></span></div>
        </div>
      </section>

      <section className="safety-section">
        <div className="container safety-grid">
          <div><div className="eyebrow">Trust & safety</div><h2>Built around confidence on the roadside.</h2></div>
          <div className="safety-copy"><p>Customer and driver experiences are designed with clear information, professional approval workflows and protected contact details at the core.</p><div className="safety-badges"><span>✓ Driver approval</span><span>✓ Secure customer details</span><span>✓ Estimate clearly labelled</span></div></div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand"><Link href="/" className="brand"><span className="brand-mark">UK</span><span><strong>Recovery</strong><small>Vehicle recovery marketplace</small></span></Link><p>Connecting customers with recovery professionals across the UK.</p></div>
          <div><strong>Customers</strong><Link href="/recovery/request">Get a recovery quote</Link><a href="#services">Recovery services</a><a href="#how-it-works">How it works</a></div>
          <div><strong>Recovery drivers</strong><Link href="/driver/register">Join as a driver</Link><Link href="/driver">Driver area</Link></div>
          <div><strong>Platform</strong><Link href="/admin">Admin</Link><span>PWA / Install App</span></div>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} UK Recovery. All rights reserved.</span><span>Built for UK vehicle recovery.</span></div>
      </footer>
    </main>
  );
}
