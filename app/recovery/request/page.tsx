"use client";

import { useState } from "react";

const recoveryTypes = [
  "Breakdown Recovery","Accident Recovery","Vehicle Transport","Car Towing",
  "Jump Start / Flat Battery","Flat Tyre Assistance","Motorbike Recovery",
  "Van Recovery","Auction Vehicle Collection","Non-Running Vehicle Transport",
];

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
    <main className="page-shell"><div className="page-card">
      <span className="eyebrow">Customer recovery request</span>
      <h1>Tell us what you need.</h1>
      <p>You can request help without creating an account first. Confirm the service, location and vehicle details below.</p>
      <form className="form-grid">
        <label>Recovery type<select name="recoveryType" defaultValue="" required><option value="" disabled>Select a service</option>{recoveryTypes.map((x)=><option key={x}>{x}</option>)}</select></label>
        <label>Pickup postcode<input name="pickupPostcode" autoComplete="postal-code" placeholder="e.g. M1 1AA" required /></label>
        <button type="button" className="button secondary" onClick={useCurrentLocation}>Use my current GPS location</button>
        {locationStatus && <p className="location-status">{locationStatus}</p>}
        <label>Destination postcode<input name="destinationPostcode" autoComplete="postal-code" placeholder="e.g. B1 1AA" /></label>
        <label>Vehicle registration<input name="registration" placeholder="e.g. AB12 CDE" /></label>
        <div className="two-column"><label>Vehicle make<input name="make" /></label><label>Vehicle model<input name="model" /></label></div>
        <label>Vehicle type<select name="vehicleType" defaultValue=""><option value="" disabled>Select vehicle type</option><option>Car</option><option>Van</option><option>Motorbike</option><option>Other</option></select></label>
        <div className="two-column">
          <label>Transmission<select name="transmission" defaultValue=""><option value="" disabled>Select</option><option>Automatic</option><option>Manual</option></select></label>
          <label>Running status<select name="runningStatus" defaultValue=""><option value="" disabled>Select</option><option>Running</option><option>Non-running</option></select></label>
        </div>
        <label>Problem description<textarea name="problemDescription" rows={4} placeholder="Tell us what happened and any recovery difficulties." /></label>
        <label className="checkbox-row"><input type="checkbox" name="urgent" /><span>Urgent recovery</span></label>
        <label>Preferred collection time<input type="datetime-local" name="preferredCollectionTime" /></label>
        <div className="two-column"><label>Your name<input name="customerName" autoComplete="name" required /></label><label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label></div>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <button type="submit" className="button primary">Get estimated quote</button>
      </form>
      <p className="estimate-note">Estimate only — final pricing can change after driver assessment and confirmed job details.</p>
    </div></main>
  );
}