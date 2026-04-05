/* global Phaser */
/**
 * MiniOXGame1.js
 * -------------------------------------------------------------------------
 * [게임 설명]
 * - 우주선 창문 밖으로 패널들이 흘러가는 OX 퀴즈 게임입니다.
 * - 정해진 시간 내에 문법에 맞는 문장인지 판단하여 O/X 버튼을 눌러야 합니다.
 *
 * [주요 로직]
 * 1. Layer 시스템: 배경(우주) -> 패널(문제) -> 배경(창틀) -> UI 순서로 겹쳐 보입니다.
 * 2. Spawn 로직: 일반 패널(장식)이 나오다가 특정 확률이나 시간 임박 시 문제(Sentence)가 나옵니다.
 * 3. 반응형 로직: 화면 크기가 변하면 'resize' 이벤트가 발생하여 모든 요소의 위치와 크기를 재조정합니다.
 * -------------------------------------------------------------------------
 */
class MiniOXGame1 extends Phaser.Scene {
  constructor() {
    super({ key: "MiniOXGame1" });
  }

  // =================================================================
  // [Init] 데이터 및 초기 설정
  // =================================================================
  init(data) {
    // 부모 씬(메인 게임)과의 연동 데이터
    this.mainScene = data.parent;
    this.speedLevel = data.speedLevel || 1;
    this.currentProblem = data.problem; // ★ MainScene에서 넘겨준 1개의 문제 저장

    // ★ [반응형 기준점]
    // 1280x720 해상도에서 작업한 수치들이 1.0 스케일이라고 가정합니다.
    this.baseWidth = 1280;
    this.baseHeight = 720;
    this.globalScale = 1; // 화면 크기에 따라 변하는 비율 값
  }

  // =================================================================
  // [Preload] 이미지 리소스 로드
  // =================================================================
  preload() {
    this.load.setPath("../../MiniGames/OXGames/MiniGame1/assets/images/");

    // 1. 타이머 UI (게이지 바, 아이콘)
    this.load.image("timerIcon", "Timer.png");
    this.load.image("timerBarFrame", "TimerBar.png");

    // 2. 배경 (우주 배경, 창틀 프레임)
    this.load.image("background1", "Background1.png");
    this.load.image("background2", "Background2.png");

    // 3. 장식용 그래픽 (좌우 기계 장치, 상태 표시등)
    this.load.image("leftGraphic", "LeftGraphic.png");
    this.load.image("rightGraphic", "RightGraphicDefault.png");
    this.load.image("lightGraphic", "Light.png");

    // 4. 상태 변화 그래픽 (성공/실패 시 변경될 이미지들)
    this.load.image("blueLightGraphic", "BlueLight.png"); // 정답 시 파란불
    this.load.image("redLightGraphic", "RedLight.png"); // 오답 시 빨간불
    this.load.image("rightGraphicSuccess", "RightGraphicSuccess.png");
    this.load.image("rightGraphicFailed", "RightGraphicFailed.png");

    // 5. 결과 팝업 (성공/실패 화면)
    this.load.image("screenSuccess", "ScreenSuccess.png");
    this.load.image("screenFailed", "ScreenFailed.png");

    // 6. 컨트롤 버튼 (O / X 및 눌린 상태)
    this.load.image("btnO", "OButton.png");
    this.load.image("btnOPushed", "OButtonPushed.png");
    this.load.image("btnX", "XButton.png");
    this.load.image("btnXPushed", "XButtonPushed.png");

    // 7. 지나가는 패널 (장식용 1~5번)
    for (let i = 1; i <= 5; i++) {
      this.load.image(`panel${i}`, `Panel${i}.png`);
    }

    this.load.setPath("../../MiniGames/OXGames/MiniGame1/assets/sounds/");
    this.load.audio("miniOxBgm", "Background_Music.mp3");
    this.load.audio("oxButtonPressSfx", "ButtonPress.mp3");
  }

  // =================================================================
  // [Create] 화면 객체 생성 및 배치
  // =================================================================
  create() {
    const { width, height } = this.scale;

    // 1. 배경 레이어 (Layer 0) - 흐르는 우주 배경
    this.bg1 = this.add.tileSprite(
      width / 2,
      height / 2,
      width,
      height,
      "background1",
    );
    this.bg1.setDepth(0);

    // 2. 게임 오브젝트 컨테이너 (Layer 1) - 패널과 문제가 지나가는 공간
    // 창틀 뒤에 있어야 하므로 창틀보다 Depth가 낮아야 합니다.
    this.gameContainer = this.add.container(0, 0);
    this.gameContainer.setDepth(1);

    // 3. 결과 화면 (Layer 1.5) - 창틀 뒤, 아이템보다는 앞
    this.screenSuccess = this.add
      .image(0, 0, "screenSuccess")
      .setDepth(1.5)
      .setVisible(false); // 처음엔 숨김
    this.screenFailed = this.add
      .image(0, 0, "screenFailed")
      .setDepth(1.5)
      .setVisible(false); // 처음엔 숨김

    // 4. 창틀 프레임 (Layer 2) - 가장 앞에 있는 배경 요소
    this.bg2 = this.add.image(width / 2, height / 2, "background2");
    this.bg2.setDepth(2);

    // 5. HUD 장식 (Layer 3) - 기계 장치들
    this.lightGraphic = this.add.image(0, 0, "lightGraphic").setDepth(3);
    this.leftGraphic = this.add.image(0, 0, "leftGraphic").setDepth(3);
    this.rightGraphic = this.add.image(0, 0, "rightGraphic").setDepth(3);

    // 6. 게임 로직 변수 설정
    // 레벨에 따라 제한시간 설정 (최소 4초 보장)
    let durationSec = 8 - (this.speedLevel - 1);
    if (durationSec < 4) durationSec = 4;
    this.totalTime = durationSec * 1000;
    this.timeLeft = this.totalTime;

    this.isGameActive = true; // 게임 진행 중 여부
    this.isResolved = false; // 정답 제출 여부
    this.gameResult = false; // 최종 결과 (성공/실패)

    this.movingItems = [];
    this.isWaitingForNextSpawn = false;
    this.hasSentenceSpawned = false;

    // ★ 수정: 하드코딩 함수 대신, 넘겨받은 API 데이터를 게임 포맷에 맞게 변환
    // 백엔드에서 정답을 "O" 라고 준다고 가정
    const answer = this.currentProblem.correctAnswer;
    const isAnswerO = answer === "O" || answer === "O" || answer === true;

    this.problemData = {
      sentence: this.currentProblem.question, // API의 question 값을 문장으로 사용
      isCorrect: isAnswerO, // O가 정답이면 true, X가 정답이면 false
    };

    // 7. 조작 버튼 생성 (O/X)
    this.createControlButtons();

    // 8. 타이머 UI 생성 (Depth 100 - 최상단)
    this.uiContainer = this.add.container(0, 0);
    this.uiContainer.setDepth(100);
    this.createTimerUI();

    // 9. ★ 반응형 이벤트 등록
    // 화면 크기가 바뀔 때마다 refreshLayout을 호출해 크기와 위치를 다시 잡습니다.
    this.scale.on("resize", this.refreshLayout, this);
    this.refreshLayout(); // 초기 실행으로 현재 화면에 맞춤

    // 첫 번째 아이템(패널) 생성 시작
    this.spawnConveyorItem();

    this.bgmMusic = null;
    this._bgmFadeTween = null;
    this._bgmUnlockHandler = null;
    this.startBackgroundMusicFadeIn();
  }

  /**
   * BGM: 볼륨 0에서 재생 후 페이드 인. 브라우저 정책상 첫 입력 후 재생될 수 있음.
   */
  startBackgroundMusicFadeIn() {
    if (!this.cache.audio.exists("miniOxBgm")) return;
    try {
      if (this.sound && typeof this.sound.unlock === "function") {
        this.sound.unlock();
      }
      const targetVolume = 0.45;
      const fadeMs = 1400;
      this.bgmMusic = this.sound.add("miniOxBgm", {
        loop: true,
        volume: 0.02,
      });

      const runFadeIn = () => {
        if (!this.bgmMusic || !this.scene.isActive()) return;
        if (!this.bgmMusic.isPlaying) {
          try {
            this.bgmMusic.play();
          } catch (err) {
            console.warn("MiniOXGame1 BGM play:", err);
          }
        }
        if (this._bgmFadeTween) this._bgmFadeTween.stop();
        this._bgmFadeTween = this.tweens.add({
          targets: this.bgmMusic,
          volume: targetVolume,
          duration: fadeMs,
          ease: "Sine.easeIn",
        });
      };

      const tryStart = () => {
        if (!this.bgmMusic || !this.scene.isActive()) return;
        const ctx = this.sound.context;
        if (ctx && ctx.state === "suspended") {
          ctx.resume().then(runFadeIn).catch(() => runFadeIn());
        } else {
          runFadeIn();
        }
      };

      tryStart();
      this.time.delayedCall(0, tryStart);
      this.time.delayedCall(50, tryStart);

      const unlock = () => {
        tryStart();
        this.input.off("pointerdown", unlock);
        if (this.input.keyboard)
          this.input.keyboard.off("keydown", this._bgmUnlockHandler);
        this._bgmUnlockHandler = null;
      };
      this._bgmUnlockHandler = unlock;
      this.input.on("pointerdown", unlock);
      if (this.input.keyboard) this.input.keyboard.on("keydown", unlock);
    } catch (e) {
      console.warn("MiniOXGame1 BGM 로드/재생 실패:", e);
    }
  }

  stopBackgroundMusic() {
    if (this._bgmFadeTween) {
      this._bgmFadeTween.stop();
      this._bgmFadeTween = null;
    }
    if (this._bgmUnlockHandler) {
      this.input.off("pointerdown", this._bgmUnlockHandler);
      if (this.input.keyboard)
        this.input.keyboard.off("keydown", this._bgmUnlockHandler);
      this._bgmUnlockHandler = null;
    }
    if (this.sound && this.sound.stopByKey) {
      this.sound.stopByKey("miniOxBgm");
    }
    if (this.bgmMusic) {
      try {
        this.bgmMusic.stop();
      } catch (err) {
        console.warn("MiniOXGame1 BGM 정지 실패:", err);
      }
      this.bgmMusic = null;
    }
  }

  // O, X 버튼 생성 및 이벤트 연결
  createControlButtons() {
    this.btnO = this.add.sprite(0, 0, "btnO").setInteractive().setDepth(50);
    this.btnX = this.add.sprite(0, 0, "btnX").setInteractive().setDepth(50);

    this.btnO.on("pointerdown", () => this.handleAnswer(true));
    this.btnX.on("pointerdown", () => this.handleAnswer(false));
  }

  // 상단 타이머 바 생성
  createTimerUI() {
    this.timerBarFrame = this.add.image(0, 0, "timerBarFrame");
    this.timerFillContainer = this.add.container(0, 0);

    // 빨간색 게이지 바
    this.timerBarFill = this.add
      .rectangle(0, 0, 100, 10, 0xff0000)
      .setOrigin(0, 0.5); // 왼쪽 정렬
    this.timerFillContainer.add(this.timerBarFill);

    this.timerIcon = this.add.image(0, 0, "timerIcon");
    this.timerText = this.add
      .text(0, 0, "", {
        fontSize: "40px",
        color: "#ffffff",
        fontFamily: "Nunito",
        fontWeight: "bold",
      })
      .setOrigin(0.55, 0.55);

    // 컨테이너에 묶어서 관리
    this.uiContainer.add([
      this.timerBarFrame,
      this.timerFillContainer,
      this.timerIcon,
      this.timerText,
    ]);
  }

  // =================================================================
  // [Update] 매 프레임 실행 (게임 루프)
  // =================================================================
  update(time, delta) {
    if (!this.isGameActive) return;

    // 1. 우주 배경 스크롤 (왼쪽으로 흐름)
    this.bg1.tilePositionX -= 0.5;

    // 2. 타이머 차감 및 UI 업데이트
    this.timeLeft -= delta;
    const ratio = Math.max(0, this.timeLeft / this.totalTime);
    this.timerBarFill.width = this.timerBarFill.maxWidth * ratio; // 게이지 길이 조절

    const secondsLeft = Math.ceil(this.timeLeft / 1000);
    this.timerText.setText(secondsLeft);
    this.updateTimerColor(secondsLeft); // 3초 이하면 색상 변경

    // 3. 시간 종료 처리
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.timerText.setText(0);
      if (!this.isResolved) this.gameResult = false; // 시간 내 못 풀면 실패
      this.finishGame();
      return;
    }

    // 4. 아이템 이동 (패널/문제)
    // 반응형 대응: 화면 너비에 비례한 속도로 이동

    switch (this.speedLevel) {
      case 1:
        this.moveSpeedFactor = 1;
        break;
      case 2:
        this.moveSpeedFactor = 1.2;
        break;
      case 3:
        this.moveSpeedFactor = 1.4;
        break;
      case 4:
        this.moveSpeedFactor = 1.6;
        break;
      case 5:
        this.moveSpeedFactor = 1.8;
        break;
      default:
        this.moveSpeedFactor = 0.5;
    }

    const moveSpeed =
      this.scale.width * 0.5 * (delta / 1000) * this.moveSpeedFactor;

    // 배열 역순회 (삭제 시 인덱스 오류 방지)
    for (let i = this.movingItems.length - 1; i >= 0; i--) {
      let item = this.movingItems[i];
      item.x += moveSpeed;

      // 화면 오른쪽 끝을 벗어나면 삭제
      if (item.x - (item.width * item.scaleX) / 2 > this.scale.width + 100) {
        item.destroy();
        this.movingItems.splice(i, 1);
      }
    }

    // 5. 다음 아이템 스폰 관리
    if (this.movingItems.length === 0 && !this.isWaitingForNextSpawn) {
      this.isWaitingForNextSpawn = true;
      const randomDelay = Phaser.Math.Between(500, 1000);

      this.time.delayedCall(randomDelay, () => {
        if (this.isGameActive) {
          this.spawnConveyorItem();
          this.isWaitingForNextSpawn = false;
        }
      });
    }
  }

  // 남은 시간에 따라 타이머 텍스트 색상 변경
  updateTimerColor(seconds) {
    if (seconds <= 1)
      this.timerText.setColor("#ff0000"); // 빨강
    else if (seconds === 2)
      this.timerText.setColor("#ffa500"); // 주황
    else if (seconds === 3)
      this.timerText.setColor("#ffff00"); // 노랑
    else this.timerText.setColor("#ffffff"); // 흰색
  }

  // =================================================================
  // [Logic] 아이템(패널/문제) 생성 로직
  // =================================================================
  spawnConveyorItem() {
    let isProblem = false;

    // 조건 1: 시간이 4.5초 이하로 남았는데 아직 문제가 안 나왔으면 강제 출제
    if (!this.hasSentenceSpawned && this.timeLeft <= 4500) isProblem = true;
    // 조건 2: 40% 확률로 문제 출제
    else if (!this.hasSentenceSpawned && Phaser.Math.Between(0, 100) < 40)
      isProblem = true;

    const { height } = this.scale;
    const boxY = height * 0.35; // 화면 높이의 35% 지점에 배치

    // 화면 왼쪽 바깥에서 시작
    const container = this.add.container(-300, boxY);

    // ★ [반응형 적용] 컨테이너에 scale을 적용하면 내부 자식들도 함께 커짐
    container.setScale(this.globalScale);

    if (isProblem) {
      // [경우 A] 퀴즈 문제 출제
      this.hasSentenceSpawned = true;

      // 텍스트 너비 측정을 위한 임시 객체
      const tempText = this.add
        .text(0, 0, this.problemData.sentence, {
          fontSize: "32px",
          color: "#000",
          fontWeight: "bold",
        })
        .setVisible(false);

      const itemWidth = tempText.width + 60; // 여백 포함 너비
      const itemHeight = 100;
      tempText.destroy();

      // 흰색 배경 박스
      const bg = this.add.rectangle(0, 0, itemWidth, itemHeight, 0xffffff);
      bg.setStrokeStyle(2, 0x000000);

      // 실제 텍스트
      const text = this.add
        .text(0, 0, this.problemData.sentence, {
          fontSize: "32px",
          color: "#000",
          fontWeight: "bold",
          fontFamily: "Nunito",
        })
        .setOrigin(0.5);

      container.add([bg, text]);
      container.width = itemWidth; // 원본 너비 저장 (충돌 체크용)
    } else {
      // [경우 B] 단순 장식용 패널 생성
      const panelKey = `panel${Phaser.Math.Between(1, 5)}`;
      const panelImg = this.add.image(0, 0, panelKey);

      // 패널은 원래 이미지보다 작게(0.4배) 표시
      panelImg.setScale(0.4);

      container.add(panelImg);
      container.width = panelImg.width * 0.3;
    }

    this.gameContainer.add(container);
    this.movingItems.push(container);
  }

  // =================================================================
  // [Interaction] 정답 버튼 처리
  // =================================================================
  handleAnswer(userChoseO) {
    if (this.isResolved || !this.isGameActive) return;

    try {
      if (this.cache.audio.exists("oxButtonPressSfx")) {
        this.sound.play("oxButtonPressSfx", { volume: 1 });
      }
    } catch (err) {
      console.warn("MiniOXGame1 ButtonPress SFX 실패:", err);
    }

    this.isResolved = true; // 중복 클릭 방지
    const isCorrect = userChoseO === this.problemData.isCorrect;

    // 버튼 눌림 시각 효과 (이미지 교체 및 회색 틴트)
    if (userChoseO) this.btnO.setTexture("btnOPushed").setTint(0xaaaaaa);
    else this.btnX.setTexture("btnXPushed").setTint(0xaaaaaa);

    if (isCorrect) {
      // 정답 처리
      this.gameResult = true;
      this.screenSuccess.setVisible(true); // 성공 화면 표시
      this.lightGraphic.setTexture("blueLightGraphic"); // 파란불
      this.rightGraphic.setTexture("rightGraphicSuccess"); // 성공 장식
    } else {
      // 오답 처리
      this.gameResult = false;
      this.screenFailed.setVisible(true); // 실패 화면 표시
      this.lightGraphic.setTexture("redLightGraphic"); // 빨간불
      this.rightGraphic.setTexture("rightGraphicFailed"); // 실패 장식
    }
  }

  // 게임 종료 및 결과 전송
  finishGame() {
    this.stopBackgroundMusic();

    this.isGameActive = false;
    this.scale.off("resize", this.refreshLayout, this); // 리사이즈 리스너 해제

    if (!this.isResolved) {
      this.gameResult = false; // 타임아웃 등 미해결 시 실패 처리
    }

    // 메인 씬으로 결과 전달
    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      // ★ 수정: 성공 여부와 함께 '방금 푼 문제' 객체를 같이 넘겨줌
      this.mainScene.handleMiniGameResult(this.gameResult, this.currentProblem);
    }
    this.scene.stop();
  }

  // =================================================================
  // [System] 반응형 레이아웃 재계산 (핵심)
  // =================================================================
  refreshLayout() {
    const width = this.scale.width;
    const height = this.scale.height;

    // 1. 스케일 비율 계산
    // baseWidth(1280) 대비 현재 너비, baseHeight(720) 대비 현재 높이 중
    // '더 작은 쪽' 비율을 선택(Math.min)하여 화면이 잘리지 않도록(Fit) 함
    const scaleX = width / this.baseWidth;
    const scaleY = height / this.baseHeight;
    this.globalScale = Math.min(scaleX, scaleY);

    // 2. 배경(우주) 및 창틀(Background2) 크기 조정
    // setSize: 타일 스프라이트 영역 크기 변경
    this.bg1.setSize(width, height);
    this.bg1.setPosition(width / 2, height / 2);

    // setDisplaySize: 이미지를 강제로 화면 크기에 맞춤 (비율 무시하고 꽉 채움)
    this.bg2.setDisplaySize(width, height);
    this.bg2.setPosition(width / 2, height / 2);

    // 3. 결과 화면 (고정 수치 0.4 * 반응형 비율)
    const resultScale = 0.4 * this.globalScale;
    this.screenSuccess
      .setPosition(width / 2, height / 2.5)
      .setScale(resultScale);
    this.screenFailed
      .setPosition(width / 2, height / 2.5)
      .setScale(resultScale);

    // 4. 장식용 HUD (고정 수치 0.3 * 반응형 비율)
    const decoScale = 0.3 * this.globalScale;

    // 위치는 화면 비율(%)을 사용하여 배치
    this.lightGraphic
      .setPosition(width / 1.95, height * 0.05)
      .setScale(decoScale);
    this.leftGraphic
      .setPosition(width * 0.08, height * 0.4)
      .setScale(decoScale);
    this.rightGraphic
      .setPosition(width * 0.92, height * 0.5)
      .setScale(decoScale);

    // 5. 버튼 배치 (고정 수치 0.35 * 반응형 비율)
    const btnScale = 0.35 * this.globalScale;
    const btnY = height * 0.78; // 하단 78% 위치
    const btnGap = width * 0.15; // 중앙에서 좌우로 15% 떨어짐

    this.btnO.setPosition(width / 2 - btnGap, btnY).setScale(btnScale);
    this.btnX.setPosition(width / 2 + btnGap, btnY).setScale(btnScale);

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

    // 7. [중요] 생성된 아이템들도 리사이즈 시 크기/위치 업데이트
    this.movingItems.forEach((item) => {
      // 아이템도 globalScale을 따라가도록 재설정
      item.setScale(this.globalScale);

      // 높이 위치도 화면 높이 비율에 맞게 재조정
      item.y = height * 0.35;
    });
  }
}
