import AddProblemForm from "./components/progressData/addProblemForm"
import CFDashboard from "./components/Dashboards/CFDashboard"
import GoalProgress from "./components/progressData/GoalProgress"
import LeetcodeDashboard from "./components/Dashboards/LeetcodeDashboard"
import RatingCharts from "./components/RatingChart/CodeforcesRating"
import CodechefDashboard from "./components/Dashboards/CodechefDashboard"


function App() {

  return (
    <div>
      <CFDashboard handle="Vasu.609"/>
      <AddProblemForm/>
      <GoalProgress/>
      <RatingCharts handle="Vasu.609"/>
      <LeetcodeDashboard handle="VasuS609"/>
      <CodechefDashboard handle="vash609"/>
    </div>
  )
  
}

export default App
