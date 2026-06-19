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
        console.log("백엔드로 진짜 코드를 전송합니다...", realCode);
        // vite 프록시가 /auth/google 을 가로채서 백엔드로 보냅니다!
        const response = await fetch(apiUrl("/auth/google"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: realCode }),
        });

        if (response.ok) {
          const accessToken = response.headers.get("Authorization");
          const authHeader = response.headers.get("Authorization");
          const body = await response
            .clone()
            .json()
            .catch(() => null);
          console.log("[auth/google] 헤더 Authorization 있음:", !!authHeader);
          console.log(
            "[auth/google] 본문 accessToken 있음:",
            !!(body && body.accessToken),
          );
          let bodyHasAccessTokenField = false;

          try {
            const body = await response.clone().json();
            bodyHasAccessTokenField =
              !!body &&
              typeof body.accessToken === "string" &&
              body.accessToken.length > 0;
          } catch {
            bodyHasAccessTokenField = false;
          }
          // #region agent log
          fetch(
            "http://127.0.0.1:7799/ingest/32d44241-1ed0-4af0-9c5b-dce23183abf7",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "fca452",
              },
              body: JSON.stringify({
                sessionId: "fca452",
                runId: "pre-fix",
                hypothesisId: "H1-H4",
                location: "AuthCallback.jsx:auth/google-ok",
                message: "after auth/google success",
                data: {
                  hasAuthHeader: !!accessToken,
                  bodyHasAccessTokenField,
                  httpStatus: response.status,
                },
                timestamp: Date.now(),
              }),
            },
          ).catch(() => {});
          // #endregion
          console.log("로그인 성공! AccessToken:", accessToken);

          // localStorage에 액세스 토큰 저장하기
          if (accessToken) {
            // "Bearer " 글자를 떼어내고 토큰 값만 저장합니다.
            const cleanToken = accessToken.replace("Bearer ", "");
            localStorage.setItem("accessToken", cleanToken);
            console.log("토큰 저장 완료!");
          }

          // #region agent log
          fetch(
            "http://127.0.0.1:7799/ingest/32d44241-1ed0-4af0-9c5b-dce23183abf7",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "fca452",
              },
              body: JSON.stringify({
                sessionId: "fca452",
                runId: "pre-fix",
                hypothesisId: "H1-H2",
                location: "AuthCallback.jsx:after-store",
                message: "token store attempt from header only",
                data: {
                  storedFromHeader: !!accessToken,
                  lsHasKey: !!localStorage.getItem("accessToken"),
                  lsLen: (localStorage.getItem("accessToken") || "").length,
                },
                timestamp: Date.now(),
              }),
            },
          ).catch(() => {});
          // #endregion

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
      <h2>구글 로그인 처리 중입니다...</h2>
    </div>
  );
};

export default AuthCallback;
