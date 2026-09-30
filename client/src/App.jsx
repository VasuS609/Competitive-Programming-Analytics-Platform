
import Dashboard from "./pages/Dashboards/Dashboard";
import DetailedData from "./pages/DetailedData/DetailedData";
import { Route, Routes } from "react-router-dom";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/detailed" element={<DetailedData />} />
    </Routes>
  );
}
export default App;