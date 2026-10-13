
import Dashboard from "./pages/Dashboards/Dashboard";
import DetailedData from "./pages/DetailedData/DetailedData";
import { Route, Routes } from "react-router-dom";


function App() {
  return (

    <div>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/detailed" element={<DetailedData />} />
      </Routes>      
      <section className="content-panel heat-map-panel">
        <h3>Submission heat map</h3>
        <div id="heat-map" data-heat-js="{ 'defaultView': 'map' }"></div>
      </section>
    </div>

    
  );
}
export default App;