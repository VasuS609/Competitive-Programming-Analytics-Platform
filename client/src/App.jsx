import AddProblemForm from "./components/addProblemForm"
import CFDashboard from "./components/CFDashboard"
import GoalProgress from "./components/GoalProgress"
import LeetcodeDashboard from "./components/LeetcodeDashboard"
import RatingCharts from "./components/RatingCharts"


function App() {

  return (
    <div>
      <CFDashboard handle="Vasu.609"/>
      <AddProblemForm/>
      <GoalProgress/>
      <RatingCharts handle="Vasu.609"/>
      <LeetcodeDashboard handle="VasuS609"/>
    </div>
  )
  
}

export default App
