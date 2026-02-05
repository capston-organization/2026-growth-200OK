/**
 * [MiniShortGame1 클래스]
 * - 컨셉: 스마트폰 채팅 앱 스타일의 영어 단답형 퀴즈
 * - 흐름: 상대방이 질문(말풍선) -> 내가 빈칸이 뚫린 대답(말풍선) -> 키보드로 타이핑 -> 전송
 * - 특징: MainScene에서 호출되며, 성공/실패 여부를 다시 MainScene으로 보고함.
 */
class MiniShortGame1 extends Phaser.Scene {
  constructor() {
    // Scene의 고유 키(ID)를 설정합니다. MainScene에서 이 키로 호출합니다.
    super({ key: "MiniShortGame1" });
  }

  /**
   * [init: 데이터 수신]
   * scene.launch('MiniShortGame1', data)를 통해 전달받은 데이터를 처리합니다.
   * @param {object} data - { parent: MainScene인스턴스, speedLevel: 현재레벨 }
   */
  init(data) {
    this.mainScene = data.parent; // 결과 보고를 위해 부모 씬 저장
    this.speedLevel = data.speedLevel || 1; // 레벨이 없으면 기본 1
  }

  /**
   * [create: 화면 구성 및 로직 초기화]
   * 게임이 시작될 때 실행되는 메인 함수입니다.
   */
  create() {
    const { width, height } = this.scale; // 현재 화면 크기

    // 1. 배경 설정 (성공: 노랑, 실패: 빨강으로 바뀌는 역할)
    this.background = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0xffffff, // 기본 흰색
    );
    this.background.setDepth(0); // 가장 뒤쪽에 배치

    // 2. 타이머(제한시간) 설정
    // 기본 8초에서 레벨당 1초씩 줄어듦 (최소 4초 보장)
    let durationSec = 8 - (this.speedLevel - 1);
    if (durationSec < 4) durationSec = 4;
    this.totalTime = durationSec * 1000; // 밀리초(ms) 단위 변환
    this.timeLeft = this.totalTime;

    // 게임 상태 플래그
    this.isGameActive = true; // 타임오버 체크용
    this.isResolved = false; // 이미 답을 제출했는지 체크
    this.gameResult = false; // 최종 성공 여부

    // 문제 데이터 가져오기 (랜덤 선택)
    this.problemData = this.getProblem();
    this.userInputValue = ""; // 사용자가 입력 중인 문자열

    // --- UI 컨테이너 생성 ---
    // UI 요소들을 그룹으로 묶기 위해 컨테이너 사용 (좌표 0,0 기준)
    this.uiContainer = this.add.container(0, 0);

    // 3. 스마트폰 본체 그리기 (화면 중앙)
    // 화면 크기에 따라 폰 크기도 반응형으로 조절
    this.phoneWidth = width * 0.5;
    if (this.phoneWidth < 300) this.phoneWidth = 300; // 너무 작아지지 않게 방지
    this.phoneHeight = height * 0.7;

    this.phoneX = width / 2;
    this.phoneY = height * 0.45;

    // 폰 배경 (회색빛) 및 테두리
    this.phoneBody = this.add.rectangle(
      0,
      0,
      this.phoneWidth,
      this.phoneHeight,
      0xe0e0eb,
    );
    this.phoneBody.setStrokeStyle(20, 0x000000); // 두꺼운 검은 테두리

    // 폰 내부 요소들을 담을 컨테이너 (폰의 중심 좌표를 기준점(0,0)으로 삼음)
    this.phoneContainer = this.add.container(this.phoneX, this.phoneY);
    this.phoneContainer.add(this.phoneBody);

    // 4. 채팅 말풍선 UI 생성 (질문 & 답변)
    this.createChatBubbles();

    // 5. 입력창 UI 생성 (텍스트 박스 & 전송 버튼)
    this.createInputUI();

    // 6. 타이머 바 생성 (화면 하단 붉은 게이지)
    this.timerBarBg = this.add
      .rectangle(width * 0.5, height * 0.95, width * 0.9, 20, 0xcccccc)
      .setOrigin(0.5);
    this.timerBarFill = this.add
      .rectangle(width * 0.05, height * 0.95, width * 0.9, 20, 0xff0000)
      .setOrigin(0, 0.5); // 왼쪽 정렬(Scale 조절을 위해)

    // 7. 키보드 입력 이벤트 연결
    this.setupInputListener();

    // 브라우저 크기 변경 시 UI 재배치 이벤트 연결
    this.scale.on("resize", this.resize, this);
  }

  /**
   * [UI] 말풍선(Chat Bubble) 생성
   * - 상대방(질문): 좌측 상단, 흰색 배경
   * - 나(답변): 우측 중단, 노란색 배경 (빈칸 포함)
   */
  createChatBubbles() {
    // 말풍선 크기 및 위치 계산 (폰 크기 기준 상대 좌표)
    const bubbleWidth = this.phoneWidth * 0.8;
    const bubbleHeight = this.phoneHeight * 0.15;
    const otherX = -this.phoneWidth / 2 + 20 + bubbleWidth / 2; // 왼쪽 정렬
    const otherY = -this.phoneHeight / 3; // 위쪽 배치

    // 상대방 말풍선 (흰색)
    const otherBubbleBg = this.add.rectangle(
      otherX,
      otherY,
      bubbleWidth,
      bubbleHeight,
      0xffffff,
    );
    otherBubbleBg.setStrokeStyle(2, 0x000000);

    // 상대방 텍스트 (질문)
    const otherText = this.add
      .text(otherX, otherY, this.problemData.question, {
        fontSize: "20px",
        color: "#000000",
        fontFamily: "Arial",
        align: "left",
        wordWrap: { width: bubbleWidth - 20 }, // 자동 줄바꿈
      })
      .setOrigin(0.5);

    // 내 말풍선 위치 계산
    const myX = this.phoneWidth / 2 - 20 - bubbleWidth / 2; // 오른쪽 정렬
    const myY = 0; // 중앙 배치

    // 내 말풍선 (노란색)
    const myBubbleBg = this.add.rectangle(
      myX,
      myY,
      bubbleWidth,
      bubbleHeight,
      0xffff00,
    );
    myBubbleBg.setStrokeStyle(2, 0x000000);

    // 내 텍스트 (빈칸이 뚫려있는 문장)
    this.myTextObj = this.add
      .text(myX, myY, this.problemData.displaySentence, {
        fontSize: "20px",
        color: "#000000",
        fontFamily: "Arial",
        fontStyle: "bold",
        align: "right",
        wordWrap: { width: bubbleWidth - 20 },
      })
      .setOrigin(0.5);

    // 폰 컨테이너에 추가 (폰이 움직이면 같이 움직임)
    this.phoneContainer.add([
      otherBubbleBg,
      otherText,
      myBubbleBg,
      this.myTextObj,
    ]);
  }

  /**
   * [UI] 입력창(Input UI) 생성
   * - 흰색 텍스트 박스, 깜빡이는 커서, 전송 버튼
   */
  createInputUI() {
    const inputAreaY = this.phoneHeight / 2 - 40; // 폰 하단부
    const inputWidth = this.phoneWidth * 0.7;
    const inputHeight = 40;
    const inputX = -this.phoneWidth / 2 + 20 + inputWidth / 2;

    // 입력창 배경
    this.inputBg = this.add.rectangle(
      inputX,
      inputAreaY,
      inputWidth,
      inputHeight,
      0xffffff,
    );
    this.inputBg.setStrokeStyle(2, 0x000000);

    // 실제 입력된 텍스트가 표시될 객체
    this.inputTextDisplay = this.add
      .text(inputX, inputAreaY, "", {
        fontSize: "24px",
        color: "#000000",
        fontFamily: "Courier", // 코딩 폰트 (고정폭) 사용
      })
      .setOrigin(0.5);

    // 커서 (| 모양) - 깜빡임 효과용
    this.cursor = this.add
      .text(inputX, inputAreaY, "|", {
        fontSize: "24px",
        color: "#000000",
      })
      .setOrigin(0.5);
    this.cursorTimer = 0;

    // 전송 버튼
    const btnSize = 40;
    const btnX = inputX + inputWidth / 2 + 10 + btnSize / 2;

    this.sendBtnBg = this.add.rectangle(
      btnX,
      inputAreaY,
      btnSize,
      btnSize,
      0xdddddd,
    );
    this.sendBtnBg.setStrokeStyle(2, 0x000000);

    // 전송 아이콘 (▲)
    this.sendIcon = this.add
      .text(btnX, inputAreaY, "▲", {
        fontSize: "20px",
        color: "#000000",
      })
      .setOrigin(0.5);

    // 마우스 클릭 이벤트 (전송 버튼 누름)
    this.sendBtnBg.setInteractive();
    this.sendBtnBg.on("pointerdown", () => this.checkAnswer());

    this.phoneContainer.add([
      this.inputBg,
      this.inputTextDisplay,
      this.cursor,
      this.sendBtnBg,
      this.sendIcon,
    ]);
  }

  /**
   * [Event] 키보드 입력 처리
   * - Phaser의 input.keyboard 이벤트를 사용
   */
  setupInputListener() {
    this.input.keyboard.on("keydown", (event) => {
      // 이미 끝났거나(Resolved) 타임오버면 입력 차단
      if (this.isResolved || !this.isGameActive) return;

      // 1. Enter 키: 정답 제출
      if (event.key === "Enter") {
        this.checkAnswer();
      }
      // 2. Backspace 키: 글자 지우기
      else if (event.key === "Backspace") {
        if (this.userInputValue.length > 0) {
          this.userInputValue = this.userInputValue.slice(0, -1);
          this.updateInputDisplay();
        }
      }
      // 3. 일반 문자 입력 (영문, 숫자만 허용)
      else if (event.key.length === 1 && this.userInputValue.length < 15) {
        const regex = /^[a-zA-Z0-9]$/; // 정규식: 알파벳 또는 숫자
        if (regex.test(event.key)) {
          this.userInputValue += event.key;
          this.updateInputDisplay();
        }
      }
    });
  }

  /**
   * [UI] 입력값 화면 갱신 및 커서 이동
   */
  updateInputDisplay() {
    this.inputTextDisplay.setText(this.userInputValue);
    // 텍스트 길이에 맞춰 커서를 글자 오른쪽 끝으로 이동
    const textWidth = this.inputTextDisplay.width;
    this.cursor.x = this.inputTextDisplay.x + textWidth / 2 + 5;
  }

  /**
   * [Update Loop] 매 프레임마다 실행되는 함수
   * @param {number} time - 현재 시간
   * @param {number} delta - 이전 프레임과의 시간 차이(ms)
   */
  update(time, delta) {
    if (!this.isGameActive) return;

    // 1. 타이머 감소 로직
    this.timeLeft -= delta;
    const ratio = Math.max(0, this.timeLeft / this.totalTime); // 남은 비율 계산
    this.timerBarFill.width = this.scale.width * 0.9 * ratio; // 게이지 바 너비 줄임

    // 2. 시간 초과(Game Over) 체크
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      if (!this.isResolved) {
        // 아직 답을 못 냈는데 시간이 다 됨 -> 실패
        this.handleFail();
      }
      this.finishGame();
      return;
    }

    // 3. 커서 깜빡임 효과 (0.5초 간격)
    if (!this.isResolved) {
      this.cursorTimer += delta;
      if (this.cursorTimer > 500) {
        this.cursor.setVisible(!this.cursor.visible); // 보였다 안 보였다 토글
        this.cursorTimer = 0;
      }
    } else {
      this.cursor.setVisible(false); // 게임 끝나면 커서 숨김
    }
  }

  /**
   * [Logic] 정답 체크 로직
   */
  checkAnswer() {
    if (this.isResolved) return; // 중복 제출 방지

    this.isResolved = true; // 제출 완료 플래그
    const userAnswer = this.userInputValue.trim().toLowerCase(); // 소문자로 변환하여 비교
    const correctAnswer = this.problemData.answer.toLowerCase();

    if (userAnswer === correctAnswer) {
      this.handleSuccess();
    } else {
      this.handleFail();
    }
  }

  /**
   * [Result] 성공 처리
   */
  handleSuccess() {
    this.gameResult = true;
    this.background.setFillStyle(0xffff00); // 배경 노란색 (성공 피드백)

    // ★ [핵심] 정규표현식 /_+/ 을 사용하여 빈칸 채우기
    // 밑줄(_)이 하나 이상 연속된 부분을 찾아 사용자가 입력한 값으로 교체
    // 예: "I need __ umbrella" -> "I need an umbrella"
    const completedSentence = this.problemData.displaySentence.replace(
      /_+/,
      this.userInputValue,
    );

    this.myTextObj.setText(completedSentence); // 완성된 문장 보여주기
    this.myTextObj.setColor("#0000ff"); // 파란색 텍스트로 강조

    // 입력창 UI 흐리게 처리 (비활성화 느낌)
    this.inputBg.setFillStyle(0xeeeeee);
    this.sendBtnBg.setFillStyle(0xaaaaaa);
  }

  /**
   * [Result] 실패 처리
   */
  handleFail() {
    this.gameResult = false;
    this.background.setFillStyle(0xff0000); // 배경 붉은색 (실패 피드백)

    // 입력창 UI 흐리게 처리
    this.inputBg.setFillStyle(0xeeeeee);
    this.sendBtnBg.setFillStyle(0xaaaaaa);
  }

  /**
   * [System] 게임 종료 및 결과 보고
   */
  finishGame() {
    this.isGameActive = false;
    this.scale.off("resize", this.resize, this); // 리사이즈 이벤트 제거 (메모리 누수 방지)

    // MainScene에 결과 전달 (성공/실패)
    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      this.mainScene.handleMiniGameResult(this.gameResult);
    }
    this.scene.stop(); // 현재 씬 종료
  }

  /**
   * [Data] 문제 데이터 생성기
   * - 실제로는 DB나 JSON 파일에서 가져올 수도 있음
   */
  getProblem() {
    const problems = [
      {
        question: "I will go to a hospital.",
        displaySentence: "Do you want to go ___ me?",
        answer: "with",
      },
      {
        question: "Look at the sky! It's raining.",
        displaySentence: "I need __ umbrella.", // 밑줄 2개
        answer: "an",
      },
      {
        question: "I am very hungry now.",
        displaySentence: "___'s eat some pizza.", // 밑줄 3개
        answer: "Let",
      },
      {
        question: "Is this your pencil?",
        displaySentence: "__, it is not.", // 밑줄 2개
        answer: "No",
      },
      {
        question: "She runs very fast.",
        displaySentence: "I ___'t catch her.", // 밑줄 3개
        answer: "can",
      },
    ];
    return Phaser.Utils.Array.GetRandom(problems); // 배열 중 하나 랜덤 반환
  }

  /**
   * [System] 반응형 처리 (창 크기 조절 시)
   */
  resize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    // 배경 크기 재설정
    this.background.setPosition(width / 2, height / 2);
    this.background.setSize(width, height);

    // 폰 위치/크기 재설정
    this.phoneWidth = width * 0.5;
    if (this.phoneWidth < 300) this.phoneWidth = 300;
    this.phoneHeight = height * 0.7;
    this.phoneX = width / 2;
    this.phoneY = height * 0.45;

    this.phoneContainer.setPosition(this.phoneX, this.phoneY);
    this.phoneBody.setSize(this.phoneWidth, this.phoneHeight);

    // 타이머 바 위치 재설정
    this.timerBarBg.setPosition(width * 0.5, height * 0.95);
    this.timerBarBg.setSize(width * 0.9, 20);
    this.timerBarFill.setPosition(width * 0.05, height * 0.95);
  }
}
