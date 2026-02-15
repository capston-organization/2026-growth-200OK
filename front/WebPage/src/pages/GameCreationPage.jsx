// src/pages/GameCreationPage.jsx

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // 페이지 이동 및 데이터 전달받기용

const GameCreationPage = () => {
  const navigate = useNavigate();

  // [데이터 받기] 이전 페이지(SignUpPage)에서 보낸 'userName'을 꺼냄
  // state가 없으면(그냥 주소로 접속하면) "사용자"라고 표시
  const location = useLocation();
  const userName = location.state?.userName || "사용자";

  // [상태 관리] 현재 몇 번째 단계인지 저장 (1: 유형선택 -> 2: 자료입력 -> 3: 문제설정)
  const [step, setStep] = useState(1);

  // --- 사용자 입력 데이터 상태 (각 단계별로 선택한 값 저장) ---
  const [selectedType, setSelectedType] = useState(null); // Step 1: Grammar 또는 Vocabulary (하나만)
  const [files, setFiles] = useState([]); // Step 2: 업로드된 파일 리스트
  const [textInput, setTextInput] = useState(""); // Step 2: 직접 입력한 텍스트
  const [selectedQuestions, setSelectedQuestions] = useState([]); // Step 3: 선택된 문제 유형들 (여러 개 가능)

  // --- 기능 함수들 (비즈니스 로직) ---

  // [Step 2] 파일 추가 버튼 클릭 시 (가짜 파일 추가)
  const addFile = () => {
    const fileName = `자료_${files.length + 1}.pdf`;
    setFiles([...files, fileName]); // 기존 목록(...files) 뒤에 새 파일 추가
  };

  // [Step 2] 파일 옆 X 버튼 클릭 시 삭제
  const removeFile = (index) => {
    // filter를 사용해 클릭한 인덱스(index)와 다른 것들만 남김 = 삭제 효과
    setFiles(files.filter((_, i) => i !== index));
  };

  // [Step 3] 문제 유형 카드 클릭 시 (선택 <-> 해제 토글)
  const toggleQuestion = (type) => {
    if (selectedQuestions.includes(type)) {
      // 이미 선택되어 있으면 -> 뺌 (선택 해제)
      setSelectedQuestions(selectedQuestions.filter((t) => t !== type));
    } else {
      // 선택 안 되어 있으면 -> 추가 (선택)
      setSelectedQuestions([...selectedQuestions, type]);
    }
  };

  // [공통] '다음 단계' 버튼 활성화 여부 체크 (유효성 검사)
  const isNextButtonDisabled = () => {
    if (step === 1) return selectedType === null; // 유형을 안 골랐으면 버튼 끔
    if (step === 3) return selectedQuestions.length === 0; // 문제 유형을 하나도 안 골랐으면 버튼 끔
    return false; // 2단계는 입력 안 해도 넘어갈 수 있음 (선택 사항)
  };

  // --- 스타일 정의 (반복되는 디자인을 변수로 분리) ---

  // 파일 목록 보여주는 타원형 버튼 스타일
  const ovalBtnStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: "12px 20px",
    borderRadius: "30px", // 둥글게
    border: "2px solid #FFC0CB",
    backgroundColor: "white",
    marginBottom: "10px",
    cursor: "pointer",
    boxSizing: "border-box",
    color: "#555",
    fontWeight: "bold",
  };

  // 큰 사각형 선택 카드 스타일 (Step 1 & Step 3)
  const cardStyle = (isSelected) => ({
    width: "300px",
    height: "300px",
    backgroundColor: "#F0F0F0",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    // [포인트] 선택되었으면 진분홍 테두리, 아니면 투명 테두리
    border: isSelected ? "4px solid #FF69B4" : "2px solid transparent",
    cursor: "pointer",
    margin: "10px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    transition: "0.2s", // 클릭 시 부드럽게 변함
  });

  return (
    <div
      style={{
        paddingTop: "40px", // 상단 네비게이션 바 공간 확보
        minHeight: "100vh",
        backgroundColor: "#E6F7FF", // 전체 배경 (하늘색)
        boxSizing: "border-box", // 👈 [추가] 이게 없으면 패딩만큼 키가 더 커져요!
      }}
    >
      {/* =======================
          상단 네비게이션 바
      ======================== */}
      <div className="navbar">
        {/* 왼쪽 로고 영역 */}
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

        {/* 중앙 메뉴 (현재 페이지 표시) */}
        <div className="nav-menu">
          <span>Home</span>
          {/* 현재 페이지인 '게임 만들기'에만 분홍색 밑줄 강조 */}
          <span
            style={{
              fontWeight: "bold",
              color: "#333",
              borderBottom: "3px solid #FF69B4",
              paddingBottom: "5px",
            }}
          >
            게임 만들기
          </span>
          <span>공유하기</span>
          <span>게임하기</span>
          <span>분석하기</span>
          <span>육성하기</span>

          {/* 환영 문구 (가져온 userName 사용) */}
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

      {/* =======================
          메인 컨텐츠 박스 (흰색)
      ======================== */}
      <div
        className="page-container"
        style={{
          minHeight: "calc(100vh - 80px)",
          justifyContent: "flex-start",
          paddingTop: "100px",
        }}
      >
        <div className="white-box" style={{ minHeight: "600px" }}>
          {/* --- 상단 단계 표시 탭 (1. 학습영역 -> 2. source -> 3. 설정) --- */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "120px", // 탭 사이 간격
              marginBottom: "40px",
              color: "#ccc", // 기본 회색
              fontSize: "20px", // 탭 글자 크기
              fontWeight: "600",
            }}
          >
            {["학습영역 선택", "source 입력", "게임 설정"].map((title, idx) => {
              const tabStep = idx + 1;
              const isActive = step === tabStep; // 현재 단계인지 확인
              return (
                <span
                  key={idx}
                  style={{
                    // 활성화된 단계면 분홍색, 아니면 회색
                    color: isActive ? "#FF69B4" : "#ccc",
                    fontWeight: isActive ? "bold" : "normal",
                    borderBottom: isActive ? "2px solid #FF69B4" : "none",
                    paddingBottom: "5px",
                    fontSize: "24px", // 활성화 여부 상관없이 크기 키움
                  }}
                >
                  {title}
                </span>
              );
            })}
          </div>

          {/* ===========================================
             STEP 1: 학습 영역 선택 화면 (Grammar / Vocab)
             =========================================== */}
          {step === 1 && (
            <div className="fade-in">
              <h3 style={{ fontSize: "28px", margin: 0 }}>
                영문법/영단어 중 학습할 영역을 선택하세요.
              </h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "40px",
                  marginTop: "20px",
                }}
              >
                {/* Grammar 선택 카드 */}
                <div
                  style={cardStyle(selectedType === "Grammar")}
                  onClick={() => setSelectedType("Grammar")}
                >
                  <div style={{ fontSize: "120px", marginBottom: "18px" }}>
                    🧩
                  </div>
                  <h4 style={{ fontSize: "32px", margin: 0 }}>Grammar</h4>
                </div>

                {/* Vocabulary 선택 카드 */}
                <div
                  style={cardStyle(selectedType === "Vocabulary")}
                  onClick={() => setSelectedType("Vocabulary")}
                >
                  <div style={{ fontSize: "120px", marginBottom: "18px" }}>
                    🅰️
                  </div>
                  <h4 style={{ fontSize: "32px", margin: 0 }}>Vocabulary</h4>
                </div>
              </div>
            </div>
          )}

          {/* ===========================================
             STEP 2: 자료 입력 화면 (파일 업로드 & 텍스트)
             =========================================== */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: "28px", margin: 0 }}>
                문제 내용이 될 자료를 입력하세요.
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "40px",
                  textAlign: "center",
                  marginTop: "20px",
                  height: "400px",
                }}
              >
                {/* 왼쪽: 파일 관리 영역 */}
                <div
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <h4 style={{ fontSize: "24px", marginBottom: "15px" }}>
                    내 파일에서 참고
                  </h4>

                  {/* 파일 리스트 (스크롤 가능) */}
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {files.map((file, idx) => (
                      <div key={idx} style={ovalBtnStyle}>
                        <span>📄 {file}</span>
                        <span
                          style={{
                            color: "#FF69B4",
                            cursor: "pointer",
                            fontWeight: "bold",
                            padding: "0 10px",
                          }}
                          onClick={() => removeFile(idx)} // 삭제 버튼
                        >
                          X
                        </span>
                      </div>
                    ))}

                    {/* 파일 추가 버튼 */}
                    <div
                      onClick={addFile}
                      style={{
                        ...ovalBtnStyle,
                        border: "2px dashed #FFC0CB", // 점선
                        justifyContent: "center",
                        color: "#FF69B4",
                      }}
                    >
                      + 추가하기
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 텍스트 직접 입력 영역 */}
                <div
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <h4 style={{ fontSize: "24px", marginBottom: "15px" }}>
                    직접 입력
                  </h4>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="내용을 입력하세요 (예: 1. which와 who의 차이점...)"
                    style={{
                      width: "100%",
                      flex: 1,
                      border: "2px solid #FFC0CB",
                      borderRadius: "15px",
                      padding: "20px",
                      fontSize: "20px",
                      resize: "none",
                      outline: "none",
                      overflowY: "auto",
                      backgroundColor: "#FFF0F5",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===========================================
             STEP 3: 문제 유형 설정 화면 (다중 선택)
             =========================================== */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: "28px", margin: 0 }}>
                게임에 삽입될 문제의 유형을 선택하세요.
              </h3>
              <p style={{ color: "#888", fontSize: "20px" }}>
                (1개 ~ 4개 선택 가능)
              </p>

              {/* 2x2 그리드 배치 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "30px",
                  maxWidth: "700px",
                  margin: "40px auto",
                  justifyItems: "center",
                }}
              >
                {["단답식", "OX", "객관식", "서술형"].map((type) => (
                  <div
                    key={type}
                    // 이미 선택된 목록에 포함되어 있으면 테두리 표시
                    style={{
                      ...cardStyle(selectedQuestions.includes(type)),
                      margin: 0,
                    }}
                    onClick={() => toggleQuestion(type)} // 클릭 시 토글
                  >
                    <div style={{ fontSize: "80px", marginBottom: "10px" }}>
                      ❓
                    </div>
                    <h4 style={{ fontSize: "28px", margin: 20 }}>{type}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =======================
              하단 버튼 영역 (이전 / 다음)
          ======================== */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "50px",
              paddingTop: "20px",
              borderTop: "1px solid #eee",
            }}
          >
            {/* [이전] 버튼 */}
            <button
              className="btn-primary"
              style={{
                width: "180px",
                marginTop: 0,
                fontSize: "20px",
                fontWeight: "bold",
              }}
              onClick={() => {
                if (step === 1)
                  navigate("/signup"); // 1단계에선 회원가입 페이지로
                else setStep(step - 1); // 나머지는 이전 단계로
              }}
            >
              ← 뒤로 가기
            </button>

            {/* [다음/완료] 버튼 */}
            <button
              className={`btn-primary ${isNextButtonDisabled() ? "btn-disabled" : ""}`}
              style={{
                width: "180px",
                marginTop: 0,
                fontSize: "20px",
                fontWeight: "bold",
              }}
              disabled={isNextButtonDisabled()} // 조건 불만족 시 클릭 방지
              onClick={() => {
                if (step === 3)
                  navigate("/play"); // 마지막 단계 완료 시 게임 플레이 페이지로
                else setStep(step + 1); // 나머지는 다음 단계로
              }}
            >
              {step === 3 ? "게임 생성" : "다음 단계"} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCreationPage;
