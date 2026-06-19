// src/pages/LoginPage.jsx
import React, { useEffect } from "react";
// useNavigate: React Router에서 제공하는 '페이지 이동'을 담당하는 함수(Hook)입니다.
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import LearningVillageLogo from "../assets/images/Learning_Village_Logo.png";
import GoogleLogo from "../assets/images/google_logo.png";

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const resolveOnboarding = async () => {
      try {
        const res = await fetch(apiUrl("/auth/me"), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const me = await res.json().catch(() => null);
        if (!me) return;
        if (me.onboardingCompleted) {
          navigate("/main", { state: { userName: me.name || "사용자" } });
        } else {
          navigate("/onboarding", { state: { userName: me.name || "사용자" } });
        }
      } catch (e) {
        console.error("Failed to resolve onboarding route:", e);
      }
    };

    resolveOnboarding();
  }, [navigate]);

  // ==========================================
  // 🏃‍♂️ 1단계: 구글 로그인 창으로 이동시키는 함수
  // ==========================================
  const handleGoogleLogin = () => {
    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();
    const fromEnv = (import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? "").trim();
    const redirectUri =
      fromEnv || `${window.location.origin}/auth/callback`;

    if (!clientId) {
      window.alert(
        "Google 클라이언트 ID가 설정되지 않았습니다. .env의 VITE_GOOGLE_CLIENT_ID를 확인하세요.",
      );
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "email profile",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    // style={{ ... }}: CSS 파일에 적지 않고, 직접 자바스크립트 객체로 스타일을 주는 방식(Inline Style)입니다.
    // 간단한 수정은 여기서 바로 할 수 있습니다.
    <div className="page-container" style={{ backgroundColor: "#FFF0F5" }}>
      {/* 흰색 박스 설정 */}
      <div
        className="white-box"
        style={{
          maxWidth: "1000px",
          height: "600px",
          display: "flex", // 내부 요소 정렬을 위해 Flexbox 사용
          flexDirection: "column", // 요소들을 세로로 배치
          justifyContent: "center", // 세로 기준 중앙 정렬
        }}
      >
        {/* 로고 이미지 */}
        <img
          src={LearningVillageLogo}
          alt="learning village 로고"
          style={{
            width: "60%", // 부모 박스(white-box) 가로의 60%
            height: "auto", // 비율 유지하면서 세로 자동
            display: "block", // margin: auto가 적용되도록 block 처리
            margin: "0 auto 20px", // 가로 중앙 정렬 + 아래 여백
          }}
        />

        {/* 구글 로그인 버튼 */}
        <button
          className="btn-primary"
          // 버튼 전용 스타일 오버라이딩 (덮어쓰기)
          style={{
            width: "50%", // 박스 너비의 80%만 차지하게
            height: "18%", // 박스 너비의 20%만 차지하게
            margin: "28px auto", // 위아래 30px 띄우고, 좌우는 자동(중앙정렬)
            display: "flex", // 아이콘과 글자를 가로로 나란히 놓기 위해
            alignItems: "center", // 세로 중앙 정렬
            justifyContent: "center", // 가로 중앙 정렬
            gap: "20px", // 아이콘과 글자 사이 간격
          }}
          // [중요] 클릭 시 '/signup' 주소로 이동! (React Router가 처리함)
          onClick={handleGoogleLogin}
        >
          {/* 구글 로고 아이콘 */}
          <img
            src={GoogleLogo}
            alt="Google logo"
            style={{ width: 50, height: 50, borderRadius: "50%" }}
          />

          {/* 버튼 텍스트 */}
          <h4 style={{ fontSize: "28px", color: "rgb(240, 110, 151)" }}>
            Google로 시작하기
          </h4>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
