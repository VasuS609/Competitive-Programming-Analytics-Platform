
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
    </div>

    
  );
}
export default App;