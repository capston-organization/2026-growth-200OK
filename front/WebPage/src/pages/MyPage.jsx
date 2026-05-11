import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiUrl } from "../config/api";
import LearningVillageLogoImage from "../assets/images/Learning_Village_Logo_ImageOnly.png";
import LearningVillageLogoText from "../assets/images/Learning_Village_Logo_TextOnly.png";

const MyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = location.state?.userName || "사용자";

  // ── 프로필 상태 ──
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [grade, setGrade] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [school, setSchool] = useState("");
  const [gender, setGender] = useState("선택해주세요");

  // 원본 스냅샷 (수정 감지용)
  const [original, setOriginal] = useState({});

  // ── 내가 만든 게임 / 좋아요 게임 ──
  const [myGames, setMyGames] = useState([]);
  const [likedGames, setLikedGames] = useState([]);

  // ── 모달(팝업) 상태 ──
  const [selectedMyGame, setSelectedMyGame] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPublic, setEditPublic] = useState(true);

  const [selectedLikedGame, setSelectedLikedGame] = useState(null);

  const currentYear = new Date().getFullYear();

  // ── 변경 감지 ──
  const profileDirty = useMemo(
    () =>
      name !== original.name ||
      birthYear !== original.birthYear ||
      grade !== original.grade ||
      birthMonth !== original.birthMonth ||
      birthDay !== original.birthDay ||
      school !== original.school ||
      gender !== original.gender,
    [name, birthYear, grade, birthMonth, birthDay, school, gender, original],
  );

  // ── 초기 데이터 로드 ──
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const fetchProfile = async () => {
      try {
        const res = await fetch(apiUrl("/auth/me"), { method: "GET", headers });
        if (!res.ok) return;
        const d = await res.json();
        setName(d.name || "");
        setBirthYear(d.birthYear ? String(d.birthYear) : "");
        setGrade(d.grade || "");
        setSchool(d.school || "");

        let m = "";
        let dy = "";
        if (d.birthDate) {
          const parts = d.birthDate.split("-");
          if (parts.length >= 3) {
            m = String(parseInt(parts[1]));
            dy = String(parseInt(parts[2]));
          }
        }
        setBirthMonth(m);
        setBirthDay(dy);

        const gMap = {
          MALE: "남성",
          FEMALE: "여성",
          OTHER: "그 외",
          SECRET: "답하지 않음",
        };
        setGender(gMap[d.gender] || "선택해주세요");

        const snap = {
          name: d.name || "",
          birthYear: d.birthYear ? String(d.birthYear) : "",
          grade: d.grade || "",
          birthMonth: m,
          birthDay: dy,
          school: d.school || "",
          gender: gMap[d.gender] || "선택해주세요",
        };
        setOriginal(snap);
      } catch (e) {
        console.error("Failed to fetch profile:", e);
      }
    };

    const fetchMyGames = async () => {
      try {
        const res = await fetch(apiUrl("/users/me/games"), {
          method: "GET",
          headers,
        });
        if (!res.ok) return;
        const d = await res.json();
        if (d && Array.isArray(d.games)) setMyGames(d.games);
      } catch (e) {
        console.error("Failed to fetch my games:", e);
      }
    };

    const fetchLikedGames = async () => {
      try {
        const res = await fetch(apiUrl("/games/likes/me"), {
          method: "GET",
          headers,
        });
        if (!res.ok) return;
        const d = await res.json();
        if (d && Array.isArray(d.games)) setLikedGames(d.games);
      } catch (e) {
        console.error("Failed to fetch liked games:", e);
      }
    };

    fetchProfile();
    fetchMyGames();
    fetchLikedGames();
  }, []);

  // ── 프로필 저장 ──
  const handleSaveProfile = async () => {
    if (!name || !birthYear || !grade) {
      alert("이름, 출생년도, 학년은 필수 입력입니다!");
      return;
    }
    const yearNum = parseInt(birthYear);
    if (yearNum < 1900 || yearNum > currentYear) {
      alert(`출생년도를 올바르게 입력해주세요. (1900~${currentYear})`);
      return;
    }

    let mappedGender = "SECRET";
    if (gender === "남성") mappedGender = "MALE";
    else if (gender === "여성") mappedGender = "FEMALE";
    else if (gender === "그 외") mappedGender = "OTHER";

    let formattedDate = null;
    if (birthMonth && birthDay) {
      const mm = String(birthMonth).padStart(2, "0");
      const dd = String(birthDay).padStart(2, "0");
      formattedDate = `${birthYear}-${mm}-${dd}`;
    }

    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(apiUrl("/auth/me"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          birthYear: yearNum,
          grade,
          birthDate: formattedDate,
          school: school || null,
          gender: mappedGender,
        }),
      });
      if (res.ok) {
        alert("수정사항이 저장되었습니다!");
        setOriginal({
          name,
          birthYear,
          grade,
          birthMonth,
          birthDay,
          school,
          gender,
        });
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (e) {
      console.error("Profile save error:", e);
    }
  };

  // ── 게임 수정(PATCH) ──
  const handleGameUpdate = async () => {
    if (!selectedMyGame) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(apiUrl(`/games/${selectedMyGame.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle || null,
          description: editDesc || null,
          public: editPublic,
        }),
      });
      if (res.ok) {
        alert("게임이 수정되었습니다!");
        setMyGames((prev) =>
          prev.map((g) =>
            g.id === selectedMyGame.id
              ? {
                  ...g,
                  title: editTitle || g.title,
                  description: editDesc || g.description,
                  public: editPublic,
                }
              : g,
          ),
        );
        setSelectedMyGame(null);
      } else {
        alert("게임 수정에 실패했습니다.");
      }
    } catch (e) {
      console.error("Game update error:", e);
    }
  };

  // ── 게임 삭제 (DELETE) ──
  const handleGameDelete = async () => {
    if (!selectedMyGame) return;
    if (!confirm("정말로 이 게임을 삭제하시겠습니까?")) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(apiUrl(`/games/${selectedMyGame.id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("게임이 삭제되었습니다.");
        setMyGames((prev) => prev.filter((g) => g.id !== selectedMyGame.id));
        setSelectedMyGame(null);
      } else {
        alert("게임 삭제에 실패했습니다.");
      }
    } catch (e) {
      console.error("Game delete error:", e);
    }
  };

  // ── 공통 스타일 ──
  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "2px solid #FFC0CB",
    backgroundColor: "#FFF0F5",
    fontSize: "24px",
    marginTop: "6px",
    marginRight: "12px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "28px",
    fontWeight: "700",
    color: "rgb(240, 110, 151)",
    display: "block",
    marginBottom: "2px",
    marginTop: "16px",
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
      {/* ── 네비게이션 바 (GameCreationPage와 동일) ── */}
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
            style={{ cursor: "pointer" }}
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
              borderBottom: "3px solid rgb(240, 110, 151)",
              paddingBottom: "5px",
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

      {/* ── 메인 콘텐츠 ── */}
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
          {/* ── 프로필 섹션 ── */}
          <h2
            style={{
              fontSize: "36px",
              fontWeight: "800",
              marginBottom: "20px",
              color: "rgb(240, 110, 151)",
            }}
          >
            프로필
          </h2>

          {/*프로필 밑 구분선*/}
          <div
            style={{
              width: "100%",
              height: "2px", // 선 두께
              backgroundColor: "rgb(240, 110, 151)", // 원하는 색
              margin: "8px 0 40px", // 위/아래 간격
              borderRadius: "999px", // 끝 둥글게 (선택)
            }}
          />

          {/* 이름 (전체 폭) */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>이름</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="이름 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 학년 / 학교 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label style={labelStyle}>학년</label>
              <input
                type="text"
                style={inputStyle}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>학교</label>
              <input
                type="text"
                style={inputStyle}
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              />
            </div>
          </div>

          {/* 나이(출생년도) / 성별 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label style={labelStyle}>나이</label>
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <select
                  style={{ ...inputStyle, flex: 1, marginTop: 0 }}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                >
                  <option value="">년도</option>
                  {Array.from(
                    { length: currentYear - 1900 + 1 },
                    (_, i) => currentYear - i,
                  ).map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  style={{ ...inputStyle, width: "80px", marginTop: 0 }}
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                >
                  <option value="">월</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={String(m)}>
                      {String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <select
                  style={{ ...inputStyle, width: "80px", marginTop: 0 }}
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                >
                  <option value="">일</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>
                      {String(d).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>성별</label>
              <select
                style={{ ...inputStyle }}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option>선택해주세요</option>
                <option>남성</option>
                <option>여성</option>
                <option>그 외</option>
                <option>답하지 않음</option>
              </select>
            </div>
          </div>

          {/* 수정사항 저장 버튼 */}
          <div style={{ marginBottom: "32px" }}>
            <button
              disabled={!profileDirty}
              style={{
                borderRadius: "20px",
                border: profileDirty ? "2px solid #FF69B4" : "2px solid #CCC",
                background: profileDirty ? "#FFE4F1" : "#EEE",
                color: profileDirty ? "rgb(240, 110, 151)" : "#999",
                padding: "10px 24px",
                fontSize: "24px",
                fontWeight: "600",
                marginTop: "12px",
                marginBottom: "60px",
                cursor: profileDirty ? "pointer" : "default",
              }}
              onClick={handleSaveProfile}
            >
              수정사항 저장
            </button>
          </div>

          {/* ── 내가 만든 게임 ── */}
          <div
            style={{
              background: "#FFF9FB",
              borderRadius: "20px",
              padding: "20px 24px",
              border: "1px solid #FFE0F0",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "28px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              <span>🎵</span>
              <span>내가 만든 게임</span>
            </div>

            {myGames.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  fontSize: "24px",
                  color: "#777",
                  textAlign: "center",
                }}
              >
                아직 만든 게임이 없어요.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "16px",
                }}
              >
                {myGames.map((game) => (
                  <div
                    key={game.id}
                    style={{
                      background: "#F3E5F5",
                      borderRadius: "16px",
                      padding: "14px",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSelectedMyGame(game);
                      setEditTitle(game.title || "");
                      setEditDesc(game.description || "");
                      setEditPublic(game.public !== false);
                    }}
                  >
                    <div
                      style={{
                        background: "#E1BEE7",
                        borderRadius: "12px",
                        height: "180px",
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

          {/* ── 좋아요를 누른 게임 ── */}
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
                alignItems: "center",
                gap: "8px",
                fontSize: "28px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              <span>⬇</span>
              <span>좋아요를 누른 게임</span>
            </div>

            {likedGames.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  fontSize: "24px",
                  color: "#777",
                  textAlign: "center",
                }}
              >
                좋아요를 누른 게임이 없어요.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "16px",
                }}
              >
                {likedGames.map((game) => (
                  <div
                    key={game.id}
                    style={{
                      background: "#F3E5F5",
                      borderRadius: "16px",
                      padding: "14px",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedLikedGame(game)}
                  >
                    <div
                      style={{
                        background: "#E1BEE7",
                        borderRadius: "12px",
                        height: "180px",
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

      {/* ── 내가 만든 게임 수정 팝업 ── */}
      {selectedMyGame && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.25)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
          onClick={() => setSelectedMyGame(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "28px",
              border: "2px solid rgb(240, 110, 151)",
              width: "95%",
              maxWidth: "1450px",
              minHeight: "560px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              padding: "22px 24px 26px",
              boxSizing: "border-box",
              fontFamily: "Nunito, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                borderBottom: "2px solid rgba(240, 110, 151, 0.35)",
                paddingBottom: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(28px, 2.2vw, 46px)",
                  fontWeight: "700",
                  color: "rgb(240, 110, 151)",
                }}
              >
                Game Maker
              </div>
              <button
                onClick={() => setSelectedMyGame(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "clamp(26px, 2vw, 40px)",
                  fontWeight: "700",
                  color: "rgb(240, 110, 151)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* 내용 */}
            <div
              style={{ display: "flex", gap: "32px", alignItems: "stretch" }}
            >
              <div
                style={{
                  flex: 1,
                  background: "#FAF7FC",
                  borderRadius: "20px",
                  border: "1px solid rgba(240, 110, 151, 0.2)",
                  minHeight: "355px",
                }}
              />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      fontSize: "clamp(32px, 2.2vw, 46px)",
                      fontWeight: "700",
                      border: "none",
                      borderBottom: "2px solid rgba(240, 110, 151, 0.45)",
                      outline: "none",
                      width: "100%",
                      marginBottom: "14px",
                      background: "transparent",
                      paddingBottom: "8px",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "clamp(28px, 1.6vw, 36px)",
                      fontWeight: "600",
                      marginBottom: "8px",
                    }}
                  >
                    info
                  </div>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    style={{
                      fontSize: "clamp(22px, 1.3vw, 30px)",
                      color: "#555",
                      border: "1px solid rgba(240, 110, 151, 0.45)",
                      borderRadius: "10px",
                      width: "100%",
                      height: "130px",
                      resize: "vertical",
                      padding: "8px",
                      boxSizing: "border-box",
                      background: "#FFFFFF",
                    }}
                  />
                </div>

                {/* 하단 버튼 3개 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "24px",
                    gap: "14px",
                  }}
                >
                  <button
                    style={{
                      borderRadius: "20px",
                      border: "2px solid rgba(240, 110, 151, 0.75)",
                      background: "#FFFFFF",
                      padding: "11px 24px",
                      fontSize: "clamp(20px, 1.15vw, 24px)",
                      fontWeight: "600",
                      cursor: "pointer",
                      color: "#222",
                    }}
                    onClick={handleGameDelete}
                  >
                    삭제
                  </button>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <button
                      style={{
                        borderRadius: "20px",
                        border: "2px solid rgba(240, 110, 151, 0.75)",
                        background: editPublic
                          ? "rgba(255, 255, 255, 0.98)"
                          : "rgba(255, 244, 248, 1)",
                        padding: "11px 18px",
                        fontSize: "clamp(20px, 1.15vw, 24px)",
                        fontWeight: "600",
                        cursor: "pointer",
                        color: "#222",
                      }}
                      onClick={() => setEditPublic(!editPublic)}
                    >
                      {editPublic ? "공개" : "비공개"}
                    </button>
                    <span
                      style={{
                        fontSize: "clamp(20px, 1.2vw, 26px)",
                        color: "rgb(240, 110, 151)",
                        cursor: "pointer",
                        lineHeight: 1,
                      }}
                      onClick={() => setEditPublic(!editPublic)}
                    >
                      ▼
                    </span>
                  </div>
                  <button
                    style={{
                      borderRadius: "24px",
                      border: "2px solid rgb(240, 110, 151)",
                      background: "#FFFFFF",
                      padding: "14px 46px",
                      fontSize: "28px",
                      fontWeight: "600",
                      cursor: "pointer",
                      color: "#111",
                    }}
                    onClick={handleGameUpdate}
                  >
                    게임 수정
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 좋아요 게임 팝업 ── */}
      {selectedLikedGame && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.25)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
          onClick={() => setSelectedLikedGame(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "28px",
              border: "2px solid rgb(240, 110, 151)",
              width: "95%",
              maxWidth: "1450px",
              minHeight: "560px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              padding: "22px 24px 26px",
              boxSizing: "border-box",
              fontFamily: "Nunito, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                borderBottom: "2px solid rgba(240, 110, 151, 0.35)",
                paddingBottom: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(28px, 2.2vw, 46px)",
                  fontWeight: "700",
                  color: "rgb(240, 110, 151)",
                }}
              >
                Game Select
              </div>
              <button
                onClick={() => setSelectedLikedGame(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "clamp(26px, 2vw, 40px)",
                  fontWeight: "700",
                  color: "rgb(240, 110, 151)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{ display: "flex", gap: "32px", alignItems: "stretch" }}
            >
              <div
                style={{
                  flex: 1,
                  background: "#FAF7FC",
                  borderRadius: "20px",
                  border: "1px solid rgba(240, 110, 151, 0.2)",
                  minHeight: "355px",
                }}
              />
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
                      fontSize: "clamp(36px, 2.4vw, 50px)",
                      fontWeight: "700",
                      marginBottom: "14px",
                    }}
                  >
                    {selectedLikedGame.title || "게임"}
                  </div>
                  <div
                    style={{
                      height: "2px",
                      background: "rgba(240, 110, 151, 0.45)",
                      marginBottom: "18px",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "clamp(28px, 1.6vw, 36px)",
                      fontWeight: "600",
                      marginBottom: "8px",
                    }}
                  >
                    info
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(24px, 1.4vw, 32px)",
                      color: "#555",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {selectedLikedGame.description ||
                      "게임의 설명이 아직 없습니다."}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "26px",
                  }}
                >
                  <button
                    style={{
                      borderRadius: "24px",
                      border: "2px solid rgb(240, 110, 151)",
                      background: "#FFFFFF",
                      padding: "14px 46px",
                      fontSize: "28px",
                      fontWeight: "600",
                      cursor: "pointer",
                      color: "#111",
                    }}
                    onClick={async () => {
                      const token = localStorage.getItem("accessToken");
                      const gameId = selectedLikedGame?.id;

                      if (!token || !gameId) {
                        alert("게임 정보를 불러올 수 없습니다. 다시 시도해주세요.");
                        return;
                      }

                      try {
                        const headers = { Authorization: `Bearer ${token}` };

                        // 게임에 연결된 문제 목록 조회
                        const problemsRes = await fetch(
                          apiUrl(`/games/${gameId}/problems`),
                          {
                            method: "GET",
                            headers,
                          },
                        );
                        if (!problemsRes.ok) {
                          throw new Error("문제 목록 조회 실패");
                        }
                        const problems = await problemsRes.json();

                        // 학습 목표/내용 프리뷰 조회(또는 생성)
                        let previewData = {
                          description: selectedLikedGame.description || "",
                          learningObjectives:
                            selectedLikedGame.learningObjectives || "",
                          learningContent: selectedLikedGame.description || "",
                        };
                        const previewRes = await fetch(
                          apiUrl(`/games/${gameId}/generate/preview`),
                          {
                            method: "POST",
                            headers,
                          },
                        );
                        if (previewRes.ok) {
                          previewData = await previewRes.json();
                        }

                        setSelectedLikedGame(null);
                        navigate("/play", {
                          state: {
                            gameId,
                            problems: Array.isArray(problems) ? problems : [],
                            previewData,
                            userName,
                          },
                        });
                      } catch (error) {
                        console.error("저장된 게임 불러오기 실패:", error);
                        alert("저장된 게임을 불러오지 못했습니다.");
                      }
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

export default MyPage;
