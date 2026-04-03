import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LearningVillageLogoImage from "../assets/images/Learning_Village_Logo_ImageOnly.png";
import LearningVillageLogoText from "../assets/images/Learning_Village_Logo_TextOnly.png";

const AnalyzePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = location.state?.userName || "사용자";

  // 현재 선택된 분석 카테고리: WORD(영단어) / GRAMMAR(영문법)
  const [activeCategory, setActiveCategory] = useState("WORD");

  const wordTopics = ["뜻 맞추기", "맥락에 맞는 단어 찾기", "동의어 찾기"];
  const grammarTopics = ["조건문", "가주어 it", "소유격"];
  const currentTopics = activeCategory === "WORD" ? wordTopics : grammarTopics;
  const rankColors = ["#FF8E99", "#FFB3BA", "#FFE0E5"];

  const handleBack = () => {
    navigate("/main", { state: { userName } });
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
            총 3분 동안 플레이했어요!
          </div>

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
                  <span>취약한 학습 내용 랭킹</span>
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

              {currentTopics.map((title, index) => (
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
                      navigate("/create-game", { state: { userName } });
                    }}
                  >
                    관련 게임 생성하기
                  </button>
                </div>
              ))}
            </div>

            {/* 오른쪽: 슬라이더 + 그래프 이미지 플레이스홀더 */}
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
                        ? "2px solid #B39DDB"
                        : "1px solid #DDD",
                    backgroundColor:
                      activeCategory === "WORD" ? "#EDE7F6" : "white",
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
                    border:
                      activeCategory === "GRAMMAR"
                        ? "2px solid #FFECB3"
                        : "1px solid #DDD",
                    backgroundColor:
                      activeCategory === "GRAMMAR" ? "#FFF8E1" : "white",
                    fontSize: "20px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveCategory("GRAMMAR")}
                >
                  영문법
                </button>
              </div>

              {/* 그래프 영역 (카테고리에 따라 색/모양 변경) */}
              <div
                style={{
                  flex: 1,
                  background: activeCategory === "WORD" ? "#EDE7F6" : "#FFF9C4",
                  borderRadius: "24px",
                  minHeight: "260px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* 간단한 더미 그래프 모양 */}
                {activeCategory === "WORD" ? (
                  <div
                    style={{
                      position: "absolute",
                      left: "10%",
                      right: "10%",
                      bottom: "18%",
                      height: "40%",
                      borderRadius: "16px",
                      background:
                        "linear-gradient(135deg, rgba(103,58,183,0.4), rgba(156,39,176,0.7))",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      left: "12%",
                      right: "12%",
                      bottom: "20%",
                      height: "40%",
                      borderRadius: "16px",
                      background:
                        "linear-gradient(135deg, rgba(255,193,7,0.4), rgba(255,160,0,0.8))",
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 하단 버튼 영역 */}
          <div
            style={{
              marginTop: "40px",
              display: "flex",
              justifyContent: "flex-start",
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
              게임 통계 출력하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzePage;
