// src/pages/SignUpPage.jsx

import React, { useState } from "react"; // [중요] 화면의 상태(데이터)를 저장하기 위해 useState를 불러옴
import { useNavigate } from "react-router-dom"; // 페이지 이동을 도와주는 훅(Hook)

const SignUpPage = () => {
  // 1. 페이지 이동 함수 생성 (이걸로 다른 페이지로 점프할 수 있음)
  const navigate = useNavigate();

  // 2. 상태(State) 관리
  // 사용자가 입력한 '이름'을 실시간으로 저장해둘 공간입니다.
  // name: 현재 저장된 이름 값
  // setName: 이름을 변경할 때 사용하는 함수
  const [name, setName] = useState("");

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
            <input type="number" style={inputStyle} placeholder="YYYY" />
          </div>

          <div>
            <label
              style={{ fontSize: "24px", fontWeight: 600, color: "#fd8da0" }}
            >
              * 학년
            </label>
            <input type="text" style={inputStyle} />
          </div>

          <div>
            <label
              style={{ fontSize: "24px", fontWeight: 600, color: "#fd8da0" }}
            >
              출생일
            </label>
            <input type="text" style={inputStyle} placeholder="MM/DD" />
          </div>

          <div>
            <label
              style={{ fontSize: "24px", fontWeight: 600, color: "#fd8da0" }}
            >
              학교
            </label>
            <input type="text" style={inputStyle} />
          </div>

          <div>
            <label
              style={{ fontSize: "24px", fontWeight: 600, color: "#fd8da0" }}
            >
              성별
            </label>
            <select style={inputStyle}>
              <option>선택해주세요</option>
              <option>남성</option>
              <option>여성</option>
              <option>그 외</option>
              <option>답하지 않음</option>
            </select>
          </div>
        </div>

        {/* --- 하단 버튼 영역 --- */}
        <div style={{ textAlign: "right", marginTop: "20px" }}>
          <button
            className="btn-primary"
            // [핵심 기능] 버튼 클릭 시 동작
            onClick={() =>
              // navigate(이동할 주소, { 추가 옵션 })
              // state: { userName: name } -> 입력받은 'name'을 'userName'이라는 꼬리표를 달아 다음 페이지로 보냄
              navigate("/create-game", { state: { userName: name } })
            }
          >
            &gt; 회원 가입 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
