import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import RoomPlannerPage from "./pages/RoomPlannerPage";
import AIInteriorPage from "./pages/AIInteriorPage";
import FindHousePage from "./pages/FindHousePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import RecommendationPage from "./pages/RecommendationPage";
import DetailPage from "./pages/DetailPage";
import CategoryPage from "./pages/Category";

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room-planner" element={<RoomPlannerPage />} />
            <Route path="/ai-interior" element={<AIInteriorPage />} />
            <Route path="/find-house" element={<FindHousePage />} />
            <Route path="/recommend" element={<RecommendationPage/>} />
            <Route path="/detail/:propertyId" element={<DetailPage/>} />
            <Route path="/category" element={<CategoryPage/>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;