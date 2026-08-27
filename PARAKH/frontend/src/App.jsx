import {Link, Route, Routes} from "react-router-dom";

function Shell({children}) {
  return <div className="app">
    <header className="topbar">
      <Link to="/" className="brand">PARAKH</Link>
      <nav><Link to="/">Dashboard</Link><Link to="/contracts">Contracts</Link><Link to="/network">Network</Link></nav>
    </header>
    <main>{children}</main>
  </div>;
}

function Placeholder({title, text}) {
  return <section className="card">
    <div className="eyebrow">FOUNDATION SCAFFOLD</div>
    <h1>{title}</h1><p>{text}</p>
  </section>;
}

export default function App() {
  return <Shell><Routes>
    <Route path="/" element={<Placeholder title="Procurement Risk Dashboard" text="Person 2: connect dashboard KPIs, charts, filters and recent high-risk contracts."/>}/>
    <Route path="/contracts" element={<Placeholder title="Contracts" text="Person 2: build searchable, sortable, paginated contract table."/>}/>
    <Route path="/contracts/:id" element={<Placeholder title="Contract Investigation" text="CRS, risk flags, evidence, NLP and optional blockchain record."/>}/>
    <Route path="/vendors/:id" element={<Placeholder title="Vendor Profile" text="Contracts, total value, departments, average CRS and network connections."/>}/>
    <Route path="/departments/:id" element={<Placeholder title="Department Profile" text="Vendor concentration, risk trend and network."/>}/>
    <Route path="/network" element={<Placeholder title="Vendor ↔ Department Network" text="Person 4: connect /api/network to Cytoscape.js."/>}/>
  </Routes></Shell>;
}
