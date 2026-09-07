import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import ProjectDetails from "./pages/ProjectDetails";

function App() {
  return (
    <div className="min-h-screen bg-[#090D0B] text-white">
      
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/projects" element={<Projects />} />

          <Route
            path="/projects/create"
            element={<CreateProject />}
          />

          <Route
            path="/projects/:id"
            element={<ProjectDetails />}
          />
        </Routes>
      </main>

    </div>
  );
}

export default App;