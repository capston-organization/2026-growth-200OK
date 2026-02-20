// src/pages/LoginPage.jsx
import React from "react";
// useNavigate: React Router에서 제공하는 '페이지 이동'을 담당하는 함수(Hook)입니다.
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  // navigate라는 변수에 이동 기능을 할당합니다.
  // 이제 navigate('/주소')를 호출하면 해당 페이지로 바뀝니다.
  const navigate = useNavigate();

  return (
    // style={{ ... }}: CSS 파일에 적지 않고, 직접 자바스크립트 객체로 스타일을 주는 방식(Inline Style)입니다.
    // 간단한 수정은 여기서 바로 할 수 있습니다.
    <div className="page-container" style={{ backgroundColor: "#FFF0F5" }}>
      {/* 흰색 박스 설정 */}
      <div
        className="white-box"
        style={{
          maxWidth: "1000px",
          height: "600px",
          display: "flex", // 내부 요소 정렬을 위해 Flexbox 사용
          flexDirection: "column", // 요소들을 세로로 배치
          justifyContent: "center", // 세로 기준 중앙 정렬
        }}
      >
        {/* 로고 자리: 나중에 이미지 태그 <img>로 교체할 부분입니다 */}
        <div className="logo-placeholder">Logo</div>

        {/* 제목 텍스트 */}
        <h1
          style={{
            color: "#FF69B4",
            fontFamily: "cursive",
            fontSize: "36px",
            fontWeight: "bold",
          }}
        >
          learning village
        </h1>

        {/* 구글 로그인 버튼 */}
        <button
          className="btn-primary"
          // 버튼 전용 스타일 오버라이딩 (덮어쓰기)
          style={{
            width: "60%", // 박스 너비의 80%만 차지하게
            height: "20%", // 박스 너비의 20%만 차지하게
            margin: "30px auto", // 위아래 30px 띄우고, 좌우는 자동(중앙정렬)
            display: "flex", // 아이콘과 글자를 가로로 나란히 놓기 위해
            alignItems: "center", // 세로 중앙 정렬
            justifyContent: "center", // 가로 중앙 정렬
            gap: "15px", // 아이콘과 글자 사이 간격
          }}
          // [중요] 클릭 시 '/signup' 주소로 이동! (React Router가 처리함)
          onClick={() => navigate("/signup")}
        >
          {/* 파란색 원 (구글 로고 임시 대용) */}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "blue",
            }}
          ></div>{" "}
          {/* 버튼 텍스트 */}
          <h4 style={{ fontSize: "24px" }}>Google로 시작하기</h4>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
