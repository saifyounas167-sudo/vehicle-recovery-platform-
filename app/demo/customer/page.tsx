import Link from "next/link";
export default function CustomerDemo(){
 return <main className="dashboard-shell"><section className="container dashboard-content"><p className="dashboard-kicker">CLIENT REVIEW · READ ONLY</p><h1>Customer dashboard</h1><p>Recovery requests, matching status, driver offers and manual selection are retained in the integrated app. No customer records or offers are shown during the client demo.</p><div className="dashboard-card"><h2>My recovery requests</h2><p>Live request submission and offer acceptance are paused pending end-to-end verification.</p></div><Link className="button primary" href="/recovery/request">View five-step customer form</Link></section></main>;
}
