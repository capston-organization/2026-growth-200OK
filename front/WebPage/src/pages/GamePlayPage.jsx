import React, { useState, useEffect, useRef } from "react";

// =================================================================================
// [1. 데이터 영역]
// 나중에 서버나 DB에서 데이터를 가져올 때 이 변수들을 교체하면 됩니다.
// =================================================================================

// [Mock Data] 학습 목표 및 내용

const LEARNING_GOAL = `

관계대명사(who, which)와 Be동사의 수 일치를 완벽하게 마스터하자!



############################################

############################################

############################################

(내용이 길어질 경우를 대비한 여백)

############################################

############################################

############################################

############################################

############################################

############################################

############################################

(내용이 길어질 경우를 대비한 여백)

############################################

############################################

############################################

############################################

############################################

############################################

############################################

(내용이 길어질 경우를 대비한 여백)

############################################

############################################

############################################

############################################

############################################

############################################

############################################

(내용이 길어질 경우를 대비한 여백)

############################################

############################################

############################################

############################################

############################################

############################################

############################################

(내용이 길어질 경우를 대비한 여백)

############################################

############################################

############################################

############################################

`;

const LEARNING_CONTENT = `

1. 관계대명사 구별:

   - 사람일 때: who

   - 사물일 때: which

   

2. 수 일치 (Subject-Verb Agreement):

   - 주어가 단수면 is, 복수면 are

   - You는 항상 are를 씁니다.



############################################

(스크롤 테스트를 위한 긴 텍스트)

############################################

3. 추가 예문 학습:

   - The boy who is singing is my brother.

   - The car which is red is fast.



4. 주의할 점:

   - 관계대명사 뒤에 오는 동사의 수는 선행사에 일치시킵니다.

   - 선행사가 복수라면 동사도 복수형을 써야 합니다.

   

############################################

############################################

############################################

(내용이 길어질 경우를 대비한 여백)

############################################

############################################

############################################

############################################

############################################

############################################

############################################

############################################

############################################

############################################

############################################

############################################



`;

// [Mock Data] 오답 노트용 문제 데이터 (틀린 문제라고 가정)
// type: "CHOICE"(객관식), "OX"(OX퀴즈), "SHORT"(주관식)

const MOCK_WRONG_ANSWERS = [
  {
    id: 1,

    type: "CHOICE",

    question: "The book ______ is on the table is mine.",

    options: ["who", "whom", "which", "whose", "that"],

    answer: "which",

    explanation:
      "선행사가 사물(The book)이므로 관계대명사는 which가 적절합니다. 또한 주격 관계대명사이므로 뒤에 바로 동사가 옵니다.",
  },

  {
    id: 2,

    type: "OX",

    question:
      "다음 문장의 문법 상 오류가 없다면 O 있다면 X를 고르시오.\n'You is good.'",

    options: ["O", "X"],

    answer: "X",

    explanation:
      "You는 2인칭 대명사로 Be동사는 항상 are를 써야 합니다. (You are good). 이는 영어 문법의 가장 기초적인 수 일치 규칙 중 하나입니다.",
  },

  {
    id: 3,

    type: "SHORT",

    question: "다음 문장의 빈칸에 들어갈 말을 쓰시오.\n'You ______ good.'",

    answer: "are",

    explanation: "주어 You에 맞는 Be동사는 are입니다.",
  },
];

// [수정 포인트 1] 스크롤 테스트를 위해 데이터를 20개로 늘렸습니다.

const INITIAL_CORRECT_RESULTS = Array.from({ length: 20 }).map((_, i) => ({
  id: 100 + i,

  title: `Practice Question No.${i + 1}`, // 제목

  question: `This is the full text for Practice Question No.${i + 1}.`, // 실제 문제 내용

  status: i % 3 === 0 ? "blue" : "yellow", // 파랑, 노랑 섞어서 생성

  explanation:
    i === 0
      ? `(이 해설은 스크롤 테스트를 위해 아주 길게 작성되었습니다)\n\n

         첫 번째 문제에 대한 아주 상세한 해설입니다.

         관계대명사는 두 문장을 연결하는 접속사와 대명사의 역할을 동시에 합니다.

         

         1. 선행사 확인: 문장 앞에 오는 명사가 사람인지 사물인지 확인합니다.

         2. 격 확인: 주격, 소유격, 목적격을 판단합니다.

         3. 동사 수 일치: 관계대명사절 내의 동사는 선행사의 수에 일치시킵니다.

         

         이 모든 과정을 거쳐야 정확한 정답을 도출할 수 있습니다.

         영어 문법은 반복 학습이 중요하므로, 틀린 문제는 반드시 오답 노트를 통해 복습하시기 바랍니다.

         스크롤이 잘 되는지 확인해보세요! 아래로 더 내려보세요.

         

         [추가 설명]

         Lorem ipsum dolor sit amet, consectetur adipiscing elit.

         Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

         Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

         `
      : `Short explanation for question ${i + 1}. Good job!`,
}));

// =================================================================================
// [2. 메인 컴포넌트 시작]
// 화면에 보이는 모든 기능이 여기 모여 있습니다.
// =================================================================================
const GamePlayPage = () => {
  // --- State 관리 (화면의 상태를 기억하는 변수들) ---

  // phase: 현재 어떤 화면을 보여줄지 결정 (GOAL -> CONTENT -> GAME -> RETRY -> SUCCESS_ALL -> ANALYSIS)
  const [phase, setPhase] = useState("GOAL");

  const [isGameOver, setIsGameOver] = useState(false);

  const iframeRef = useRef(null);

  const [retryIndex, setRetryIndex] = useState(0);

  const [userSelection, setUserSelection] = useState("");

  const [showHintPopup, setShowHintPopup] = useState(false);

  const [retryStatus, setRetryStatus] = useState({});

  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);

  // [수정 포인트 2] 초기값을 빈 배열이 아니라, 바로 테스트해볼 수 있게 합쳐진 데이터로 설정할 수도 있습니다.

  // 실제 로직에서는 빈 배열([])로 시작하는 것이 맞습니다.

  const [finalResults, setFinalResults] = useState([]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === "GAME_OVER") {
        console.log("React: Game Over 신호 수신!");

        setIsGameOver(true);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // [Phase가 ANALYSIS로 변할 때] 혹은 [게임/재시도 종료 시] 데이터를 준비

  // 여기서는 useEffect를 사용하여 ANALYSIS 단계 진입 시 데이터가 비어있으면 채워넣도록 방어 로직을 추가합니다.

  useEffect(() => {
    if (phase === "ANALYSIS" && finalResults.length === 0) {
      prepareFinalResults();
    }
  }, [phase]);

  const handleCheckWrongAnswers = () => {
    setPhase("RETRY");

    setRetryIndex(0);

    setUserSelection("");

    setShowHintPopup(false);

    setRetryStatus({});
  };

  const handleSubmitRetry = () => {
    const currentProblem = MOCK_WRONG_ANSWERS[retryIndex];

    const isCorrect =
      userSelection.trim().toLowerCase() ===
      currentProblem.answer.toLowerCase();

    if (isCorrect) {
      setRetryStatus((prev) => ({
        ...prev,

        [currentProblem.id]: prev[currentProblem.id] || "yellow",
      }));

      if (retryIndex < MOCK_WRONG_ANSWERS.length - 1) {
        setRetryIndex(retryIndex + 1);

        setUserSelection("");

        setShowHintPopup(false);
      } else {
        prepareFinalResults();

        setPhase("SUCCESS_ALL");
      }
    } else {
      setRetryStatus((prev) => ({
        ...prev,

        [currentProblem.id]: "red",
      }));

      setShowHintPopup(true);
    }
  };

  const prepareFinalResults = () => {
    // 1. 처음에 맞춘 문제들 (20개 더미 데이터)

    const passed = INITIAL_CORRECT_RESULTS.map((item) => ({
      ...item,

      // question 필드가 이미 Mock Data에 있으므로 그대로 사용
    }));

    // 2. 틀렸다가 다시 푼 문제들

    const retried = MOCK_WRONG_ANSWERS.map((p) => ({
      id: p.id,

      title:
        p.question.length > 20
          ? p.question.substring(0, 20) + "..."
          : p.question,

      status: retryStatus[p.id] === "red" ? "red" : "yellow",

      explanation: p.explanation,

      question: p.question,
    }));

    setFinalResults([...passed, ...retried]);
  };

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
              {LEARNING_GOAL}
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
            {LEARNING_CONTENT}
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
    const gameUrl = "/Game/MainGames/MainGame1/MainGame1.html";

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
    const currentProblem = MOCK_WRONG_ANSWERS[retryIndex];

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
              오답 다시 풀기 ({retryIndex + 1}/{MOCK_WRONG_ANSWERS.length})
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
            {currentProblem.type === "SHORT" ? (
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
            ) : (
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
                  정답: {currentProblem.answer}
                </p>

                <p
                  style={{
                    fontSize: "24px",
                    color: "#555",
                    lineHeight: "1.6",
                    whiteSpace: "pre-line",
                  }}
                >
                  {currentProblem.explanation}
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
