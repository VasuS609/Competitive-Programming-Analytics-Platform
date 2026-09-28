import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboards/Dashboard";
import DetailedData from "./pages/DetailedData/DetailedData";

function App() {
  return (
    <>
      <nav className="app-navigation" aria-label="Primary navigation">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "active" : "")}
          end
        >
          Home
        </NavLink>
        <NavLink
          to="/detailed"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Detailed data
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/detailed" element={<DetailedData />} />
      </Routes>
    </>
  );
}
export default App;