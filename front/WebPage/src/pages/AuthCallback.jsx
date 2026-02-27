// src/pages/AuthCallback.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sendCodeToBackend = async (realCode) => {
      try {
        console.log("백엔드로 진짜 코드를 전송합니다...", realCode);
        // vite 프록시가 /auth/google 을 가로채서 백엔드로 보냅니다!
        const response = await fetch("/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: realCode }),
        });

        if (response.ok) {
          const accessToken = response.headers.get("Authorization");
          console.log("로그인 성공! AccessToken:", accessToken);

          // localStorage에 액세스 토큰 저장하기
          if (accessToken) {
            // "Bearer " 글자를 떼어내고 토큰 값만 저장합니다.
            const cleanToken = accessToken.replace("Bearer ", "");
            localStorage.setItem("accessToken", cleanToken);
            console.log("토큰 저장 완료!");
          }

          navigate("/signup");
        } else {
          console.error("백엔드에서 거절함. 상태 코드:", response.status);
        }
      } catch (error) {
        console.error("통신 에러:", error);
      }
    };

    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");

    if (code) {
      sendCodeToBackend(code);
    }
  }, [location, navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <h2>구글 로그인 처리 중입니다... 빙글빙글 🌀</h2>
    </div>
  );
};

export default AuthCallback;
