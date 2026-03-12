import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom"; // 💡 1. useLocation 임포트 필수!
// --- Renders ---

const ScrollBarStyle = () => (
  <style>
    {`

        ::-webkit-scrollbar {

          width: 10px;

        }

        ::-webkit-scrollbar-track {

          background: #f1f1f1;

          border-radius: 5px;

        }

        ::-webkit-scrollbar-thumb {

          background: #FF8E99;

          border-radius: 5px;

        }

        ::-webkit-scrollbar-thumb:hover {

          background: #FF5252;

        }

      `}
  </style>
);

const containerStyle = {
  width: "100%",

  height: "100vh",

  background: "#E3F2FD",

  display: "flex",

  justifyContent: "center",

  alignItems: "center",

  fontFamily: "'Nunito', sans-serif",

  position: "relative",

  overflow: "hidden",
};

const whiteBoxStyle = {
  background: "white",

  borderRadius: "20px",

  padding: "40px",

  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",

  textAlign: "center",

  width: "80%",

  maxWidth: "1400px",

  display: "flex",

  flexDirection: "column",

  justifyContent: "center",

  alignItems: "center",

  border: "2px solid #FFCDD2",
};

const buttonStyle = {
  marginTop: "30px",

  padding: "15px 40px",

  fontSize: "24px",

  borderRadius: "30px",

  background: "white",

  color: "black",

  cursor: "pointer",

  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",

  border: "1px solid #ddd",

  fontWeight: "bold",
};

const pinkBtnStyle = {
  ...buttonStyle,

  background: "#FF8E99",

  color: "white",

  border: "none",
};

// =================================================================================
// [1. 메인 컴포넌트 시작]
// 화면에 보이는 모든 기능이 여기 모여 있습니다.
// =================================================================================
const GamePlayPage = () => {
  // --- State 관리 (화면의 상태를 기억하는 변수들) ---
  // 💡 2. 이전 페이지에서 넘겨준 데이터 꺼내기
  const location = useLocation();
  // 새로고침 시 state가 날아갈 수 있으므로 방어 코드(|| {}) 작성
  const { previewData, problems, gameId } = location.state || {};

  // 💡 3. 꺼낸 데이터를 활용할 변수 선언 (Mock 데이터 대체)
  const learningGoal =
    previewData?.learningObjectives || "학습 목표가 없습니다.";
  const learningContent =
    previewData?.learningContent || "학습 내용이 없습니다.";

  // 실제 게임 화면이나 로직에 쓸 문제 데이터 상태
  const [gameProblems] = useState(problems || []);

  // 실제 게임에서 유저가 맞춘 문제와 틀린 문제를 저장할 State
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  // phase: 현재 어떤 화면을 보여줄지 결정 (GOAL -> CONTENT -> GAME -> RETRY -> SUCCESS_ALL -> ANALYSIS)
  const [phase, setPhase] = useState("GOAL");

  const [isGameOver, setIsGameOver] = useState(false);

  const iframeRef = useRef(null);

  const [retryIndex, setRetryIndex] = useState(0);

  const [userSelection, setUserSelection] = useState("");

  const [showHintPopup, setShowHintPopup] = useState(false);

  const [retryStatus, setRetryStatus] = useState({});

  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  // 💡 1. 팝업에 띄울 실시간 해설을 담을 State
  const [currentExplanation, setCurrentExplanation] = useState("");

  // 💡 2. useMemo로 되어있던 finalResults를 지우고 useState로 변경!
  const [finalResults, setFinalResults] = useState([]);

  const [isGenerating, setIsGenerating] = useState(false); // 💡 해설 생성 로딩 상태 추가

  // --- 귀여운 로딩창 컴포넌트 (내부에 추가하거나 위로 빼셔도 됩니다) ---
  const LoadingOverlay = () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(255, 255, 255, 0.9)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="loader"
        style={{
          border: "8px solid #f3f3f3",
          borderTop: "8px solid #FF8E99",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          animation: "spin 1s linear infinite",
        }}
      />
      <h2 style={{ color: "#FF8E99", marginTop: "20px" }}>
        AI가 열심히 해설을 쓰고 있어요... ✍️
      </h2>
      <p>잠시만 기다려주세요!</p>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  useEffect(() => {
    const handleMessage = (event) => {
      // ★ [수정] GAME_OVER 뿐만 아니라 GAME_CLEAR 이벤트도 수신하도록 변경
      if (
        event.data &&
        (event.data.type === "GAME_OVER" || event.data.type === "GAME_CLEAR")
      ) {
        console.log("React: 게임 종료 신호 및 결과 데이터 수신!", event.data);

        setIsGameOver(true);

        // 드디어 Phaser가 보내준 진짜 맞춘 문제/틀린 문제를 State에 저장!
        setCorrectAnswers(event.data.correctAnswers || []);
        setWrongAnswers(event.data.wrongAnswers || []);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // 컴포넌트 최상위 useEffect들 아래에 추가
  useEffect(() => {
    if (phase === "ANALYSIS") {
      const fetchAnalysisData = async () => {
        try {
          // 💡 API 4: 오답 결과와 전체 문제 해설 조회
          const response = await fetch(`/games/${gameId}/problems`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });

          if (response.ok) {
            const data = await response.json();

            // 서버 데이터(firstAttemptCorrect) + 로컬 데이터(retryStatus) 조합해서 색상 판별
            const mappedResults = data.map((p) => {
              let statusStr = "blue"; // 기본: 게임에서 한 번에 맞춤

              if (!p.firstAttemptCorrect) {
                // 게임에서 틀렸다면, 오답노트에서 한 번이라도 틀렸는지(red) 확인
                statusStr = retryStatus[p.id] === "red" ? "red" : "yellow";
              }

              return {
                id: p.id,
                title:
                  p.question.length > 20
                    ? p.question.substring(0, 20) + "..."
                    : p.question,
                status: statusStr,
                explanation: p.explanation,
                question: p.question,
              };
            });

            setFinalResults(mappedResults);
          }
        } catch (error) {
          console.error("최종 결과 조회 실패:", error);
        }
      };
      fetchAnalysisData();
    }
  }, [phase, gameId, retryStatus]);

  // 4번에서 추가한 useEffect 바로 아래에 하나 더 추가
  useEffect(() => {
    const fetchExplanationIfNeeded = async () => {
      if (!selectedAnalysisId) return;

      // 현재 선택된 문제 찾기
      const selectedResult = finalResults.find(
        (r) => r.id === selectedAnalysisId,
      );

      // 해설이 없거나 기본 텍스트인 경우에만 API 3 호출
      if (
        selectedResult &&
        (!selectedResult.explanation ||
          selectedResult.explanation === "(해설 없음)")
      ) {
        try {
          const response = await fetch(
            `/games/${gameId}/problems/${selectedAnalysisId}/explanation`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            },
          );
          if (response.ok) {
            const data = await response.json();
            // 가져온 해설로 기존 finalResults 배열 업데이트
            setFinalResults((prev) =>
              prev.map((item) =>
                item.id === selectedAnalysisId
                  ? { ...item, explanation: data.explanation }
                  : item,
              ),
            );
          }
        } catch (error) {
          console.error("해설 상세 조회/생성 실패:", error);
        }
      }
    };

    fetchExplanationIfNeeded();
  }, [selectedAnalysisId, gameId, finalResults]); // 의존성 배열에 주의

  // [Phase가 ANALYSIS로 변할 때] 혹은 [게임/재시도 종료 시] 데이터를 준비

  // 여기서는 useEffect를 사용하여 ANALYSIS 단계 진입 시 데이터가 비어있으면 채워넣도록 방어 로직을 추가합니다.

  const handleCheckWrongAnswers = async () => {
    // 1. 로딩 시작
    setIsGenerating(true);

    try {
      // 2. 모든 문제(특히 틀린 문제 우선)의 해설을 병렬로 요청
      // API 3의 특성(없으면 생성, 있으면 조회)을 이용해 미리 "찌르기" 작업을 합니다.
      const preparationTasks = gameProblems.map((problem) =>
        fetch(`/games/${gameId}/problems/${problem.id}/explanation`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }),
      );

      // 모든 요청이 완료될 때까지 대기 (Promise.all)
      await Promise.all(preparationTasks);

      console.log("모든 해설 생성/조회 완료!");
    } catch (error) {
      console.error("해설 준비 중 오류 발생:", error);
    } finally {
      // 3. 로딩 종료 및 화면 전환
      setIsGenerating(false);

      if (wrongAnswers.length === 0) {
        setPhase("SUCCESS_ALL");
      } else {
        setPhase("RETRY");
        setRetryIndex(0);
        setUserSelection("");
        setShowHintPopup(false);
        setRetryStatus({});
      }
    }
  };

  const handleSubmitRetry = async () => {
    const currentProblem = wrongAnswers[retryIndex];
    const safeUserSelection = String(userSelection || "")
      .trim()
      .toLowerCase();
    const safeAnswer = String(currentProblem.correctAnswer || "").toLowerCase();
    const isCorrect = safeUserSelection === safeAnswer;

    try {
      // 💡 API 1: 정답 제출
      await fetch(`/games/${gameId}/problems/${currentProblem.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ correct: isCorrect }),
      });

      if (isCorrect) {
        setRetryStatus((prev) => ({
          ...prev,
          [currentProblem.id]: prev[currentProblem.id] || "yellow", // 한번이라도 틀렸으면 red 유지, 아니면 yellow
        }));

        if (retryIndex < wrongAnswers.length - 1) {
          setRetryIndex(retryIndex + 1);
          setUserSelection("");
          setShowHintPopup(false);
        } else {
          setPhase("SUCCESS_ALL");
        }
      } else {
        setRetryStatus((prev) => ({
          ...prev,
          [currentProblem.id]: "red", // 한번이라도 틀리면 무조건 red 낙인
        }));

        // 💡 API 3: 해설 단 건 조회 (틀렸을 때 팝업용)
        const expRes = await fetch(
          `/games/${gameId}/problems/${currentProblem.id}/explanation`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          },
        );
        if (expRes.ok) {
          const expData = await expRes.json();
          setCurrentExplanation(expData.explanation); // 받아온 해설 저장
        }
        setShowHintPopup(true);
      }
    } catch (error) {
      console.error("정답 제출 또는 해설 조회 실패:", error);
    }
  };

  if (isGenerating) {
    return <LoadingOverlay />;
  }

  // [Phase 1] 학습 목표 (수정됨: 제목 중앙 정렬 + 스크롤 최적화)

  if (phase === "GOAL") {
    return (
      <div style={containerStyle}>
        <ScrollBarStyle />

        <div
          style={{
            ...whiteBoxStyle,

            maxHeight: "90vh",
          }}
        >
          {/* 상단 헤더 (수정됨) */}

          <div
            style={{
              width: "100%",

              borderBottom: "1px solid #eee",

              paddingBottom: "10px",

              marginBottom: "20px",

              display: "flex",

              justifyContent: "flex-end", // 내용을 우측 끝으로(X버튼 위치)

              alignItems: "center", // 수직 중앙 정렬

              position: "relative", // 제목의 절대 위치 기준점

              fontSize: "32px",

              flexShrink: 0,
            }}
          >
            {/* 제목: 절대 위치로 정중앙 고정 */}

            <span
              style={{
                position: "absolute",

                left: "50%",

                transform: "translateX(-50%)", // 정확한 중앙을 맞추기 위한 이동

                color: "#FF8E99",

                fontWeight: "bold",

                width: "max-content", // 텍스트 길이만큼만 차지
              }}
            >
              오늘의 학습 목표
            </span>

            {/* X버튼: 우측 끝에 자연스럽게 위치 */}

            <span style={{ cursor: "pointer", zIndex: 1 }}>X</span>
          </div>

          {/* 중앙 내용 */}

          <div
            style={{
              flex: 1,

              overflowY: "auto",

              width: "100%",

              display: "flex",

              flexDirection: "column",

              justifyContent: "flex-start",

              alignItems: "center",

              padding: "0 10px",
            }}
          >
            <h2
              style={{
                fontSize: "24px",

                wordBreak: "keep-all",

                lineHeight: "1.5",

                textAlign: "center",

                margin: "auto 0",
              }}
            >
              {learningGoal}
            </h2>
          </div>

          {/* 하단 버튼 */}

          <div
            style={{
              marginTop: "20px",

              width: "100%",

              textAlign: "right",

              flexShrink: 0,
            }}
          >
            <button style={buttonStyle} onClick={() => setPhase("CONTENT")}>
              다음으로 넘어가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // [Phase 2] 학습 내용 (수정됨: 제목 중앙 정렬 + 스크롤 최적화)

  if (phase === "CONTENT") {
    return (
      <div style={containerStyle}>
        <ScrollBarStyle />

        <div
          style={{
            ...whiteBoxStyle,

            maxHeight: "90vh",
          }}
        >
          {/* 상단 헤더 (수정됨) */}

          <div
            style={{
              width: "100%",

              borderBottom: "1px solid #eee",

              paddingBottom: "10px",

              marginBottom: "20px",

              display: "flex",

              justifyContent: "flex-end", // 내용을 우측 끝으로

              alignItems: "center",

              position: "relative", // 기준점

              fontSize: "32px",

              flexShrink: 0,
            }}
          >
            {/* 제목: 절대 위치로 정중앙 고정 */}

            <span
              style={{
                position: "absolute",

                left: "50%",

                transform: "translateX(-50%)",

                color: "#FF8E99",

                fontWeight: "bold",

                width: "max-content",
              }}
            >
              오늘의 학습 내용
            </span>

            {/* X버튼 */}

            <span style={{ cursor: "pointer", zIndex: 1 }}>X</span>
          </div>

          {/* 텍스트 영역 */}

          <div
            style={{
              textAlign: "left",

              whiteSpace: "pre-line",

              fontSize: "24px",

              lineHeight: "1.6",

              width: "100%",

              flex: 1,

              overflowY: "auto",

              paddingRight: "10px",
            }}
          >
            {learningContent}
          </div>

          {/* 하단 버튼 */}

          <div
            style={{
              marginTop: "20px",

              width: "100%",

              textAlign: "right",

              flexShrink: 0,
            }}
          >
            <button style={buttonStyle} onClick={() => setPhase("GAME")}>
              게임 시작
            </button>
          </div>
        </div>
      </div>
    );
  }

  // [Phase 3] 게임 플레이

  if (phase === "GAME") {
    // 💡 URL 뒤에 파라미터로 gameId를 붙여줄 수도 있습니다.
    const gameUrl = `/Game/MainGames/MainGame1/MainGame1.html?gameId=${gameId}`;

    // 💡 iframe이 로드되면 게임 쪽으로 문제 데이터를 쏴주는 함수
    const handleIframeLoad = () => {
      // 💡 로컬 스토리지에서 토큰을 가져옵니다.
      const token = localStorage.getItem("accessToken");
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "START_GAME",
            gameId: gameId,
            problems: gameProblems, // 안 쓰이던 문제 데이터를 여기서 넘깁니다!
            accessToken: token, // JWT 토큰
          },
          "*",
        );
      }
    };

    return (
      <div style={{ ...containerStyle, background: "black" }}>
        <div
          style={{ position: "absolute", top: 10, left: 10, color: "white" }}
        >
          Game Play
        </div>

        <iframe
          ref={iframeRef}
          src={gameUrl}
          title="Phaser Game"
          onLoad={handleIframeLoad} // 💡 추가된 부분: 로딩 완료 시 데이터 전송
          style={{
            width: "100%",

            height: "80vh",

            maxWidth: "1280px",

            border: "none",
          }}
        />

        <button
          onClick={handleCheckWrongAnswers}
          disabled={!isGameOver}
          style={{
            position: "absolute",

            bottom: "30px",

            right: "30px",

            padding: "20px 40px",

            fontSize: "28px",

            borderRadius: "10px",

            background: isGameOver ? "#FF4081" : "#555",

            color: "white",

            border: "none",

            cursor: isGameOver ? "pointer" : "not-allowed",

            fontWeight: "bold",

            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          }}
        >
          {isGameOver ? "오답 확인 하기" : "게임 진행 중..."}
        </button>
      </div>
    );
  }

  // [Phase 4] 오답 다시 풀기

  if (phase === "RETRY") {
    // ★ [방어 코드 추가] wrongAnswers가 비어있거나, 해당 인덱스에 데이터가 없으면 렌더링 중단
    if (
      !wrongAnswers ||
      wrongAnswers.length === 0 ||
      !wrongAnswers[retryIndex]
    ) {
      return <div>오답 데이터를 불러오는 중...</div>;
    }

    const currentProblem = wrongAnswers[retryIndex];

    const getOptionStyle = (opt) => ({
      padding: "20px",

      margin: "10px",

      borderRadius: "30px",

      border: "2px solid #ddd",

      background: userSelection === opt ? "#FF8E99" : "white",

      color: userSelection === opt ? "white" : "black",

      cursor: "pointer",

      minWidth: "300px",

      fontSize: "28px",

      transition: "0.2s",
    });

    return (
      <div style={containerStyle}>
        <div
          style={{
            ...whiteBoxStyle,

            position: "relative",

            minHeight: "600px",

            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              width: "100%",

              borderBottom: "1px solid #eee",

              paddingBottom: "10px",

              marginBottom: "40px",

              display: "flex",

              justifyContent: "space-between",

              fontSize: "28px",
            }}
          >
            <span style={{ color: "#FF8E99", fontWeight: "bold" }}>
              오답 다시 풀기 ({retryIndex + 1}/{wrongAnswers.length})
            </span>

            <span style={{ cursor: "pointer" }}>X</span>
          </div>

          <h3
            style={{
              marginTop: "30px",
              fontSize: "32px",

              marginBottom: "40px",

              whiteSpace: "pre-line",
            }}
          >
            Q. {currentProblem.question}
          </h3>

          <div
            style={{
              display: "flex",

              flexWrap: "wrap",

              justifyContent: "center",

              width: "100%",
            }}
          >
            {/* 1. 단답형 문제 처리 (API 명세서에 맞게 SHORT_ANSWER로 수정) */}
            {currentProblem.type === "SHORT_ANSWER" ? (
              <input
                type="text"
                value={userSelection}
                onChange={(e) => setUserSelection(e.target.value)}
                placeholder="정답을 입력하세요"
                style={{
                  padding: "15px",
                  fontSize: "24px",
                  borderRadius: "30px",
                  border: "2px solid #FF8E99",
                  width: "60%",
                  textAlign: "center",
                  outline: "none",
                }}
              />
            ) : currentProblem.type === "OX" ? (
              /* 2. OX 문제 처리 (강제로 'O', 'X' 버튼 생성) */
              ["O", "X"].map((opt, idx) => (
                <div
                  key={idx}
                  style={getOptionStyle(opt)}
                  onClick={() => setUserSelection(opt)}
                >
                  {opt}
                </div>
              ))
            ) : (
              /* 3. 객관식 문제 처리 */
              currentProblem.options.map((opt, idx) => (
                <div
                  key={idx}
                  style={getOptionStyle(opt)}
                  onClick={() => setUserSelection(opt)}
                >
                  {currentProblem.type === "CHOICE"
                    ? `${String.fromCharCode(65 + idx)}. ${opt}`
                    : opt}
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: "50px", width: "100%", textAlign: "right" }}>
            <button style={pinkBtnStyle} onClick={handleSubmitRetry}>
              정답 제출
            </button>
          </div>

          {showHintPopup && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "white",
                padding: "40px",
                borderRadius: "15px",
                border: "2px solid #FF8E99",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                zIndex: 10,
                width: "70%",
                // [수정 1] 높이를 고정이 아니라 최대 높이로 설정하고, Flex 레이아웃 적용
                maxHeight: "80vh",
                height: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* 상단: 닫기 버튼 */}
              <div
                style={{
                  textAlign: "right",
                  marginBottom: "0px",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{ cursor: "pointer", fontSize: "24px" }}
                  onClick={() => setShowHintPopup(false)}
                >
                  X
                </span>
              </div>

              {/* 상단: 제목 */}
              <h3
                style={{
                  fontSize: "32px",
                  marginBottom: "0px",
                  color: "#FF8E99",
                  flexShrink: 0, // 제목 크기 유지
                }}
              >
                해설
              </h3>

              {/* 중단: 스크롤 가능한 텍스트 영역 */}
              <div
                style={{
                  overflowY: "auto", // 내용이 길면 스크롤 생김
                  flex: 1, // 남은 공간 채우기
                  padding: "0 10px", // 스크롤바와 텍스트 간격
                  marginBottom: "60px",
                }}
              >
                <p
                  style={{
                    fontSize: "28px",
                    marginBottom: "10px",
                    fontWeight: "bold",
                  }}
                >
                  정답: {currentProblem.correctAnswer}
                </p>

                <p
                  style={{
                    fontSize: "24px",
                    color: "#555",
                    lineHeight: "1.6",
                    whiteSpace: "pre-line",
                  }}
                >
                  {currentExplanation}
                </p>
              </div>

              {/* 하단: 버튼 (여백 수정됨) */}
              <div style={{ flexShrink: 0 }}>
                <button
                  style={{
                    ...pinkBtnStyle,
                    marginTop: "0px", // [수정 2] 100px 여백 제거
                    width: "20%", // 버튼 가로
                  }}
                  onClick={() => setShowHintPopup(false)}
                >
                  다시 풀기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // [Phase 5] 성공

  if (phase === "SUCCESS_ALL") {
    return (
      <div style={containerStyle}>
        <div style={whiteBoxStyle}>
          <div
            style={{
              width: "100%",

              borderBottom: "1px solid #eee",

              paddingBottom: "10px",

              marginBottom: "20px",

              fontSize: "32px",
            }}
          >
            <span style={{ color: "#FF8E99", fontWeight: "bold" }}>
              오답 다시 풀기
            </span>
          </div>

          <div
            style={{
              flex: 1,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",
            }}
          >
            <h2 style={{ fontSize: "32px" }}>모든 문제를 맞췄습니다!</h2>
          </div>

          <div style={{ width: "100%", textAlign: "right" }}>
            <button style={buttonStyle} onClick={() => setPhase("ANALYSIS")}>
              분석 결과 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // [Phase 6] 분석 결과 (스크롤 기능 강화)

  if (phase === "ANALYSIS") {
    return (
      <div style={{ ...containerStyle, background: "#FFF0F5" }}>
        {/* [추가] 스크롤바 디자인을 위한 스타일 태그 삽입 */}

        <style>
          {`

            /* Webkit (Chrome, Safari, Edge) 스크롤바 스타일 */

            ::-webkit-scrollbar {

              width: 10px;

            }

            ::-webkit-scrollbar-track {

              background: #f1f1f1;

              border-radius: 5px;

            }

            ::-webkit-scrollbar-thumb {

              background: #FF8E99;

              border-radius: 5px;

            }

            ::-webkit-scrollbar-thumb:hover {

              background: #FF5252;

            }

          `}
        </style>

        <div
          style={{
            width: "90%",

            maxWidth: "1200px",

            height: "85vh",

            background: "white",

            borderRadius: "20px",

            padding: "30px",

            display: "flex",

            boxShadow: "0 5px 20px rgba(0,0,0,0.05)",

            // [중요] flex 컨테이너에서 자식이 넘치지 않도록 관리

            overflow: "hidden",
          }}
        >
          {/* 왼쪽: 문제 목록 */}

          <div
            style={{
              flex: 1,

              borderRight: "1px solid #eee",

              paddingRight: "20px", // 스크롤바 공간 확보

              marginRight: "10px",

              // [중요] 세로 스크롤 허용

              overflowY: "auto",

              // [중요] 높이를 100%로 고정해야 부모 크기를 넘지 않고 스크롤 생김

              height: "100%",
            }}
          >
            <h2 style={{ fontSize: "32px", marginBottom: "30px" }}>
              게임 결과 ({finalResults.length})
            </h2>

            {finalResults.map((res, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedAnalysisId(res.id)}
                style={{
                  display: "flex",

                  alignItems: "center",

                  padding: "15px",

                  marginBottom: "15px",

                  borderRadius: "15px",

                  cursor: "pointer",

                  fontSize: "24px",

                  border:
                    selectedAnalysisId === res.id
                      ? "2px solid #FF4081"
                      : "1px solid #eee",

                  background: "white",

                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",

                  transition: "background 0.2s",
                }}
              >
                {/* 번호 및 상태 색상 */}

                <div
                  style={{
                    width: "50px",

                    height: "50px",

                    borderRadius: "50%",

                    background:
                      res.status === "blue"
                        ? "#81D4FA"
                        : res.status === "yellow"
                          ? "#FFF59D"
                          : "#FFCDD2",

                    display: "flex",

                    justifyContent: "center",

                    alignItems: "center",

                    marginRight: "20px",

                    fontWeight: "bold",

                    color: "#555",

                    flexShrink: 0, // 아이콘 크기 줄어들지 않게 고정
                  }}
                >
                  {idx + 1}
                </div>

                <span
                  style={{
                    fontSize: "24px",

                    fontWeight: "bold",

                    color: "#333",

                    whiteSpace: "nowrap", // 제목이 길어도 줄바꿈 안 함

                    overflow: "hidden",

                    textOverflow: "ellipsis", // 말줄임표(...)

                    maxWidth: "200px", // 제목 최대 길이 제한
                  }}
                >
                  {res.title}
                </span>

                <span
                  style={{
                    marginLeft: "auto",

                    fontSize: "20px",

                    color: "#ccc",
                  }}
                >
                  &gt;
                </span>
              </div>
            ))}
          </div>

          {/* 오른쪽: 해설 상세 보기 */}

          <div
            style={{
              flex: 1,

              paddingLeft: "30px",

              display: "flex",

              justifyContent: "center",

              alignItems: "center",

              height: "100%", // 높이 꽉 채우기

              overflow: "hidden", // 내부 박스에서 스크롤 하기 위해 여긴 hidden
            }}
          >
            {selectedAnalysisId ? (
              <div
                style={{
                  width: "100%",

                  height: "100%", // 부모 높이만큼 꽉 채움

                  background: "white",

                  borderRadius: "20px",

                  padding: "30px",

                  border: "2px solid #f8bbd0",

                  display: "flex",

                  flexDirection: "column",

                  // [중요] 내용이 많을 때 여기서 스크롤 발생

                  overflowY: "auto",
                }}
              >
                <h2
                  style={{
                    fontSize: "32px",

                    marginBottom: "30px",

                    color: "#FF8E99",

                    textAlign: "left",

                    flexShrink: 0, // 스크롤 시에도 제목 영역 찌그러짐 방지
                  }}
                >
                  문제 해설
                </h2>

                {(() => {
                  const selectedResult = finalResults.find(
                    (r) => r.id === selectedAnalysisId,
                  );

                  return (
                    <>
                      <div
                        style={{
                          background: "#f5f5f5",

                          padding: "20px",

                          borderRadius: "15px",

                          marginBottom: "30px",

                          fontSize: "24px",

                          fontWeight: "bold",

                          lineHeight: "1.5",

                          textAlign: "left",

                          borderLeft: "5px solid #555",

                          flexShrink: 0, // 문제 박스 크기 유지
                        }}
                      >
                        Q. {selectedResult?.question}
                      </div>

                      <p
                        style={{
                          fontSize: "24px",

                          lineHeight: "1.8",

                          wordBreak: "break-word", // 긴 단어 줄바꿈

                          textAlign: "left",

                          color: "#333",

                          whiteSpace: "pre-line", // 줄바꿈 문자(\n) 적용
                        }}
                      >
                        {selectedResult?.explanation}
                      </p>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div style={{ color: "#aaa", fontSize: "20px" }}>
                왼쪽 목록에서 문제를 선택하여
                <br />
                문제와 해설을 확인하세요.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default GamePlayPage;
