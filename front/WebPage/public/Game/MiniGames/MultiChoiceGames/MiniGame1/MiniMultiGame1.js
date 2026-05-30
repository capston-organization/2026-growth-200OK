/* global Phaser */
/**
 * 로컬 단독 실행(MiniMultiGame1.local.html)용 a/an·관사 객관식 샘플.
 * options는 5개, correctAnswer는 옵션 문자열과 정확히 일치해야 함.
 */
const MINI_MULTI_GAME1_MOCK_PROBLEMS = [
  {
    id: 9301,
    type: "MULTIPLE_CHOICE",
    question: "Choose the correct article: It was ___ useful idea.",
    options: ["a", "an", "the", "-(empty)", "both a and an"],
    correctAnswer: "a",
  },
];

if (typeof window !== "undefined") {
  window.MINI_MULTI_GAME1_MOCK_PROBLEMS = MINI_MULTI_GAME1_MOCK_PROBLEMS;
}

/**
 * MiniMultiGame1: 영어 단어 맞추기 (Refactored_Final_Responsive_Fixed)
 *
 * [수정 사항]
 * - MiniOXGame1.js와 동일한 반응형 로직 적용
 * - baseWidth(1280), baseHeight(720) 기준 globalScale 계산
 * - 위치는 화면 비율(%), 크기는 원본수치 * globalScale 적용
 */

class MiniMultiGame1 extends Phaser.Scene {
  constructor() {
    super({ key: "MiniMultiGame1" });
  }

  // =================================================================
  // [초기화] 데이터 받기
  // =================================================================
  init(data) {
    this.mainScene = data.parent;
    this.speedLevel = data.speedLevel || 1;
    this.currentProblem = data.problem; // ★ MainScene에서 넘겨준 1개의 문제 저장
    this.assetBase =
      data.assetBase ?? "../../MiniGames/MultiChoiceGames/MiniGame1/";

    // ★ [MiniOXGame1 방식] 반응형 기준점 설정
    this.baseWidth = 1280;
    this.baseHeight = 720;
    this.globalScale = 1;
  }

  // =================================================================
  // [1] Preload
  // =================================================================
  preload() {
    const base = this.assetBase.endsWith("/")
      ? this.assetBase
      : `${this.assetBase}/`;
    this.load.setPath(`${base}assets/images/`);
    const loadImg = (key, file) => {
      if (
        key === "timerIcon" ||
        key === "timerBarFrame" ||
        !this.textures.exists(key)
      ) {
        this.load.image(key, file);
      }
    };
    const loadAud = (key, file) => {
      if (!this.cache.audio.exists(key)) this.load.audio(key, file);
    };

    loadImg("bg1", "Background1.png");
    loadImg("bg2", "Background2.png");
    loadImg("problemBar", "ProblemBar.png");
    loadImg("timerBarFrame", "TimerBar.png");
    loadImg("timerIcon", "Timer.png");
    loadImg("failedImage", "FailedImage.png");
    for (let i = 1; i <= 5; i++) {
      loadImg(`target${i}`, `Target${i}.png`);
      loadImg(`target${i}Shot`, `Target${i}Shot.png`);
    }
    loadImg("successBg1", "SuccessBg1.png");
    loadImg("successBg2", "SuccessBg2.png");
    loadImg("successGet", "SuccessGet.png");
    for (let i = 1; i <= 3; i++) {
      loadImg(`successGift${i}`, `SuccessGift${i}.png`);
    }

    this.load.setPath(`${base}assets/sounds/`);
    loadAud("miniMultiBgm", "Background_Music.mp3");
    loadAud("shootSfx", "Shoot.mp3");
    loadAud("targetShootSfx", "Taget_Shoot.mp3");
    loadAud("tadaSfx", "Tada.mp3");
  }

  // =================================================================
  // [2] Create
  // =================================================================
  create() {
    const { width, height } = this.scale;

    // 1. 배경 생성
    // (초기 위치는 refreshLayout에서 잡으므로 0,0 생성 후 즉시 정렬됨)
    this.bg1 = this.add.image(width / 2, height / 2, "bg1").setDepth(0);
    this.bg2 = this.add.image(width / 2, height / 2, "bg2").setDepth(1);

    // 2. 게임 변수 설정
    let durationSec = 7 - (this.speedLevel - 1);
    if (durationSec < 4) durationSec = 4;
    this.totalTime = durationSec * 1000;
    this.timeLeft = this.totalTime;
    this.isGameActive = true;
    this.gameResult = false;

    // [실패 연출 객체]
    this.failOverlay = this.add
      .rectangle(0, 0, 100, 100, 0x000000, 0.7)
      .setDepth(80)
      .setVisible(false);

    this.failImage = this.add
      .image(0, 0, "failedImage")
      .setDepth(81)
      .setVisible(false);

    // 3. UI 컨테이너
    this.uiContainer = this.add.container(0, 0).setDepth(100);

    // 상단 문제 바
    this.problemBarBg = this.add.image(0, 0, "problemBar");
    this.questionText = this.add
      .text(0, 0, "", {
        fontSize: "40px",
        color: "#000000",
        fontFamily: "Nunito",
        align: "center",
      })
      .setStroke("#ffffff", 5)
      .setOrigin(0.5);

    this.uiContainer.add([this.problemBarBg, this.questionText]);

    // 하단 타이머 UI
    this.timerBarFrame = this.add.image(0, 0, "timerBarFrame");
    this.timerFillContainer = this.add.container(0, 0);
    this.timerBarFill = this.add
      .rectangle(0, 0, 100, 10, 0xff0000)
      .setOrigin(0, 1.5); // 기존 코드 Origin 유지
    this.timerFillContainer.add(this.timerBarFill);

    this.timerIcon = this.add.image(0, 0, "timerIcon");
    this.timerText = this.add
      .text(0, 0, "", {
        fontSize: "40px",
        color: "#ffffff",
        fontFamily: "Nunito",
      })
      .setOrigin(0.55, 0.55);

    this.uiContainer.add([
      this.timerBarFrame,
      this.timerFillContainer,
      this.timerIcon,
      this.timerText,
    ]);

    // 4. 커서
    this.input.setDefaultCursor("none");
    this.cursorObj = this.add.graphics().setDepth(999);
    this.cursorObj.lineStyle(3, 0xff0000);
    this.cursorObj.strokeCircle(0, 0, 15);
    this.cursorObj.lineBetween(-20, 0, 20, 0);
    this.cursorObj.lineBetween(0, -20, 0, 20);

    // 5. 로직 실행
    this.createTargets();
    this.setProblem();

    // 클릭 시 Shoot 효과음 (진행 중일 때만; 성공/실패 후 isGameActive false면 무음)
    this._onAnyClickForShoot = () => {
      if (!this.isGameActive) return;
      try {
        if (this.cache.audio.exists("shootSfx")) {
          this.sound.play("shootSfx", { volume: 0.8 });
        }
      } catch (err) {
        console.warn("MiniMultiGame1 Shoot SFX 실패:", err);
      }
    };
    this.input.on("pointerdown", this._onAnyClickForShoot, this);

    this.bgmMusic = null;
    this._bgmFadeTween = null;
    this._bgmUnlockHandler = null;
    this.startBackgroundMusicFadeIn();

    // 6. ★ 반응형 이벤트 등록 (MiniOXGame1과 동일)
    this.scale.on("resize", this.refreshLayout, this);
    this.refreshLayout(); // 초기 실행
  }

  /**
   * BGM: 볼륨 0에서 재생 후 페이드 인. 브라우저 정책상 첫 입력 후 재생될 수 있음.
   */
  startBackgroundMusicFadeIn() {
    if (!this.cache.audio.exists("miniMultiBgm")) return;
    try {
      if (this.sound && typeof this.sound.unlock === "function") {
        this.sound.unlock();
      }
      const targetVolume = 0.45;
      const fadeMs = 1400;
      this.bgmMusic = this.sound.add("miniMultiBgm", {
        loop: true,
        volume: 0.02,
      });

      const runFadeIn = () => {
        if (!this.bgmMusic || !this.scene.isActive()) return;
        if (!this.bgmMusic.isPlaying) {
          try {
            this.bgmMusic.play();
          } catch (err) {
            console.warn("MiniMultiGame1 BGM play:", err);
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
          ctx
            .resume()
            .then(runFadeIn)
            .catch(() => runFadeIn());
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
      console.warn("MiniMultiGame1 BGM 로드/재생 실패:", e);
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
      this.sound.stopByKey("miniMultiBgm");
    }
    if (this.bgmMusic) {
      try {
        this.bgmMusic.stop();
      } catch (err) {
        console.warn("MiniMultiGame1 BGM 정지 실패:", err);
      }
      this.bgmMusic = null;
    }
  }

  // =================================================================
  // [3] Update
  // =================================================================
  update(time, delta) {
    const pointer = this.input.activePointer;
    this.cursorObj.x = pointer.x;
    this.cursorObj.y = pointer.y;

    if (!this.isGameActive) {
      this.handleEndSequence(delta);
      return;
    }

    this.timeLeft -= delta;

    // 게이지 바 (반응형 대응)
    const ratio = Math.max(0, this.timeLeft / this.totalTime);
    // this.timerBarFill.maxWidth는 refreshLayout에서 계산됨
    if (this.timerBarFill.maxWidth) {
      this.timerBarFill.width = this.timerBarFill.maxWidth * ratio;
    }

    const secondsLeft = Math.ceil(this.timeLeft / 1000);
    this.timerText.setText(secondsLeft);
    this.updateTimerColor(secondsLeft);

    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.triggerFail(false);
    }
  }

  updateTimerColor(seconds) {
    if (seconds <= 1) this.timerText.setColor("#ff0000");
    else if (seconds === 2) this.timerText.setColor("#ffa500");
    else if (seconds === 3) this.timerText.setColor("#ffff00");
    else this.timerText.setColor("#ffffff");
  }

  // =================================================================
  // [4] Create Targets
  // =================================================================
  createTargets() {
    this.targets = [];
    for (let i = 1; i <= 5; i++) {
      let container = this.add.container(0, 0).setDepth(20);

      // 이미지는 생성만 하고 크기는 refreshLayout에서 잡습니다.
      let targetImg = this.add.image(0, 0, `target${i}`);
      targetImg.setInteractive();

      let word = this.add
        .text(0, 0, "", {
          fontSize: "34px",
          color: "#ffffff",
          fontFamily: "Nunito",
          align: "center",
        })
        .setStroke("#000000", 6)
        .setOrigin(0.5);

      container.add([targetImg, word]);
      this.add.existing(container);

      let targetData = {
        id: i,
        container,
        image: targetImg,
        word,
        isAnswer: false,
        clicked: false,
      };
      this.targets.push(targetData);

      targetImg.on("pointerdown", () => this.onTargetClick(targetData));
    }
  }

  // =================================================================
  // [5] Set Problem
  // =================================================================
  setProblem() {
    // ★ 하드코딩된 problems 배열 삭제
    const p = this.currentProblem; // 전달받은 문제 사용

    // API 명세서에 따르면 문제는 p.question 에 들어있음
    this.questionText.setText(p.question);

    // 옵션 섞기 (API의 p.options 사용)
    const options = Phaser.Utils.Array.Shuffle([...p.options]).slice(0, 5);
    this.correctCount = 0;

    // API 명세서에 따르면 단일 정답인 correctAnswer가 있음.
    // 만약 정답이 여러 개라면 백엔드 명세가 배열이어야 하지만,
    // 보여준 예시는 "correctAnswer": "삼" 이므로 문자열 처리 기준으로 작성할게.
    this.totalCorrect = 1;

    this.targets.forEach((t, i) => {
      // 옵션이 5개가 안될 수도 있으니 예외 처리
      const optionText = options[i] || "";
      t.word.setText(optionText);
      t.clicked = false;
      t.image.setTexture(`target${t.id}`);
      t.image.clearTint();

      // 타겟 숨기기/보이기 처리 (옵션 개수가 적을 때를 대비)
      t.container.setVisible(optionText !== "");

      // 정답 체크 로직 수정
      if (optionText === p.correctAnswer) {
        t.isAnswer = true;
      } else {
        t.isAnswer = false;
      }
    });
  }

  onTargetClick(target) {
    if (!this.isGameActive || target.clicked) return;

    try {
      if (this.cache.audio.exists("targetShootSfx")) {
        this.sound.play("targetShootSfx", { volume: 1 });
      }
    } catch (err) {
      console.warn("MiniMultiGame1 Target_Shoot SFX 실패:", err);
    }

    target.clicked = true;
    target.image.setTexture(`target${target.id}Shot`);

    if (target.isAnswer) {
      this.correctCount++;
      if (this.correctCount >= this.totalCorrect) {
        this.triggerSuccess();
      }
    } else {
      this.triggerFail(true);
    }
  }

  // =================================================================
  // [6] Success / Fail
  // =================================================================
  triggerSuccess() {
    try {
      if (this.cache.audio.exists("tadaSfx")) {
        this.sound.play("tadaSfx", { volume: 1 });
      }
    } catch (err) {
      console.warn("MiniMultiGame1 Tada SFX 실패:", err);
    }

    this.isGameActive = false;
    this.gameResult = true;

    this.problemBarBg.setVisible(false);
    this.questionText.setVisible(false);

    this.successBg = this.add.image(0, 0, "successBg1").setDepth(50);
    this.successGet = this.add.image(0, 0, "successGet").setDepth(51);

    const randomId = Phaser.Math.Between(1, 3);
    this.successGift = this.add
      .image(0, 0, `successGift${randomId}`)
      .setDepth(52);

    this.refreshLayout();

    let toggle = false;
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        toggle = !toggle;
        if (this.successBg)
          this.successBg.setTexture(toggle ? "successBg2" : "successBg1");
        if (this.successGift) this.successGift.setAngle(toggle ? 10 : 0);
        if (this.successGet) this.successGet.setAngle(toggle ? 10 : 0);
      },
    });
  }

  triggerFail(isWrongClick = false) {
    this.isGameActive = false;
    this.gameResult = false;

    if (isWrongClick) {
      if (this.failOverlay) this.failOverlay.setVisible(true);
      if (this.failImage) this.failImage.setVisible(true);
      this.refreshLayout();
    }
  }

  handleEndSequence(delta) {
    this.timeLeft -= delta;
    const ratio = Math.max(0, this.timeLeft / this.totalTime);
    if (this.timerBarFill.maxWidth) {
      this.timerBarFill.width = this.timerBarFill.maxWidth * ratio;
    }

    const secondsLeft = Math.ceil(this.timeLeft / 1000);
    this.timerText.setText(secondsLeft);
    this.updateTimerColor(secondsLeft);

    if (this.timeLeft <= 0) {
      this.finishGame();
    }
  }

  finishGame() {
    if (this._onAnyClickForShoot) {
      this.input.off("pointerdown", this._onAnyClickForShoot, this);
      this._onAnyClickForShoot = null;
    }

    this.stopBackgroundMusic();

    this.scale.off("resize", this.refreshLayout, this);
    this.input.setDefaultCursor("default");

    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      // ★ 수정: 게임 결과와 함께 '어떤 문제였는지'도 같이 넘겨줌
      this.mainScene.handleMiniGameResult(this.gameResult, this.currentProblem);
    }
    this.scene.stop();
  }

  // =================================================================
  // [7] Refresh Layout: MiniOXGame1 스타일 반응형
  // =================================================================
  refreshLayout() {
    const width = this.scale.width;
    const height = this.scale.height;

    // 1. 스케일 비율 계산 (MiniOXGame1 로직)
    const scaleX = width / this.baseWidth;
    const scaleY = height / this.baseHeight;
    this.globalScale = Math.min(scaleX, scaleY);

    // 2. 배경 (화면 꽉 채우기)
    this.bg1.setDisplaySize(width, height).setPosition(width / 2, height / 2);
    this.bg2.setDisplaySize(width, height).setPosition(width / 2, height / 2);

    // 3. 실패 화면 UI
    if (this.failOverlay) {
      this.failOverlay.setSize(width, height);
      this.failOverlay.setPosition(width / 2, height / 2);
    }
    if (this.failImage) {
      this.failImage
        .setPosition(width / 2, height / 2)
        .setScale(0.3 * this.globalScale); // OX게임처럼 스케일 적용
    }

    // 4. 성공 화면 UI
    if (this.successBg) {
      this.successBg
        .setPosition(width / 2, height / 2)
        .setDisplaySize(width, height);

      // 아이템들은 globalScale에 맞춰 크기 조절
      const itemScale = 0.3 * this.globalScale; // 적절한 계수 사용

      if (this.successGet) {
        this.successGet
          .setPosition(width * 0.63, height * 0.37)
          .setScale(itemScale);
      }
      if (this.successGift) {
        this.successGift
          .setPosition(width * 0.4, height * 0.5)
          .setScale(itemScale);
      }
    }

    // 5. 상단 문제 바
    const problemBarY = height * 0.075;
    this.problemBarBg
      .setPosition(width / 2, problemBarY)
      .setDisplaySize(width * 0.9, 100 * this.globalScale); // 높이만 스케일

    this.questionText
      .setPosition(width / 2, problemBarY + 5 * this.globalScale)
      .setFontSize(`${40 * this.globalScale}px`);

    // 6. 하단 타이머 UI
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
      timerY * 1.075,
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

    // 7. 과녁 (핵심: 원래 사이즈 * globalScale)
    if (this.targets && this.targets.length > 0) {
      // 화면 비율 좌표 (%)
      const positions = [
        { x: width * 0.2, y: height * 0.36 }, // 1번
        { x: width * 0.5, y: height * 0.36 }, // 2번
        { x: width * 0.8, y: height * 0.36 }, // 3번
        { x: width * 0.35, y: height * 0.65 }, // 4번
        { x: width * 0.65, y: height * 0.65 }, // 5번
      ];

      this.targets.forEach((t, i) => {
        if (positions[i]) {
          t.container.setPosition(positions[i].x, positions[i].y);

          // [크기 조정] 기존 값(220, 225) * globalScale
          // 이렇게 하면 원본 비율이 유지된 채로 화면에 맞춰 커지고 작아짐
          t.image.setDisplaySize(
            250 * this.globalScale,
            256 * this.globalScale,
          );

          // [폰트 조정]
          t.word.setFontSize(`${34 * this.globalScale}px`);
          t.word.y = 130 * this.globalScale; // 텍스트 Y 위치도 보정
        }
      });
    }
  }
}
