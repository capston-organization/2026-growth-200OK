// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import OnboardingPage from "./pages/OnboardingPage";
import SignUpPage from "./pages/SignUpPage";
import GameCreationPage from "./pages/GameCreationPage";
import GamePlayPage from "./pages/GamePlayPage";
import AnalyzePage from "./pages/AnalyzePage";
import WrongAnswersPage from "./pages/WrongAnswersPage";
import MyPage from "./pages/MyPage";
import MainPage from "./pages/MainPage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/create-game" element={<GameCreationPage />} />
        <Route path="/play" element={<GamePlayPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/wrong-answers" element={<WrongAnswersPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </Router>
  );
}

export default App;
