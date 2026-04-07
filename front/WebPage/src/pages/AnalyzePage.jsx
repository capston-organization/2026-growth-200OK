import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiUrl } from "../config/api";
import LearningVillageLogoImage from "../assets/images/Learning_Village_Logo_ImageOnly.png";
import LearningVillageLogoText from "../assets/images/Learning_Village_Logo_TextOnly.png";

const AnalyzePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = location.state?.userName || "사용자";

  // 현재 선택된 분석 카테고리: WORD(영단어) / GRAMMAR(영문법)
  const [activeCategory, setActiveCategory] = useState("WORD");

  const rankColors = ["#FF8E99", "#FFB3BA", "#FFE0E5"];
  const [weakTop3, setWeakTop3] = useState([
    "which/who/that의 구분",
    "동의어 맞추기",
    "it ~ to v 문법",
  ]);
  const [scopeWrongRates, setScopeWrongRates] = useState({
    WORD: [],
    GRAMMAR: [],
  });
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const categoryStyle = {
    WORD: {
      label: "영단어",
      panelBg: "#EDE7F6",
      barColor: "linear-gradient(135deg, rgba(103,58,183,0.45), rgba(156,39,176,0.8))",
      toggleBorder: "2px solid #B39DDB",
      toggleBg: "#EDE7F6",
    },
    GRAMMAR: {
      label: "영문법",
      panelBg: "#FFF9C4",
      barColor: "linear-gradient(135deg, rgba(255,193,7,0.45), rgba(255,160,0,0.85))",
      toggleBorder: "2px solid #FFECB3",
      toggleBg: "#FFF8E1",
    },
  };

  const current = categoryStyle[activeCategory];
  const currentWrongRates = useMemo(
    () => scopeWrongRates[activeCategory] || [],
    [activeCategory, scopeWrongRates],
  );
  const hasAnyWrongData = useMemo(() => {
    if (detail && typeof detail.totalWrongCount === "number") {
      return detail.totalWrongCount > 0;
    }
    return (
      (scopeWrongRates.WORD && scopeWrongRates.WORD.length > 0) ||
      (scopeWrongRates.GRAMMAR && scopeWrongRates.GRAMMAR.length > 0)
    );
  }, [detail, scopeWrongRates]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const commonHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
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

    const fetchAnalyzeData = async () => {
      try {
        setIsLoading(true);
        const [overviewRes, detailRes] = await Promise.all([
          fetch(apiUrl("/analysis/me/overview"), {
            method: "GET",
            headers: commonHeaders,
          }),
          fetch(apiUrl("/analysis/me/detail"), {
            method: "GET",
            headers: commonHeaders,
          }),
        ]);

        if (overviewRes.ok) {
          const overview = await safeParseJson(overviewRes, "analysisOverview");
          if (overview?.weakTop3?.length) {
            setWeakTop3(overview.weakTop3.slice(0, 3));
          }
          if (Array.isArray(overview?.scopeWrongRates)) {
            const grouped = { WORD: [], GRAMMAR: [] };
            overview.scopeWrongRates.forEach((row) => {
              if (row?.category === "WORD" || row?.category === "GRAMMAR") {
                grouped[row.category] = Array.isArray(row.scopes) ? row.scopes : [];
              }
            });
            setScopeWrongRates(grouped);
          }
        }

        if (detailRes.ok) {
          const detailData = await safeParseJson(detailRes, "analysisDetail");
          if (detailData) setDetail(detailData);
        }
      } catch (e) {
        console.error("Failed to fetch analyze data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyzeData();
  }, []);

  const handleBack = () => {
    navigate("/main", { state: { userName } });
  };

  const handleClickWrongAnswers = (scope) => {
    navigate("/mypage", {
      state: {
        userName,
        openSection: "wrong-answers",
        source: "analyze",
        filterCategory: activeCategory,
        filterScope: scope,
      },
    });
  };

  const handleCreateReviewGame = async (scope) => {
    if (isCreating) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      setIsCreating(true);
      const res = await fetch(apiUrl("/analysis/me/review-games"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: activeCategory,
          scope,
        }),
      });

      if (!res.ok) {
        alert("복습 게임 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }

      const data = await res.json();
      navigate("/play", {
        state: {
          userName,
          source: "analyze",
          status: data?.status || "PREPARING",
          gameId: data?.gameId || null,
          scope,
        },
      });
    } catch (e) {
      console.error("Failed to create review game:", e);
      alert("복습 게임 생성 중 오류가 발생했어요.");
    } finally {
      setIsCreating(false);
    }
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
      {/* 상단 네비게이션 바 (GameCreationPage와 동일) */}
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
            onClick={() => navigate("/main", { state: { userName } })}
          >
            공유하기
          </span>
          <span
            style={{
              fontWeight: "bold",
              color: "#333",
              borderBottom: "3px solid rgb(240, 110, 151)",
              paddingBottom: "5px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/analyze", { state: { userName } })}
          >
            분석하기
          </span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/main", { state: { userName } })}
          >
            육성하기
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

      {/* 메인 컨텐츠 */}
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
            maxWidth: "1300px",
            margin: "0 auto",
            borderRadius: "30px",
            border: "2px solid #FFB3BA",
            background: "#FFFFFF",
            padding: "30px 40px 40px",
            textAlign: "left",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* 제목 영역 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginTop: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "40px",
                fontWeight: "700",
                color: "#FF8E99",
              }}
            >
              {userName}님의 게임 분석 레포트
            </div>
            {/* 말풍선 아이콘 영역 (와이어프레임 우측 아이콘 느낌) */}
            <div
              style={{
                width: "32px",
                height: "24px",
                borderRadius: "12px",
                border: "2px solid #F8BBD0",
                background: "#FFE4EF",
              }}
            />
          </div>

          {/* 상단 서머리 영역 */}
          <div
            style={{
              background: "#FFE3EC",
              borderRadius: "20px",
              padding: "18px 24px",
              fontSize: "24px",
              fontWeight: "600",
              marginTop: "32px",
              marginBottom: "32px",
            }}
          >
            {isLoading
              ? "분석 데이터를 불러오는 중이에요..."
              : "가장 취약한 범위를 확인하고, 바로 복습 게임을 만들 수 있어요."}
          </div>

          {detail && (
            <div
              style={{
                background: "#FFF7F9",
                borderRadius: "20px",
                padding: "16px 20px",
                border: "1px solid #FFE0EB",
                marginBottom: "24px",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: "600" }}>
                시도 {detail.totalAttempts ?? 0}회
              </div>
              <div style={{ fontSize: "18px", fontWeight: "600" }}>
                오답률 {detail.wrongRate ?? 0}%
              </div>
              <div style={{ fontSize: "18px", fontWeight: "600" }}>
                평균 풀이시간 {detail.avgResponseTimeMs ?? 0}ms
              </div>
              <div style={{ fontSize: "18px", fontWeight: "600" }}>
                힌트 사용률 {detail.hintUseRate ?? 0}%
              </div>
            </div>
          )}

          {/* 본문 2단 레이아웃 */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              alignItems: "flex-start",
              marginLeft: "32px",
              marginRight: "16px",
            }}
          >
            {/* 왼쪽: 취약한 학습 내용 랭킹 */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>✔</span>
                  <span>취약한 학습 범위</span>
                </div>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#777",
                  }}
                >
                  TOP 3
                </span>
              </div>
              {/* 랭킹 리스트 */}

              {weakTop3.map((title, index) => (
                <div
                  key={title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: rankColors[index],
                    borderRadius: "16px",
                    padding: "12px 18px",
                    marginBottom: "10px",
                    color: "#333",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "24px",
                        width: "32px",
                        textAlign: "center",
                        fontWeight: "700",
                      }}
                    >
                      {index + 1}
                    </span>
                    <span
                      style={{
                        fontSize: "24px",
                        fontWeight: "600",
                      }}
                    >
                      {title}
                    </span>
                  </div>
                  <button
                    style={{
                      borderRadius: "20px",
                      border: "2px solid #FF8E99",
                      background: "white",
                      padding: "6px 14px",
                      fontSize: "18px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      handleCreateReviewGame(title);
                    }}
                  >
                    복습 게임 생성하기
                  </button>
                </div>
              ))}
            </div>

            {/* 오른쪽: 슬라이더 + 오답률 그래프 */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* 상단 슬라이더(카테고리 토글) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "12px",
                  gap: "8px",
                }}
              >
                <button
                  style={{
                    padding: "4px 12px",
                    borderRadius: "16px",
                      border:
                        activeCategory === "WORD"
                          ? categoryStyle.WORD.toggleBorder
                          : "1px solid #DDD",
                    backgroundColor:
                        activeCategory === "WORD"
                          ? categoryStyle.WORD.toggleBg
                          : "white",
                    fontSize: "20px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveCategory("WORD")}
                >
                  영단어
                </button>
                <button
                  style={{
                    padding: "4px 12px",
                    borderRadius: "16px",
                      border: activeCategory === "GRAMMAR"
                        ? categoryStyle.GRAMMAR.toggleBorder
                        : "1px solid #DDD",
                    backgroundColor:
                        activeCategory === "GRAMMAR"
                          ? categoryStyle.GRAMMAR.toggleBg
                          : "white",
                    fontSize: "20px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveCategory("GRAMMAR")}
                >
                  영문법
                </button>
              </div>

              {/* 그래프 영역 (학습 범위별 오답률, 클릭 시 틀린 문제 페이지로 이동) */}
              <div
                style={{
                  flex: 1,
                  background: current.panelBg,
                  borderRadius: "24px",
                  minHeight: "260px",
                  padding: "18px 16px",
                }}
              >
                  {hasAnyWrongData ? (
                    <>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "700",
                          marginBottom: "14px",
                          color: "#4A4A4A",
                        }}
                      >
                        학습 범위별 오답률 그래프 ({current.label})
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {currentWrongRates.map((item) => (
                          <button
                            key={item.scope}
                            onClick={() => handleClickWrongAnswers(item.scope)}
                            style={{
                              border: "none",
                              width: "100%",
                              background: "rgba(255, 255, 255, 0.72)",
                              borderRadius: "14px",
                              padding: "10px 12px",
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "8px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "18px",
                                  fontWeight: "600",
                                  color: "#333",
                                }}
                              >
                                {item.scope}
                              </span>
                              <span
                                style={{
                                  fontSize: "18px",
                                  fontWeight: "700",
                                  color: "#555",
                                }}
                              >
                                {item.wrongRate}%
                              </span>
                            </div>
                            <div
                              style={{
                                height: "12px",
                                borderRadius: "999px",
                                background: "rgba(255,255,255,0.65)",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${item.wrongRate}%`,
                                  height: "100%",
                                  borderRadius: "999px",
                                  background: current.barColor,
                                }}
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        minHeight: "230px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        fontWeight: "600",
                        color: "#777",
                        textAlign: "center",
                      }}
                    >
                      아직 오답 데이터가 없어서 그래프를 표시하지 않아요.
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* 하단 버튼 영역 */}
          <div
            style={{
              marginTop: "40px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              style={{
                borderRadius: "24px",
                border: "2px solid #FFB3BA",
                background: "#FFEAF0",
                padding: "12px 28px",
                fontSize: "24px",
                fontWeight: "600",
                cursor: "pointer",
                color: "#FF8E99",
              }}
              onClick={handleBack}
            >
              메인으로 돌아가기
            </button>

            <button
              style={{
                borderRadius: "24px",
                border: "2px solid #F8BBD0",
                background: "#FFE4F1",
                padding: "12px 28px",
                fontSize: "22px",
                fontWeight: "700",
                cursor: "pointer",
                color: "#D36BA3",
              }}
              onClick={() => handleCreateReviewGame(weakTop3[0])}
              disabled={isCreating}
            >
              {isCreating
                ? "복습 게임 생성 중..."
                : `${weakTop3[0]} 복습 게임 만들기`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzePage;
