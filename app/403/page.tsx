import Link from "next/link";
export default function ForbiddenPage(){return <main className="auth-shell"><section className="auth-card"><div className="eyebrow">Access control</div><h1>Access denied.</h1><p>Your account is authenticated, but it is not authorised to open this area.</p><Link href="/" className="button primary button-large">Return to marketplace →</Link></section></main>}
