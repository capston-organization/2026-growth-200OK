import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = location.state?.userName || "사용자";

  return (
    <div className="page-container" style={{ backgroundColor: "#FFF0F5" }}>
      <div
        className="white-box"
        style={{
          maxWidth: "900px",
          minHeight: "420px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "16px",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#ff6e86", fontSize: "38px", margin: 0 }}>
          {userName}님, 환영해요!
        </h2>
        <p style={{ fontSize: "24px", color: "#555", margin: 0 }}>
          더 정확한 개인 분석을 위해 기본 정보를 먼저 입력해주세요.
        </p>
        <div style={{ marginTop: "18px" }}>
          <button
            className="btn-primary"
            onClick={() => navigate("/signup", { state: { userName } })}
          >
            온보딩 시작하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
