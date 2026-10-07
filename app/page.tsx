import Link from "next/link";

const services = [
  { title: "Breakdown Recovery", text: "Get moving again when your vehicle lets you down.", icon: "↯" },
  { title: "Accident Recovery", text: "Careful recovery when a collision has stopped your journey.", icon: "!" },
  { title: "Car Towing", text: "Professional towing for cars, 4x4s and small vehicles.", icon: "↗" },
  { title: "Vehicle Transport", text: "Move running or non-running vehicles across the UK.", icon: "□" },
  { title: "Jump Start", text: "Roadside help for flat batteries and no-start situations.", icon: "+" },
  { title: "Flat Tyre Assistance", text: "Practical roadside support when a tyre stops your journey.", icon: "○" },
  { title: "Motorbike Recovery", text: "Specialist recovery for motorcycles and scooters.", icon: "◇" },
  { title: "Van Recovery", text: "Reliable recovery for vans and commercial vehicles.", icon: "▰" },
];

const trustPoints = [
  ["01", "Approved professionals", "Driver approval workflows are built into the marketplace."],
  ["02", "Clear estimates", "Quotes are presented as estimates before a job is confirmed."],
  ["03", "Protected details", "Customer contact information is handled through the platform."],
];

const steps = [
  ["01", "Location", "Enter a UK postcode or use your device location."],
  ["02", "Vehicle & service", "Tell us what vehicle you have and what recovery you need."],
  ["03", "Problem & details", "Describe the condition, timing and any recovery difficulty."],
  ["04", "Quote & confirmation", "Review the estimate, submit the request and follow progress."],
];

export default function HomePage() {
  return (
    <main className="home">
      <div className="stitch-install">Install Rescue247 App for instant roadside dispatch</div>
      <header className="site-header">
        <div className="nav-wrap">
          <Link href="/" className="brand" aria-label="UK Recovery home">
            <span className="brand-mark"><span>UK</span><i /></span>
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
        <div className="hero-grid container">
          <div className="hero-copy">
            <div className="stitch-pill"><span className="stitch-dot" /> UK&apos;s trusted recovery marketplace · 24/7</div>
            <h1>Vehicle Recovery <span>Made Simple</span></h1>
            <p className="hero-lead">Get matched with vetted recovery professionals for breakdowns, towing and vehicle transport across the UK.</p>
            <div className="hero-actions">
              <Link href="/recovery/request" className="button primary button-large">Get a Recovery Quote <span>→</span></Link>
              <Link href="/driver/register" className="button ghost button-large">Join as a Recovery Driver</Link>
            </div>
            <div className="stitch-stats"><div className="stitch-stat"><strong>24/7</strong><span>Roadside dispatch</span></div><div className="stitch-stat"><strong>UK</strong><span>Nationwide coverage</span></div><div className="stitch-stat"><strong>100%</strong><span>Verified drivers</span></div><div className="stitch-stat"><strong>Live</strong><span>Driver offers</span></div></div><div className="hero-trust">
              <span>✓ Start quickly, sign in when submitting</span>
              <span>✓ Estimate shown clearly</span>
              <span>✓ Mobile-ready experience</span>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-top"><span className="status-dot" /> <span>Start a recovery request</span><span className="live-label">4 STEPS</span></div>
            <h2>What do you need help with?</h2>
            <div className="quick-services">
              {services.slice(0, 6).map((service) => (
                <Link href="/recovery/request" key={service.title} className="quick-card">
                  <span className="service-icon">{service.icon}</span><span>{service.title}</span><span className="arrow">→</span>
                </Link>
              ))}
            </div>
            <div className="panel-note"><span>01</span><p>Location → Vehicle → Service → Quote</p></div>
            <Link href="/recovery/request" className="panel-link">Start your recovery request <span>→</span></Link>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-items">
          {trustPoints.map(([number, title, text]) => (
            <div key={number}><span className="trust-icon">{number}</span><div><strong>{title}</strong><small>{text}</small></div></div>
          ))}
        </div>
      </section>

      <section className="section services-section" id="services">
        <div className="container">
          <div className="section-heading">
            <div><div className="eyebrow">Recovery services</div><h2>One marketplace for the roadside jobs that matter.</h2></div>
            <p>Choose the closest fit for your situation. The request journey then captures the details a recovery professional needs.</p>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <Link href="/recovery/request" key={service.title} className="service-card">
                <div className="service-icon large">{service.icon}</div>
                <div className="service-content"><h3>{service.title}</h3><p>{service.text}</p><span>Request this service <b>→</b></span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="center-heading"><div className="eyebrow">Designed for stressful moments</div><h2>A simpler route to recovery.</h2><p>Every step is focused on getting the right information without making an urgent situation feel complicated.</p></div>
          <div className="steps">
            {steps.map(([number, title, text]) => <article className="step" key={number}><span className="step-number">{number}</span><div className="step-line" /><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <div className="how-cta"><div><strong>Ready to request help?</strong><span>Start with your location and we’ll guide you through the rest.</span></div><Link href="/recovery/request" className="button primary">Get a Recovery Quote →</Link></div>
        </div>
      </section>

      <section className="driver-section">
        <div className="container driver-card">
          <div>
            <div className="eyebrow">For recovery professionals</div>
            <h2>Turn your coverage into better opportunities.</h2>
            <p>Create a professional profile, set your service coverage and manage marketplace jobs from one dedicated driver experience.</p>
            <Link href="/driver/register" className="button light">Join as a Recovery Driver →</Link>
          </div>
          <div className="driver-points">
            <span><em>01</em><b>Build your profile</b><small>Show services, vehicles and coverage.</small></span>
            <span><em>02</em><b>Review suitable jobs</b><small>See the information needed to decide whether to respond.</small></span>
            <span><em>03</em><b>Manage assignments</b><small>Keep accepted and completed work organised.</small></span>
          </div>
        </div>
      </section>

      <section className="safety-section">
        <div className="container safety-grid">
          <div><div className="eyebrow">Trust & safety</div><h2>A professional foundation for every side of the marketplace.</h2></div>
          <div className="safety-copy"><p>The platform is designed around approved recovery professionals, clear estimates, protected customer information and role-based experiences for customers, drivers and administrators.</p><div className="safety-badges"><span>✓ Driver approval</span><span>✓ Protected contact details</span><span>✓ Estimate clearly labelled</span><span>✓ Role-based platform</span></div></div>
        </div>
      </section>

      <div className="mobile-nav"><Link href="/" className="active">Home</Link><Link href="/recovery/request">Quote</Link><Link href="/login">Sign in</Link></div><footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand"><Link href="/" className="brand"><span className="brand-mark"><span>UK</span><i /></span><span><strong>Recovery</strong><small>Vehicle recovery marketplace</small></span></Link><p>Connecting customers with recovery professionals through a clearer UK recovery marketplace.</p></div>
          <div><strong>Customers</strong><Link href="/recovery/request">Get a recovery quote</Link><a href="#services">Recovery services</a><a href="#how-it-works">How it works</a></div>
          <div><strong>Recovery drivers</strong><Link href="/driver/register">Join as a driver</Link><Link href="/driver">Driver area</Link></div>
          <div><strong>Platform</strong><Link href="/admin">Admin</Link><span>PWA / Install App</span></div>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} UK Recovery. All rights reserved.</span><span>Built for UK vehicle recovery.</span></div>
      </footer>
    </main>
  );
}