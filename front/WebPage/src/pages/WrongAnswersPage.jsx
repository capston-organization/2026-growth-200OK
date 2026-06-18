import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiUrl } from "../config/api";
import LearningVillageLogoImage from "../assets/images/Learning_Village_Logo_ImageOnly.png";
import LearningVillageLogoText from "../assets/images/Learning_Village_Logo_TextOnly.png";

const CATEGORY_LABEL = {
  WORD: "영단어",
  GRAMMAR: "영문법",
};

const safeParseJson = async (res, apiName) => {
  const contentType = res.headers.get("content-type") || "";
  const rawText = await res.text();

  if (!contentType.includes("application/json")) {
    console.warn(`[${apiName}] JSON이 아닌 응답 수신`, {
      status: res.status,
      contentType,
      preview: rawText.slice(0, 120),
      url: res.url,
    });
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    console.warn(`[${apiName}] JSON 파싱 실패`, {
      status: res.status,
      preview: rawText.slice(0, 120),
      url: res.url,
    });
    return null;
  }
};

const WrongAnswersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initial = location.state || {};

  const userName = initial.userName || "사용자";

  const [filterCategory, setFilterCategory] = useState(
    initial.filterCategory || "",
  );
  const [filterScope, setFilterScope] = useState(initial.filterScope || "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchList = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    const params = new URLSearchParams();
    if (filterCategory) params.set("category", filterCategory);
    if (filterScope.trim()) params.set("scope", filterScope.trim());
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);

    const qs = params.toString();
    const path =
      qs.length > 0
        ? `/analysis/me/wrong-answers?${qs}`
        : "/analysis/me/wrong-answers";

    try {
      setIsLoading(true);
      const res = await fetch(apiUrl(path), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        setItems([]);
        return;
      }

      const data = await safeParseJson(res, "wrongAnswers");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.error("wrong-answers fetch error:", e);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    navigate,
    filterCategory,
    filterScope,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }
    fetchList();
  }, []);

  const handleSearch = () => {
    fetchList();
  };

  return (
    <div
      style={{
        paddingTop: "40px",
        minHeight: "100vh",
        backgroundColor: "#E6F7FF",
        boxSizing: "border-box",
      }}
    >
      <div className="navbar" style={{ justifyContent: "space-between" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
            zIndex: 2,
          }}
        >
          <img
            src={LearningVillageLogoImage}
            alt=""
            style={{ height: 56, width: "auto", display: "block" }}
          />
          <img
            src={LearningVillageLogoText}
            alt="learning village"
            style={{ height: 40, width: "auto", display: "block" }}
          />
        </div>

        <div
          className="nav-menu"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(calc(-40%))",
            marginLeft: 0,
            marginRight: 0,
            zIndex: 1,
          }}
        >
          <span
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/main", { state: { userName } })}
          >
            Home
          </span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/create-game", { state: { userName } })}
          >
            게임 만들기
          </span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/analyze", { state: { userName } })}
          >
            분석하기
          </span>
          <span
            style={{
              color: "#FF69B4",
              fontWeight: "bold",
              marginLeft: "20px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/mypage", { state: { userName } })}
          >
            [{userName} 님]
          </span>
        </div>

        <div
          style={{
            width: 40,
            height: 40,
            background: "#ddd",
            borderRadius: "50%",
            flexShrink: 0,
            zIndex: 2,
          }}
        />
      </div>

      <div
        className="page-container"
        style={{
          alignItems: "stretch",
          paddingTop: "120px",
          paddingBottom: "60px",
        }}
      >
        <div
          className="white-box"
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            borderRadius: "30px",
            border: "2px solid #FFB3BA",
            background: "#FFFFFF",
            padding: "30px 36px 40px",
            textAlign: "left",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.04)",
          }}
        >
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#FF8E99",
              margin: "8px 0 20px",
            }}
          >
            틀린 문제 조회
          </h1>
          <p style={{ fontSize: "18px", color: "#666", marginBottom: "24px" }}>
            과목·학습 범위·날짜로 필터링해 오답 목록을 볼 수 있어요.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "flex-end",
              marginBottom: "24px",
              padding: "16px",
              background: "#FFF8FA",
              borderRadius: "16px",
              border: "1px dashed #F8BBD0",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "14px", color: "#555" }}>과목</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "12px",
                  border: "2px solid #F8BBD0",
                  fontSize: "16px",
                }}
              >
                <option value="">전체</option>
                <option value="WORD">영단어</option>
                <option value="GRAMMAR">영문법</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "14px", color: "#555" }}>학습 범위</span>
              <input
                type="text"
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
                placeholder="예: 시제"
                style={{
                  padding: "8px 12px",
                  borderRadius: "12px",
                  border: "2px solid #F8BBD0",
                  fontSize: "16px",
                  minWidth: "140px",
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "14px", color: "#555" }}>시작일</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "12px",
                  border: "2px solid #F8BBD0",
                  fontSize: "16px",
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "14px", color: "#555" }}>종료일</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "12px",
                  border: "2px solid #F8BBD0",
                  fontSize: "16px",
                }}
              />
            </label>
            <button
              type="button"
              className="primary-btn"
              style={{ marginBottom: 0 }}
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? "불러오는 중…" : "조회"}
            </button>
          </div>

          {isLoading && items.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                fontSize: "20px",
                color: "#777",
              }}
            >
              목록을 불러오는 중이에요…
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                fontSize: "20px",
                color: "#777",
                background: "#FAFAFA",
                borderRadius: "16px",
              }}
            >
              조건에 맞는 틀린 문제가 없어요.
            </div>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {items.map((row) => (
                <li
                  key={`${row.problemId}-${row.wrongDate}-${row.gameId}`}
                  style={{
                    border: "1px solid #F8BBD0",
                    borderRadius: "16px",
                    padding: "16px 18px",
                    background: "#FFFBFC",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px 16px",
                      marginBottom: "10px",
                      fontSize: "15px",
                      color: "#666",
                    }}
                  >
                    <span>
                      <strong>과목</strong>{" "}
                      {CATEGORY_LABEL[row.category] || row.category}
                    </span>
                    <span>
                      <strong>범위</strong> {row.scope || "—"}
                    </span>
                    <span>
                      <strong>날짜</strong> {row.wrongDate || "—"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: "8px",
                      lineHeight: 1.45,
                    }}
                  >
                    {row.question || "(문항 없음)"}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: "32px" }}>
            <button
              type="button"
              style={{
                borderRadius: "24px",
                border: "2px solid #FFB3BA",
                background: "#FFEAF0",
                padding: "12px 28px",
                fontSize: "20px",
                fontWeight: "600",
                cursor: "pointer",
                color: "#FF8E99",
              }}
              onClick={() =>
                navigate("/analyze", { state: { userName } })
              }
            >
              분석 페이지로
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WrongAnswersPage;
