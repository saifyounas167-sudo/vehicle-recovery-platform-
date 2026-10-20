import PreviewFrame from "../preview-frame";
const cards=[["My Recovery Requests","2"],["Active Bookings","1"],["Booking History","1"]];
export default function CustomerPreview(){return <PreviewFrame role="customer">
 <div className="pv-intro"><span className="pv-eyebrow">YOUR RECOVERY DASHBOARD · SAMPLE</span><h1>Welcome to UK Recovery</h1><p>Manage your recovery requests and keep everything in one place.</p><button disabled className="pv-button">Get Recovery Quote · Preview only</button></div>
 <section className="pv-cards pv-stats" aria-label="Sample customer overview">{cards.map(([label,value])=><div className="pv-card" key={label}><small>{label}</small><strong>{value}</strong><span className="pv-sample">SAMPLE</span></div>)}</section>
 <section className="pv-section"><h2>Quick actions</h2><div className="pv-cards">{["Get Recovery Quote","My Recovery Requests","Driver Offers","Track My Recovery","Booking History","My Profile / Settings"].map(x=><div className="pv-card pv-action" key={x}><span>↗</span><strong>{x}</strong><small>Preview only · Unavailable</small></div>)}</div></section>
 <section className="pv-section"><h2>My Recovery Requests <span className="pv-sample">SAMPLE</span></h2><div className="pv-card"><strong>Vehicle Transport</strong><p>Sample pickup → Sample destination</p><span className="pv-chip">Request submitted · SAMPLE</span></div></section>
 <section className="pv-section pv-pair"><div className="pv-card"><h2>Driver Offers</h2><p>Sample offers are unavailable for booking.</p><span className="pv-chip">Actions disabled</span></div><div className="pv-card"><h2>Active Bookings</h2><p>Sample recovery in progress.</p><span className="pv-chip">SAMPLE</span></div></section>
 <section className="pv-section"><div className="pv-card"><h2>Track My Recovery</h2><p>Live tracking is unavailable in preview mode.</p><button disabled className="pv-button">Open Tracking</button></div></section>
 <section className="pv-section"><h2>Booking History</h2><div className="pv-card"><p>Sample completed recovery · No real records.</p></div></section>
 </PreviewFrame>}
