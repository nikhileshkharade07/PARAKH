function VendorProfile() {
  return (
    <div className="page">
      <div className="card">
        <p className="eyebrow">VENDOR PROFILE</p>
        <h1>ABC Suppliers</h1>
        <p>Vendor ID: V001</p>
        <p>
          Risk Level: <strong>High</strong>
        </p>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Total Contracts</h2>
          <h1>5</h1>
        </div>

        <div className="card">
          <h2>Total Contract Value</h2>
          <h1>₹25,00,000</h1>
        </div>

        <div className="card">
          <h2>Risk Score</h2>
          <h1>78/100</h1>
        </div>
      </div>

      <div className="card">
        <h2>Recent Contracts</h2>

        <ul>
          <li>Contract #C001 — ₹10,00,000</li>
          <li>Contract #C002 — ₹5,00,000</li>
          <li>Contract #C003 — ₹10,00,000</li>
        </ul>
      </div>

      <div className="card">
        <h2>Departments</h2>
        <p>Public Works Department</p>
        <p>Procurement Department</p>
      </div>
    </div>
  );
}

export default VendorProfile;