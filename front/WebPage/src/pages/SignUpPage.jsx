// src/pages/SignUpPage.jsx

import React, { useState } from "react"; // [중요] 화면의 상태(데이터)를 저장하기 위해 useState를 불러옴
import { useNavigate } from "react-router-dom"; // 페이지 이동을 도와주는 훅(Hook)
import { apiUrl } from "../config/api";

const SignUpPage = () => {
  // 1. 페이지 이동 함수 생성 (이걸로 다른 페이지로 점프할 수 있음)
  const navigate = useNavigate();

  // 2. 상태(State) 관리
  // 사용자가 입력한 '이름'을 실시간으로 저장해둘 공간입니다.
  // name: 현재 저장된 이름 값
  // setName: 이름을 변경할 때 사용하는 함수
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [grade, setGrade] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [school, setSchool] = useState("");
  const [gender, setGender] = useState("선택해주세요");

  // 3. 스타일 객체 정의
  // 여러 input 태그에 똑같은 디자인을 적용하기 위해 미리 만들어둔 스타일 묶음입니다.
  // 이렇게 하면 태그마다 길게 style={...}을 적지 않아도 돼서 코드가 깔끔해집니다.
  const inputStyle = {
    height: "45%",
    width: "100%",
    padding: "15px",
    borderRadius: "10px", // 모서리 둥글게
    border: "2px solid #FFC0CB", // 연분홍 테두리
    backgroundColor: "#FFF0F5", // 아주 연한 분홍 배경
    fontSize: "20px", // 글자 크기
    marginTop: "10px",
    marginBottom: "30px",
    boxSizing: "border-box", // 테두리 포함 크기 계산
  };

  // --- [추가된 부분 2] 백엔드로 데이터 전송하는 함수 ---
  const handleSubmit = async () => {
    // ----------------------------------------------------
    // 1. 방어 코드 (Validation): 이상한 값은 백엔드로 가기 전에 프론트에서 컷!
    // ----------------------------------------------------
    if (!name || !birthYear || !grade) {
      alert("이름, 출생년도, 학년은 필수 입력입니다!");
      return; // 여기서 함수를 멈추고 백엔드로 전송하지 않음
    }

    const yearNum = parseInt(birthYear);
    if (yearNum < 1900 || yearNum > 2026) {
      alert("출생년도를 올바르게 입력해주세요. (예: 2010)");
      return;
    }

    // ----------------------------------------------------
    // 2. 데이터 가공 (UX 개선): 유저의 입력을 백엔드 양식에 맞게 변환
    // ----------------------------------------------------

    // [성별 변환] '그 외', '답하지 않음' 추가
    let mappedGender = "SECRET"; // 기본값: 답하지 않음
    if (gender === "남성") mappedGender = "MALE";
    else if (gender === "여성") mappedGender = "FEMALE";
    else if (gender === "그 외") mappedGender = "OTHER";
    else if (gender === "답하지 않음") mappedGender = "SECRET"; // 백엔드가 정한 단어에 맞춰 나중에 수정 가능

    // [출생일 변환] 유저는 "03/15" 만 입력 ➡️ 프론트가 "2010-03-15" 로 조립해줌
    let formattedDate = null;
    if (birthDate) {
      // 입력값에서 숫자만 쏙 뽑아내기 (예: "3/15" -> ["3", "15"])
      const dateParts = birthDate.match(/\d+/g);

      if (dateParts && dateParts.length >= 2) {
        // padStart(2, "0") : 한 자리 숫자면 앞에 0을 붙여줌 (예: "3" -> "03")
        const month = dateParts[0].padStart(2, "0");
        const day = dateParts[1].padStart(2, "0");

        // 입력받은 '출생년도'와 합체
        formattedDate = `${birthYear}-${month}-${day}`;
      } else {
        alert("출생일은 MM/DD 형식으로 입력해주세요. (예: 03/15)");
        return;
      }
    }

    // ----------------------------------------------------
    // 3. 백엔드로 쏘기 (이제 안전하고 완벽한 데이터만 날아갑니다)
    // ----------------------------------------------------
    const token = localStorage.getItem("accessToken");

    // #region agent log
    fetch("http://127.0.0.1:7799/ingest/32d44241-1ed0-4af0-9c5b-dce23183abf7", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "fca452",
      },
      body: JSON.stringify({
        sessionId: "fca452",
        runId: "pre-fix",
        hypothesisId: "H2-H5",
        location: "SignUpPage.jsx:before-patch",
        message: "PATCH /auth/me preflight",
        data: {
          hasToken: !!token,
          tokenLen: token ? token.length : 0,
          looksLikeNullString: token === "null",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    try {
      const response = await fetch(apiUrl("/auth/me"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name,
          birthYear: yearNum, // 검증된 숫자로 전송
          grade: grade,
          birthDate: formattedDate, // 조립된 완벽한 날짜 (YYYY-MM-DD)
          school: school,
          gender: mappedGender,
        }),
      });

      if (response.ok) {
        alert("정보가 성공적으로 저장되었습니다!");
        navigate("/main", { state: { userName: name } });
      } else {
        alert("정보 저장에 실패했습니다. (서버 거절)");
      }
    } catch (error) {
      console.error("저장 중 에러 발생:", error);
    }
  };

  return (
    // 전체 페이지 레이아웃 (App.css에 정의된 page-container 클래스 사용)
    <div className="page-container" style={{ backgroundColor: "#FFF0F5" }}>
      {/* 중앙의 하얀색 카드 박스 */}
      <div className="white-box">
        <h2 style={{ color: "#ff6e86", fontSize: "32px" }}>
          기본 정보를 입력해주세요
        </h2>

        {/* 입력 필드들을 감싸는 그리드 컨테이너 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr", // 1:1 비율로 두 줄(Column) 배치
            gap: "20px", // 칸 사이 간격
            textAlign: "left", // 글자 왼쪽 정렬
            padding: "30px",
            marginTop: "40px",
          }}
        >
          {/* --- [핵심] 이름 입력 칸 --- */}
          <div>
            <label
              style={{ fontSize: "24px", fontWeight: 600, color: "#fd8da0" }}
            >
              * 이름
            </label>
            <input
              type="text"
              style={inputStyle}
              placeholder="이름 입력"
              // [중요] 양방향 바인딩 (Two-way binding)
              // 1. value={name}: 화면에 보이는 글자는 항상 'name' 변수의 값을 따름
              // 2. onChange: 사용자가 타이핑할 때마다 그 값을 'name' 변수에 업데이트함
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* --- 나머지 입력 칸들 (기능 없이 모양만 있음) --- */}
          <div>
            <label
              style={{ fontSize: "24px", fontWeight: 600, color: "#fd8da0" }}
            >
              * 출생년도
            </label>
            <select
              style={inputStyle}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            >
              <option value="">년도를 선택해주세요</option>
              {Array.from(
                { length: new Date().getFullYear() - 1900 + 1 },
                (_, i) => new Date().getFullYear() - i,
              ).map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{ fontSize: "24px", fontWeight: 600, color: "#fd8da0" }}
            >
              * 학년
            </label>
            <input
              type="text"
              style={inputStyle}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{ fontSize: "24px", fontWeight: 600, color: "#fd8da0" }}
            >
              출생일 (선택)
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <select
                style={{ ...inputStyle, flex: 1 }}
                value={birthDate.split("/")[0] || ""}
                onChange={(e) => {
                  const day = birthDate.split("/")[1] || "";
                  setBirthDate(
                    e.target.value ? `${e.target.value}/${day}` : "",
                  );
                }}
              >
                <option value="">월</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={String(m).padStart(2, "0")}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <select
                style={{ ...inputStyle, flex: 1 }}
                value={birthDate.split("/")[1] || ""}
                onChange={(e) => {
                  const month = birthDate.split("/")[0] || "";
                  setBirthDate(
                    month ? `${month}/${e.target.value}` : `/${e.target.value}`,
                  );
                }}
              >
                <option value="">일</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d).padStart(2, "0")}>
                    {String(d).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              style={{ fontSize: "24px", fontWeight: 600, color: "#fd8da0" }}
            >
              학교
            </label>
            <input
              type="text"
              style={inputStyle}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{ fontSize: "24px", fontWeight: 600, color: "#fd8da0" }}
            >
              성별
            </label>
            <select
              style={inputStyle}
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

        {/* --- 하단 버튼 영역 --- */}
        <div
          style={{
            textAlign: "right",
            marginTop: "20px",
            color: "rgb(240, 110, 151)",
          }}
        >
          <button
            className="btn-primary"
            // [핵심 기능] 버튼 클릭 시 동작
            onClick={handleSubmit}
          >
            회원 가입 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
