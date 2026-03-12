import React from "react";
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

  /* 스트릭 개수 정하는 변수*/
  const streakDays = Array.from({ length: 123 }, (_, index) => index);

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
          {/* 상단 이미지 영역 (히어로 섹션) */}
          <div
            style={{
              background: "#F8EAF6",
              borderRadius: "24px",
              height: "200px",
              marginBottom: "30px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "40px",
                width: "80px",
                height: "80px",
                borderRadius: "24px",
                background: "#FCE4EC",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "40px",
                left: "140px",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#FFE0B2",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "80px",
                left: "220px",
                width: "70px",
                height: "70px",
                borderRadius: "24px",
                background: "#E1F5FE",
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
              <span>스트릭 : N일째 공부했어요!</span>
            </div>
            <div
              style={{
                display: "flex", // grid 대신 flex 사용
                flexWrap: "wrap", // 공간이 모자라면 다음 줄로 넘어가기
                gap: "8px", // 박스 사이 간격을 일정하게 8px로 고정
                marginBottom: "12px",
              }}
            >
              {streakDays.map((day) => (
                <div
                  key={day}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    backgroundColor: day % 3 === 0 ? "#FF8E99" : "#E0E0E0",
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
              최장 N일 연속 공부
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
              }}
            >
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  style={{
                    background: "#F3E5F5",
                    borderRadius: "16px",
                    padding: "14px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      background: "#E1BEE7",
                      borderRadius: "12px",
                      height: "250px",
                      marginBottom: "10px",
                    }}
                  />
                  <div style={{ fontSize: "24px", fontWeight: "600" }}>
                    게임 {num}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
