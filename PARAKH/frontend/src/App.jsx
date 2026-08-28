import {Link, Route, Routes} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Contracts from "./pages/Contracts";
import Network from "./pages/Network";

function Shell({children}) {
  return <div className="app">
    <header className="topbar">
      <Link to="/" className="brand">PARAKH</Link>
      <nav><Link to="/">Dashboard</Link><Link to="/contracts">Contracts</Link><Link to="/network">Network</Link></nav>
    </header>
    <main>{children}</main>
  </div>;
}

export default function App() {
  return <Shell><Routes>
    <Route path="/" element={<Dashboard />}/>
    <Route path="/contracts" element={<Contracts />}/>
    <Route path="/contracts/:id" element={<section className="card"><div className="eyebrow">FOUNDATION SCAFFOLD</div><h1>Contract Investigation</h1><p>CRS, risk flags, evidence, NLP and optional blockchain record.</p></section>}/>
    <Route path="/vendors/:id" element={<section className="card"><div className="eyebrow">FOUNDATION SCAFFOLD</div><h1>Vendor Profile</h1><p>Contracts, total value, departments, average CRS and network connections.</p></section>}/>
    <Route path="/departments/:id" element={<section className="card"><div className="eyebrow">FOUNDATION SCAFFOLD</div><h1>Department Profile</h1><p>Vendor concentration, risk trend and network.</p></section>}/>
    <Route path="/network" element={<Network />}/>
  </Routes></Shell>;
}
