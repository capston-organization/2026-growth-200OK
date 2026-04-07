// src/pages/AuthCallback.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiUrl } from "../config/api";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sendCodeToBackend = async (realCode) => {
      try {
        const response = await fetch(apiUrl("/auth/google"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: realCode }),
        });

        if (response.ok) {
          const loginBody = await response.json().catch(() => null);
          const accessToken = response.headers.get("Authorization") || "";
          if (accessToken) {
            const cleanToken = accessToken.replace("Bearer ", "");
            localStorage.setItem("accessToken", cleanToken);
            if (loginBody?.onboardingCompleted) {
              navigate("/main", {
                state: { userName: loginBody?.userName || "사용자" },
              });
            } else {
              navigate("/onboarding", {
                state: { userName: loginBody?.userName || "사용자" },
              });
            }
            return;
          }
          navigate("/");
        } else {
          console.error("백엔드에서 거절함. 상태 코드:", response.status);
          navigate("/");
        }
      } catch (error) {
        console.error("통신 에러:", error);
        navigate("/");
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
      <h2>구글 로그인 처리 중입니다...</h2>
    </div>
  );
};

export default AuthCallback;
