export default function RecoveryRequestPage() {
  return (
    <main className="page-shell">
      <div className="page-card">
        <span className="eyebrow">Recovery request</span>
        <h1>Tell us what you need.</h1>
        <p>
          This is the initial request-flow foundation. Detailed postcode,
          vehicle, scheduling, pricing and photo fields will be added in the
          next development phase.
        </p>
        <form className="form-grid">
          <label>
            Recovery type
            <select defaultValue="">
              <option value="" disabled>Select a service</option>
              <option>Breakdown Recovery</option>
              <option>Accident Recovery</option>
              <option>Vehicle Transport</option>
              <option>Car Towing</option>
              <option>Jump Start / Flat Battery</option>
              <option>Flat Tyre Assistance</option>
            </select>
          </label>
          <label>
            Pickup postcode
            <input name="pickupPostcode" placeholder="e.g. M1 1AA" />
          </label>
          <label>
            Destination postcode
            <input name="destinationPostcode" placeholder="e.g. B1 1AA" />
          </label>
          <label>
            Vehicle registration
            <input name="registration" placeholder="e.g. AB12 CDE" />
          </label>
          <button type="button" className="button primary">Continue</button>
        </form>
        <p className="estimate-note">
          Any quote produced by the platform will be clearly labelled as an estimate.
        </p>
      </div>
    </main>
  );
}