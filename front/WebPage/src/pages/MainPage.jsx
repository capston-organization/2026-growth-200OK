import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MainPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userName = location.state?.userName || "사용자";

  const handleNavClick = (target) => {
    if (target === "home") {
      navigate("/main", { state: { userName } });
    } else if (target === "create") {
      navigate("/create-game", { state: { userName } });
    } else {
      // 아직 페이지가 없으므로 모두 메인으로
      navigate("/main", { state: { userName } });
    }
  };

  /* 스트릭 개수 정하는 변수 (기본값, API 실패 시 Fallback)*/
  const streakDays = Array.from({ length: 123 }, (_, index) => index);

  // 스트릭 API 데이터
  const [streakDates, setStreakDates] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // 최근 플레이 게임 5개
  const [recentGames, setRecentGames] = useState([]);

  // 게임 상세 팝업 모달 상태
  const [selectedGame, setSelectedGame] = useState(null);

  // 인삿말(히어로 섹션) 메시지 상태
  const [greetingMessage, setGreetingMessage] =
    useState("집중 모드 ON! 오늘도 파이팅!");
  const [isGreetingLoading, setIsGreetingLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const commonHeaders = {
      Authorization: `Bearer ${token}`,
    };

    const fetchGreeting = async () => {
      try {
        setIsGreetingLoading(true);
        const res = await fetch("/users/me/greeting", {
          method: "GET",
          headers: commonHeaders,
        });

        if (!res.ok) {
          setIsGreetingLoading(false);
          return;
        }

        const data = await res.json();
        if (data && data.message) {
          setGreetingMessage(data.message);
        }
      } catch (e) {
        console.error("Failed to fetch greeting:", e);
      } finally {
        setIsGreetingLoading(false);
      }
    };

    const fetchStreak = async () => {
      try {
        const res = await fetch("/users/me/streak?days=365", {
          method: "GET",
          headers: commonHeaders,
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!data || !Array.isArray(data.dates)) return;

        setStreakDates(data.dates);
        if (typeof data.currentStreak === "number") {
          setCurrentStreak(data.currentStreak);
        }

        // dates 배열에서 최장 연속 true 구하기
        let best = 0;
        let cur = 0;
        data.dates.forEach((item) => {
          if (item.played) {
            cur += 1;
            if (cur > best) best = cur;
          } else {
            cur = 0;
          }
        });
        setMaxStreak(best);
      } catch (e) {
        console.error("Failed to fetch streak:", e);
      }
    };

    const fetchRecentGames = async () => {
      try {
        const res = await fetch("/users/me/games/recent", {
          method: "GET",
          headers: commonHeaders,
        });
        if (!res.ok) return;

        const data = await res.json();
        if (data && Array.isArray(data.games)) {
          setRecentGames(data.games.slice(0, 5));
        }
      } catch (e) {
        console.error("Failed to fetch recent games:", e);
      }
    };

    fetchGreeting();
    fetchStreak();
    fetchRecentGames();
  }, []);

  return (
    <div
      style={{
        paddingTop: "40px",
        minHeight: "100vh",
        backgroundColor: "#E6F7FF",
        boxSizing: "border-box",
      }}
    >
      {/* 상단 네비게이션 바 */}
      <div className="navbar">
        {/* 왼쪽 로고 + 텍스트 */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            className="logo-placeholder"
            style={{ width: 40, height: 40, margin: 0, fontSize: "12px" }}
          >
            Logo
          </div>
          <span
            style={{ color: "#FF69B4", fontWeight: "bold", fontSize: "24px" }}
          >
            learning village
          </span>
        </div>

        {/* 중앙 메뉴 */}
        <div className="nav-menu">
          <span
            style={{
              fontWeight: "bold",
              color: "#333",
              borderBottom: "3px solid #FF69B4",
              paddingBottom: "5px",
              cursor: "pointer",
            }}
            onClick={() => handleNavClick("home")}
          >
            Home
          </span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => handleNavClick("create")}
          >
            게임 만들기
          </span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => handleNavClick("share")}
          >
            공유하기
          </span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => handleNavClick("play")}
          >
            게임하기
          </span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => handleNavClick("analysis")}
          >
            분석하기
          </span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => handleNavClick("grow")}
          >
            육성하기
          </span>

          <span
            style={{ color: "#FF69B4", fontWeight: "bold", marginLeft: "20px" }}
          >
            [{userName} 님]
          </span>
        </div>

        {/* 오른쪽 프로필 아이콘 */}
        <div
          style={{
            width: 40,
            height: 40,
            background: "#ddd",
            borderRadius: "50%",
          }}
        ></div>
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
            borderWidth: "4px",
            padding: "30px 40px 40px",
            textAlign: "left",
          }}
        >
          {/* 상단 인삿말 영역 (히어로 섹션) */}
          <div
            style={{
              background: "#FDF5FF",
              borderRadius: "24px",
              height: "220px",
              marginBottom: "30px",
              padding: "30px 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            {/* 왼쪽: 큰 타일 / 프로필 영역 (시안의 큰 사각형 느낌) */}
            <div
              style={{
                width: "180px",
                height: "160px",
                borderRadius: "20px",
                background: "#FFB3BA",
              }}
            />

            {/* 중앙: 인삿말 문구 */}
            <div
              style={{
                flex: 1,
                marginLeft: "40px",
                marginRight: "40px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "24px 40px",
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#333333",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                }}
              >
                {isGreetingLoading
                  ? "인삿말을 불러오는 중이에요..."
                  : greetingMessage}
              </div>
            </div>

            {/* 오른쪽: 작은 포인트 원 (시안 오른쪽 상단 장식 느낌) */}
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#FFE0B2",
                alignSelf: "flex-start",
              }}
            />
          </div>

          {/* 스트릭 패널 */}
          <div
            style={{
              background: "#FFF7F9",
              borderRadius: "20px",
              padding: "20px 24px",
              marginBottom: "30px",
              border: "1px solid #FFE0EB",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
                fontSize: "24px",
                fontWeight: "600",
              }}
            >
              <span style={{ fontSize: "24px", marginRight: "8px" }}>📅</span>
              <span>
                스트릭 : {currentStreak > 0 ? currentStreak : "0"}일째
                공부했어요!
              </span>
            </div>
            <div
              style={{
                display: "flex", // grid 대신 flex 사용
                flexWrap: "wrap", // 공간이 모자라면 다음 줄로 넘어가기
                gap: "8px", // 박스 사이 간격을 일정하게 8px로 고정
                marginBottom: "12px",
              }}
            >
              {(streakDates.length > 0
                ? streakDates
                : streakDays.map((day) => ({ id: day, played: day % 3 === 0 }))
              ).map((item, index) => (
                <div
                  key={item.date || item.id || index}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    backgroundColor: item.played ? "#FF8E99" : "#E0E0E0",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#777",
                marginTop: "4px",
              }}
            >
              최장 {maxStreak > 0 ? maxStreak : "N"}일 연속 공부
            </div>
          </div>

          {/* 가장 많이 틀리는 문제 패널 */}
          <div
            style={{
              background: "#FFF7F7",
              borderRadius: "20px",
              padding: "20px 24px",
              marginBottom: "30px",
              border: "1px solid #FFD1D1",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "24px",
                  fontWeight: "600",
                }}
              >
                <span>✔</span>
                <span>가장 많이 틀리는 문제</span>
              </div>
              <span
                style={{
                  fontSize: "20px",
                  color: "#777",
                  fontWeight: "600",
                }}
              >
                TOP 3
              </span>
            </div>

            {["which/who/that의 구분", "동의어 맞추기", "it ~ to v 문법"].map(
              (title, index) => {
                // 순위에 따른 배경색 지정 (진한색 -> 중간색 -> 연한색)
                const bgColors = ["#FF8E99", "#FFB3BA", "#FFE0E5"];

                return (
                  <div
                    key={title}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: bgColors[index], // ✨ 고정된 색상 대신 변수 사용!
                      borderRadius: "12px",
                      padding: "10px 16px",
                      marginBottom: index === 2 ? 0 : 10,
                      color: index === 2 ? "#333" : "white", // ✨ 가장 연한 배경엔 글씨를 어둡게!
                    }}
                  >
                    <div
                      style={{
                        fontSize: "24px",
                        width: "32px",
                        textAlign: "center",
                        fontWeight: "700",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div
                      style={{ flex: 1, fontSize: "20px", fontWeight: "600" }}
                    >
                      {title}
                    </div>
                    <div
                      style={{
                        width: "32px",
                        textAlign: "center",
                        fontSize: "20px",
                      }}
                    >
                      🔍
                    </div>
                  </div>
                );
              },
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "10px",
              }}
            >
              <button
                className="btn-primary"
                style={{
                  marginTop: 0,
                  fontSize: "20px",
                  padding: "8px 16px",
                }}
              >
                게임으로 공부하기
              </button>
            </div>
          </div>

          {/* 최근에 플레이한 게임 패널 */}
          <div
            style={{
              background: "#FFF9FB",
              borderRadius: "20px",
              padding: "20px 24px",
              border: "1px solid #FFE0F0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "24px",
                  fontWeight: "600",
                }}
              >
                <span>🎵</span>
                <span>최근에 플레이한 게임</span>
              </div>
            </div>

            {recentGames.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  fontSize: "18px",
                  color: "#777",
                  textAlign: "center",
                }}
              >
                최근에 플레이한 게임이 아직 없어요.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "16px",
                }}
              >
                {recentGames.map((game) => (
                  <div
                    key={game.id}
                    style={{
                      background: "#F3E5F5",
                      borderRadius: "16px",
                      padding: "14px",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedGame(game)}
                  >
                    <div
                      style={{
                        background: "#E1BEE7",
                        borderRadius: "12px",
                        height: "250px",
                        marginBottom: "10px",
                      }}
                    />
                    <div style={{ fontSize: "20px", fontWeight: "600" }}>
                      {game.title || `게임 ${game.id}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 최근 게임 상세 팝업 (모달) */}
      {selectedGame && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
          onClick={() => setSelectedGame(null)}
        >
          <div
            style={{
              background: "#FFEFFE",
              borderRadius: "24px",
              border: "2px solid #F8BBD0",
              width: "70%",
              maxWidth: "900px",
              minHeight: "420px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              position: "relative",
              padding: "32px 32px 24px",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 타이틀 / 닫기 버튼 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#D36BA3",
                }}
              >
                Game Select
              </div>
              <button
                onClick={() => setSelectedGame(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#D36BA3",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* 내용 영역 */}
            <div
              style={{
                display: "flex",
                gap: "32px",
                alignItems: "stretch",
              }}
            >
              {/* 왼쪽: 게임 이미지 자리 (플레이스홀더) */}
              <div
                style={{
                  flex: 1,
                  background: "#F5E3F7",
                  borderRadius: "16px",
                  minHeight: "260px",
                }}
              />

              {/* 오른쪽: 게임 정보 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      marginBottom: "12px",
                    }}
                  >
                    {selectedGame.title || "게임"}
                  </div>
                  <div
                    style={{
                      height: "1px",
                      background: "#EBA7C8",
                      marginBottom: "16px",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    info
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      color: "#555",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {selectedGame.description || "게임의 설명이 아직 없습니다."}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "24px",
                  }}
                >
                  <button
                    style={{
                      borderRadius: "20px",
                      border: "2px solid #F8BBD0",
                      background: "#FFE4F1",
                      padding: "10px 24px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      alert("게임 플레이 페이지로 연결 예정입니다.");
                    }}
                  >
                    게임 플레이
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;
