"use client";

import { useState } from "react";

const recoveryTypes = [
  "Breakdown Recovery","Accident Recovery","Vehicle Transport","Car Towing",
  "Jump Start / Flat Battery","Flat Tyre Assistance","Motorbike Recovery",
  "Van Recovery","Auction Vehicle Collection","Non-Running Vehicle Transport",
];

const stages = ["Location", "Vehicle", "Service", "Problem", "Details", "Quote"];

export default function RecoveryRequestPage() {
  const [locationStatus, setLocationStatus] = useState("");

  function useCurrentLocation() {
    if (!navigator.geolocation) return setLocationStatus("GPS is not supported on this device.");
    setLocationStatus("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocationStatus(`Location captured: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`),
      () => setLocationStatus("Location permission was not granted.")
    );
  }

  return (
    <main className="page-shell">
      <div className="page-card">
        <span className="eyebrow">Customer recovery request</span>
        <h1>Tell us what happened.</h1>
        <p>Start with your location, then add the vehicle and recovery details needed for an estimated quote. No account is required to begin.</p>
        <div className="request-steps" aria-label="Recovery request stages">
          {stages.map((stage, index) => <span key={stage}><b>{String(index + 1).padStart(2, "0")}</b>{stage}</span>)}
        </div>
        <form className="form-grid">
          <label>Recovery service<select name="recoveryType" defaultValue="" required><option value="" disabled>Select a service</option>{recoveryTypes.map((x)=><option key={x}>{x}</option>)}</select></label>
          <div className="two-column">
            <label>Pickup postcode<input name="pickupPostcode" autoComplete="postal-code" placeholder="e.g. M1 1AA" required /></label>
            <div className="form-action"><span>At the roadside?</span><button type="button" className="button secondary" onClick={useCurrentLocation}>Use current GPS</button></div>
          </div>
          {locationStatus && <p className="location-status">{locationStatus}</p>}
          <label>Destination postcode <small>Optional if you need local roadside assistance.</small><input name="destinationPostcode" autoComplete="postal-code" placeholder="e.g. B1 1AA" /></label>
          <div className="two-column"><label>Vehicle registration<input name="registration" placeholder="e.g. AB12 CDE" /></label><label>Vehicle type<select name="vehicleType" defaultValue=""><option value="" disabled>Select vehicle type</option><option>Car</option><option>Van</option><option>Motorbike</option><option>Other</option></select></label></div>
          <div className="two-column"><label>Vehicle make<input name="make" /></label><label>Vehicle model<input name="model" /></label></div>
          <div className="two-column">
            <label>Transmission<select name="transmission" defaultValue=""><option value="" disabled>Select</option><option>Automatic</option><option>Manual</option></select></label>
            <label>Running status<select name="runningStatus" defaultValue=""><option value="" disabled>Select</option><option>Running</option><option>Non-running</option></select></label>
          </div>
          <label>Problem / vehicle condition<small>Include locked wheels, damage, accident details or access difficulties if relevant.</small><textarea name="problemDescription" rows={5} placeholder="Tell us what happened and any recovery difficulties." /></label>
          <div className="two-column">
            <label>Collection timing<select name="timing" defaultValue=""><option value="" disabled>Select timing</option><option>As soon as possible</option><option>Scheduled</option></select></label>
            <label>Preferred collection time<input type="datetime-local" name="preferredCollectionTime" /></label>
          </div>
          <label className="checkbox-row"><input type="checkbox" name="urgent" /><span>Mark this as an urgent recovery request</span></label>
          <div className="form-divider" />
          <div><span className="form-section-title">Your contact details</span><p className="form-help">Used to manage the request and contact you about recovery.</p></div>
          <div className="two-column"><label>Your name<input name="customerName" autoComplete="name" required /></label><label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label></div>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <button type="submit" className="button primary button-large">Continue to estimated quote →</button>
        </form>
        <div className="estimate-note"><strong>Estimate only.</strong> Final pricing can change after driver assessment and confirmed job details.</div>
      </div>
    </main>
  );
}