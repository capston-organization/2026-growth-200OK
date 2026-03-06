/* global Phaser */
/**
 * [MiniShortGame1 클래스]
 * -------------------------------------------------------------------------
 * - 컨셉: 스마트폰 채팅 앱 스타일의 영어 단답형 퀴즈 게임
 * - 흐름: 문제 표시 -> 타이머 진행 -> 정답 입력 -> (로딩 애니메이션) -> 결과 판정
 * - 주요 특징:
 * 1. 오답 시 빈칸을 '?'로 표시
 * 2. 타이머 아이콘 위에 남은 초(Second) 표시 및 색상 변화 (흰->노->주->빨)
 * 3. 결과 판정 전 '로딩 중' 애니메이션 연출 후 이모지 출력
 * * [수정 사항: 반응형 적용]
 * - MiniOXGame1과 동일한 기준 해상도(1280x720) 기반의 globalScale 적용
 * -------------------------------------------------------------------------
 */
class MiniShortGame1 extends Phaser.Scene {
  constructor() {
    super({ key: "MiniShortGame1" });
  }

  // [초기화] 상위 씬에서 전달받은 데이터(난이도 등) 처리
  init(data) {
    this.mainScene = data.parent;
    this.speedLevel = data.speedLevel || 1; // 기본 속도 레벨 1
    this.currentProblem = data.problem; // ★ 추가: MainScene에서 넘겨준 1개의 문제 저장

    // ★ [반응형 기준점] 1280x720 해상도 기준
    this.baseWidth = 1280;
    this.baseHeight = 720;
    this.globalScale = 1;
  }

  // [에셋 로드] 게임에 필요한 이미지 리소스 불러오기
  preload() {
    this.load.setPath("../../MiniGames/ShortAnswerGames/MiniGame1/assets/");

    // 기본 UI 이미지
    this.load.image("background", "Background1.png");
    this.load.image("smartScreen", "SmartScreen.png");
    this.load.image("questionBubble", "Question.png");
    this.load.image("answerBubble", "Answer.png");
    this.load.image("emoBubble", "Emo.png");
    this.load.image("inputBox", "InputBox.png");
    this.load.image("submitButton", "SubmitButton.png");
    this.load.image("timerIcon", "Timer.png");
    this.load.image("timerBarFrame", "TimerBar.png");

    // ★ [추가] 애니메이션 및 결과 이모지 리소스
    this.load.image("loading1", "Loading1.png");
    this.load.image("loading2", "Loading2.png");
    this.load.image("loading3", "Loading3.png");
    this.load.image("successEmo", "SuccessEmo.png");
    this.load.image("failedEmo", "FailedEmo.png");
  }

  // [게임 생성] 화면 구성 및 로직 초기화
  create() {
    const { width, height } = this.scale;

    // 텍스트 폰트 설정 (기본 스타일)
    this.inputTextDisplay = this.add
      .text(0, 0, "", {
        fontSize: "28px",
        color: "#000000",
        fontFamily: "Nunito",
        fontWeight: "bold",
      })
      .setOrigin(0.5);

    // 1. 배경 설정
    // 위치와 크기는 refreshLayout에서 잡음
    this.background = this.add.image(width / 2, height / 2, "background");
    this.background.setDepth(-1); // 맨 뒤로 보냄

    // 2. 타이머 로직 설정 (난이도에 따라 시간 조절)
    let durationSec = 8 - (this.speedLevel - 1);
    if (durationSec < 4) durationSec = 4; // 최소 4초 보장
    this.totalTime = durationSec * 1000;
    this.timeLeft = this.totalTime;

    // 게임 상태 플래그
    this.isGameActive = true; // 게임 진행 중 여부
    this.isResolved = false; // 정답 제출 완료 여부
    this.gameResult = false; // 최종 성공/실패 여부

    // ★ 수정: 하드코딩 함수 대신 API로 받은 문제를 게임 데이터로 변환
    // 상대방 말풍선에는 질문 전체를 띄우고, 내 말풍선에는 기본 빈칸(____)을 띄웁니다.
    this.problemData = {
      question: this.currentProblem.question,
      displaySentence: "____", // 단답형 입력을 위한 기본 빈칸
      answer: String(this.currentProblem.correctAnswer), // 정답 문자열 처리
    };
    this.userInputValue = "";

    // UI 컨테이너 (타이머 등을 담을 레이어 - 맨 위)
    this.uiContainer = this.add.container(0, 0);
    this.uiContainer.setDepth(10);

    // 3. 스마트폰 본체 이미지 배치
    this.phoneBody = this.add.image(0, 0, "smartScreen");
    this.phoneContainer = this.add.container(0, 0);
    this.phoneContainer.add(this.phoneBody);

    // ★ [추가] 로딩 애니메이션 정의 (0.6초간 3프레임 재생)
    if (!this.anims.exists("loading_anim")) {
      this.anims.create({
        key: "loading_anim",
        frames: [{ key: "loading1" }, { key: "loading2" }, { key: "loading3" }],
        frameRate: 5, // 초당 5프레임
        repeat: 1, // 1회 재생 + 1회 반복 = 총 2회 재생
      });
    }

    // 4. 채팅 말풍선 UI 생성
    this.createChatBubbles();

    // 5. 입력창 UI 생성
    this.createInputUI();

    // 6. 타이머 UI 생성 (바 + 아이콘 + 텍스트)
    this.createTimerUI();

    // 7. 키보드 입력 리스너 등록
    this.setupInputListener();

    // 8. 레이아웃 배치 (반응형 대응)
    // ★ 반응형 이벤트 등록
    this.scale.on("resize", this.refreshLayout, this);
    this.refreshLayout(); // 초기 실행
  }

  // [UI] 채팅 말풍선 및 결과/로딩 이미지 생성
  createChatBubbles() {
    // 상대방 말풍선 (질문)
    this.otherBubbleBg = this.add.image(0, 0, "questionBubble");
    this.otherText = this.add
      .text(0, 0, this.problemData.question, {
        fontSize: "24px",
        color: "#000000",
        fontFamily: "Nunito",
        align: "left",
        wordWrap: { width: 100 },
      })
      .setOrigin(0.5);

    // 내 말풍선 (답변 빈칸 포함)
    this.myBubbleBg = this.add.image(0, 0, "answerBubble");
    this.myTextObj = this.add
      .text(0, 0, this.problemData.displaySentence, {
        fontSize: "24px",
        color: "#000000",
        fontFamily: "Nunito",
        fontStyle: "bold",
        align: "right",
        wordWrap: { width: 100 },
      })
      .setOrigin(0.5);

    // 결과/로딩용 말풍선 배경 (초기엔 숨김)
    this.emoBubbleBg = this.add.image(0, 0, "emoBubble").setVisible(false);

    // ★ [추가] 로딩 애니메이션 스프라이트 (초기엔 숨김)
    this.loadingSprite = this.add.sprite(0, 0, "loading1").setVisible(false);

    // ★ [추가] 성공/실패 이모지 이미지 (초기엔 숨김)
    this.successEmo = this.add.image(0, 0, "successEmo").setVisible(false);
    this.failedEmo = this.add.image(0, 0, "failedEmo").setVisible(false);

    // 폰 컨테이너에 일괄 추가
    this.phoneContainer.add([
      this.otherBubbleBg,
      this.otherText,
      this.myBubbleBg,
      this.myTextObj,
      this.emoBubbleBg,
      this.loadingSprite, // 로딩
      this.successEmo, // 성공
      this.failedEmo, // 실패
    ]);
  }

  // [UI] 입력창, 커서, 전송 버튼 생성
  createInputUI() {
    this.inputBg = this.add.image(0, 0, "inputBox");
    this.inputTextDisplay = this.add
      .text(0, 0, "", {
        fontSize: "28px",
        color: "#000000",
        fontFamily: "Nunito",
      })
      .setOrigin(0.5);

    // 커서 ('|' 모양)
    this.cursor = this.add
      .text(0, 0, "|", { fontSize: "28px", color: "#000000" })
      .setOrigin(0.5);
    this.cursorTimer = 0; // 커서 깜빡임 타이머

    // 전송 버튼 (클릭 시 정답 체크)
    this.sendBtnBg = this.add.image(0, 0, "submitButton").setInteractive();
    this.sendBtnBg.on("pointerdown", () => this.checkAnswer());

    this.phoneContainer.add([
      this.inputBg,
      this.inputTextDisplay,
      this.cursor,
      this.sendBtnBg,
    ]);
  }

  // [UI] 타이머 바, 아이콘, 남은 시간 텍스트 생성
  createTimerUI() {
    this.timerBarFrame = this.add.image(0, 0, "timerBarFrame");
    this.timerFillContainer = this.add.container(0, 0);

    // 빨간색 게이지 바
    this.timerBarFill = this.add
      .rectangle(0, 0, 100, 10, 0xff0000)
      .setOrigin(0, 0.5);
    this.timerFillContainer.add(this.timerBarFill);

    // 타이머 아이콘
    this.timerIcon = this.add.image(0, 0, "timerIcon");

    // ★ [추가] 타이머 텍스트 (아이콘 위에 초 표시)
    this.timerText = this.add
      .text(0, 0, "", {
        fontSize: "40px",
        color: "#ffffff",
        fontFamily: "Nunito",
        fontWeight: "bold",
      })
      .setOrigin(0.55, 0.55);

    // UI 컨테이너에 추가
    this.uiContainer.add([
      this.timerBarFrame,
      this.timerFillContainer,
      this.timerIcon,
      this.timerText,
    ]);
  }

  // [이벤트] 키보드 입력 처리
  setupInputListener() {
    this.input.keyboard.on("keydown", (event) => {
      // 게임 종료 상태면 입력 무시
      if (this.isResolved || !this.isGameActive) return;

      if (event.key === "Enter") {
        this.checkAnswer(); // 엔터키로 제출
      } else if (event.key === "Backspace") {
        // 백스페이스: 글자 지우기
        if (this.userInputValue.length > 0) {
          this.userInputValue = this.userInputValue.slice(0, -1);
          this.updateInputDisplay();
        }
      } else if (event.key.length === 1 && this.userInputValue.length < 15) {
        // 일반 문자 입력 (영문/숫자만 허용, 최대 15자)
        const regex = /^[a-zA-Z0-9]$/;
        if (regex.test(event.key)) {
          this.userInputValue += event.key;
          this.updateInputDisplay();
        }
      }
    });
  }

  // [UI] 입력된 텍스트 화면 갱신 및 커서 이동
  updateInputDisplay() {
    this.inputTextDisplay.setText(this.userInputValue);
    const textWidth = this.inputTextDisplay.width;
    // 커서를 텍스트 끝으로 이동 (globalScale 적용 필요 시 보정)
    // 여기서는 textWidth가 이미 스케일된 폰트 크기를 반영하므로, 간격만 스케일 적용
    this.cursor.x =
      this.inputTextDisplay.x + textWidth / 2 + 5 * this.globalScale;
  }

  // [게임 루프] 매 프레임 실행
  update(time, delta) {
    if (!this.isGameActive) return;

    // 1. 타이머 시간 감소
    this.timeLeft -= delta;

    // 2. 게이지 바 길이 업데이트
    const ratio = Math.max(0, this.timeLeft / this.totalTime);

    // maxWidth는 refreshLayout에서 설정됨
    if (this.timerBarFill.maxWidth) {
      this.timerBarFill.width = this.timerBarFill.maxWidth * ratio;
    }

    // ★ 3. 남은 시간 텍스트 및 색상 업데이트
    const secondsLeft = Math.ceil(this.timeLeft / 1000);
    this.timerText.setText(secondsLeft);
    this.updateTimerColor(secondsLeft);

    // 4. 시간 초과 체크
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.timerText.setText(0); // 0초로 고정

      if (!this.isResolved) {
        this.gameResult = false; // 미제출 시 실패 처리
      }
      this.finishGame();
      return;
    }

    // 5. 커서 깜빡임 효과 (0.5초 주기)
    if (!this.isResolved) {
      this.cursorTimer += delta;
      if (this.cursorTimer > 500) {
        this.cursor.setVisible(!this.cursor.visible);
        this.cursorTimer = 0;
      }
    } else {
      this.cursor.setVisible(false); // 제출 후엔 커서 숨김
    }
  }

  // ★ [헬퍼] 남은 초에 따라 타이머 글씨 색 변경 (흰->노->주->빨)
  updateTimerColor(seconds) {
    if (seconds <= 1)
      this.timerText.setColor("#ff0000"); // 1초 이하: 빨강
    else if (seconds === 2)
      this.timerText.setColor("#ffa500"); // 2초: 주황
    else if (seconds === 3)
      this.timerText.setColor("#ffff00"); // 3초: 노랑
    else this.timerText.setColor("#ffffff"); // 그 외: 흰색
  }

  // [로직] 정답 체크
  checkAnswer() {
    if (this.isResolved) return; // 이미 제출했으면 무시

    this.isResolved = true;
    const userAnswer = this.userInputValue.trim().toLowerCase();
    const correctAnswer = this.problemData.answer.toLowerCase();

    if (userAnswer === correctAnswer) {
      this.handleSuccess();
    } else {
      this.handleFail();
    }
  }

  // [결과] 정답 처리
  handleSuccess() {
    this.gameResult = true;

    // 배경색 변경 (DarkBlue)
    this.background.setTint(0x00008b);

    // 말풍선 빈칸을 입력한 단어로 채움
    const completedSentence = this.problemData.displaySentence.replace(
      /_+/,
      this.userInputValue,
    );
    this.myTextObj.setText(completedSentence);
    this.myTextObj.setColor("#0000ff"); // 파란색 텍스트

    // 버튼 비활성화
    this.sendBtnBg.setTint(0xaaaaaa);

    // ★ 성공 연출 시퀀스 실행
    this.playResultSequence(true);
  }

  // [결과] 오답 처리
  handleFail() {
    this.gameResult = false;

    // 버튼 비활성화
    this.sendBtnBg.setTint(0xaaaaaa);

    // 배경색 변경 (Red)
    this.background.setTint(0xff0000);

    // ★ [핵심] 오답 시 빈칸을 '?'로 변경하여 표시
    const failedSentence = this.problemData.displaySentence.replace(/_+/, "?");
    this.myTextObj.setText(failedSentence);
    this.myTextObj.setColor("#ff0000"); // 빨간색 텍스트

    // ★ 실패 연출 시퀀스 실행
    this.playResultSequence(false);
  }

  /**
   * ★ [연출] 결과 처리 애니메이션 함수
   * 1. 결과 말풍선 표시
   * 2. 로딩 애니메이션 재생 (약 1.2초)
   * 3. 종료 후 성공/실패 이모지 표시
   */
  playResultSequence(isSuccess) {
    // 1. 말풍선 및 로딩 스프라이트 표시
    this.emoBubbleBg.setVisible(true);
    this.loadingSprite.setVisible(true);

    // 2. 애니메이션 재생
    this.loadingSprite.play("loading_anim");

    // 3. 애니메이션 완료(2회 반복 후) 이벤트 리스너
    this.loadingSprite.once("animationcomplete", () => {
      // 씬이 파괴되었으면 실행 안 함
      if (!this.scene.isActive()) return;

      this.loadingSprite.setVisible(false); // 로딩 숨김

      if (isSuccess) {
        this.successEmo.setVisible(true); // 성공 이모지
      } else {
        this.failedEmo.setVisible(true); // 실패 이모지
      }
    });
  }

  // [종료] 게임 마무리 및 상위 씬 통지
  finishGame() {
    this.isGameActive = false;
    this.scale.off("resize", this.refreshLayout, this);

    // 실행 중인 애니메이션 정지
    if (this.loadingSprite && this.loadingSprite.anims) {
      this.loadingSprite.stop();
    }

    // 결과 전달
    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      // ★ 수정: 성공 여부와 함께 '방금 푼 문제' 객체를 같이 넘겨줌
      this.mainScene.handleMiniGameResult(this.gameResult, this.currentProblem);
    }
    this.scene.stop();
  }

  // =================================================================
  // [System] 반응형 레이아웃 재계산 (핵심 수정)
  // =================================================================
  refreshLayout() {
    const width = this.scale.width;
    const height = this.scale.height;

    // 1. globalScale 계산 (MiniOXGame1 방식)
    const scaleX = width / this.baseWidth;
    const scaleY = height / this.baseHeight;
    this.globalScale = Math.min(scaleX, scaleY);

    // 2. 배경 (꽉 채우기)
    this.background
      .setPosition(width / 2, height / 2)
      .setDisplaySize(width, height);

    // 3. 스마트폰 본체
    // 기존 width * 0.6 대신, 고정 비율(예: 1280x720 기준 적정 크기)에 globalScale 적용
    const phoneBaseW = 900; // 1280의 약 60%
    const phoneBaseH = 864; // 720의 약 120%
    const phoneWidth = phoneBaseW * this.globalScale;
    const phoneHeight = phoneBaseH * this.globalScale;

    const phoneX = width / 2;
    const phoneY = height * 0.45;

    this.phoneContainer.setPosition(phoneX, phoneY);
    this.phoneBody.setDisplaySize(phoneWidth, phoneHeight);

    // 4. 내부 요소 크기 및 폰트 계산
    const bubbleWidth = phoneWidth * 0.6;
    const bubbleHeight = phoneHeight * 0.18;
    const padding = 20 * this.globalScale; // 패딩도 스케일 적용

    const fontSizeMain = `${28 * this.globalScale}px`;
    const fontSizeInput = `${28 * this.globalScale}px`;

    // (1) 상대방 말풍선 (상단)
    const otherX = -phoneWidth / 2.3 + padding + bubbleWidth / 2;
    const otherY = -phoneHeight / 4;

    this.otherBubbleBg
      .setPosition(otherX, otherY)
      .setDisplaySize(bubbleWidth, bubbleHeight);

    this.otherText
      .setPosition(otherX, otherY * 1.075)
      .setFontSize(fontSizeMain)
      .setWordWrapWidth(bubbleWidth - padding * 2);

    // (2) 내 말풍선 (중단)
    const myX = phoneWidth / 2.3 - padding - bubbleWidth / 2;
    const myY = otherY + bubbleHeight + padding;

    this.myBubbleBg
      .setPosition(myX, myY)
      .setDisplaySize(bubbleWidth, bubbleHeight);

    this.myTextObj
      .setPosition(myX, myY * 1.4)
      .setFontSize(fontSizeMain)
      .setWordWrapWidth(bubbleWidth - padding * 2);

    // (3) 결과 이모지 말풍선 (하단)
    const emoWidth = bubbleWidth * 0.5;
    const emoHeight = bubbleHeight;
    const emoX = -phoneWidth / 1.75 + padding + bubbleWidth / 2;
    const emoY = myY + bubbleHeight + padding;

    this.emoBubbleBg
      .setPosition(emoX, emoY)
      .setDisplaySize(emoWidth, emoHeight);

    // 로딩/성공/실패 아이콘
    const iconXSize = emoWidth * 0.5;
    const iconYSize = emoHeight * 0.18;
    const emoXSize = emoWidth * 0.55;
    const emoYSize = emoHeight * 0.6;

    this.loadingSprite
      .setPosition(emoX, emoY / 1.1)
      .setDisplaySize(iconXSize, iconYSize);
    this.successEmo
      .setPosition(emoX, emoY / 1.1)
      .setDisplaySize(emoXSize, emoYSize);
    this.failedEmo
      .setPosition(emoX, emoY / 1.1)
      .setDisplaySize(emoXSize, emoYSize);

    // (4) 입력창 및 버튼 (폰 하단)
    const inputAreaY = phoneHeight / 3.3;
    const inputWidth = phoneWidth * 0.75;
    const inputHeight = 85 * this.globalScale;
    const btnSize = inputHeight;
    const inputX = -phoneWidth / 2 + padding + inputWidth / 1.8;

    this.inputBg
      .setPosition(inputX, inputAreaY)
      .setDisplaySize(inputWidth, inputHeight);

    this.inputTextDisplay
      .setPosition(inputX, inputAreaY)
      .setFontSize(fontSizeInput);

    this.cursor.setPosition(inputX, inputAreaY).setFontSize(fontSizeInput);

    // 커서 위치 재조정
    this.updateInputDisplay();

    const btnX = inputX + inputWidth / 2 + padding + btnSize / 3;
    this.sendBtnBg
      .setPosition(btnX, inputAreaY)
      .setDisplaySize(btnSize, btnSize);

    // 6. 타이머 UI 조정
    const timerY = height * 0.92;
    const timerBarWidth = width * 0.6; // 화면 너비의 60% 사용
    const timerBarHeight = 60 * this.globalScale; // 높이도 비율에 맞춰 조절

    this.timerBarFrame
      .setPosition(width / 2 + 40 * this.globalScale, timerY)
      .setDisplaySize(
        timerBarWidth + 20 * this.globalScale,
        timerBarHeight + 60 * this.globalScale,
      );

    this.timerFillContainer.setPosition(
      width / 2 + 40 * this.globalScale - timerBarWidth / 2,
      timerY,
    );
    this.timerBarFill.setPosition(0, 0);
    this.timerBarFill.setSize(
      timerBarWidth,
      timerBarHeight - 10 * this.globalScale,
    );
    this.timerBarFill.maxWidth = timerBarWidth; // 게이지 계산용 최대 너비 저장

    const iconX = width / 2 - timerBarWidth / 2 - 2 * this.globalScale;
    const iconY = timerY - 3 * this.globalScale;

    this.timerIcon
      .setPosition(
        width / 2 - timerBarWidth / 2,
        timerY - 20 * this.globalScale,
      )
      .setDisplaySize(118 * this.globalScale, 142 * this.globalScale);

    this.timerText
      .setPosition(iconX, iconY)
      .setFontSize(`${40 * this.globalScale}px`);
  }
}
