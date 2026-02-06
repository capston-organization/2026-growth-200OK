/**
 * MiniMultiGame1: 영어 단어 맞추기 (Refactored_Final_v3_FailEffect)
 *
 * [게임 설명]
 * - 제시된 문장의 빈칸에 들어갈 알맞은 단어를 가진 과녁을 맞추는 게임입니다.
 * - 정답을 모두 맞추면 성공(Success), 틀린 과녁을 쏘거나 시간이 다 되면 실패(Fail)입니다.
 *
 * [최종 수정 사항]
 * 1. 실패 연출 추가: 오답 클릭 시 화면이 어두워지고(검은색 반투명) 'FailedImage'가 뜹니다.
 * 2. 실패 조건 분기:
 * - 잘못된 과녁 클릭 -> 실패 그래픽 표시 O
 * - 시간 초과 -> 실패 그래픽 표시 X (그냥 종료)
 */

class MiniMultiGame1 extends Phaser.Scene {
  constructor() {
    super({ key: "MiniMultiGame1" });
  }

  // =================================================================
  // [초기화] 데이터 받기
  // =================================================================
  init(data) {
    this.mainScene = data.parent; // 부모 씬(메인 게임) 정보 저장
    this.speedLevel = data.speedLevel || 1; // 난이도 설정 (기본값 1)
  }

  // =================================================================
  // [1] Preload: 리소스 로딩
  // * 게임에 필요한 이미지, 폰트 등을 메모리에 미리 로드하는 단계입니다.
  // =================================================================
  preload() {
    // 기본 경로 설정
    this.load.setPath("../../MiniGames/MultiChoiceGames/MiniGame1/assets/");

    // [배경 및 UI 이미지]
    this.load.image("bg1", "Background1.png");
    this.load.image("bg2", "Background2.png");
    this.load.image("problemBar", "ProblemBar.png");
    this.load.image("timerBarFrame", "TimerBar.png");
    this.load.image("timerIcon", "Timer.png");

    // [중요] 실패 시 보여줄 이미지 로드
    this.load.image("failedImage", "FailedImage.png");

    // [과녁 이미지] (1~5번 타겟, 맞춰서 깨진 버전 포함)
    for (let i = 1; i <= 5; i++) {
      this.load.image(`target${i}`, `Target${i}.png`);
      this.load.image(`target${i}Shot`, `Target${i}Shot.png`);
    }

    // [성공 연출 이미지]
    this.load.image("successBg1", "SuccessBg1.png");
    this.load.image("successBg2", "SuccessBg2.png");
    this.load.image("successGet", "SuccessGet.png");
    for (let i = 1; i <= 3; i++) {
      this.load.image(`successGift${i}`, `SuccessGift${i}.png`);
    }
  }

  // (보조 함수) 폰트 파일을 비동기로 로드하여 시스템에 등록
  loadFont(name, url) {
    if (window.FontFace) {
      var newFont = new FontFace(name, `url(${url})`);
      newFont
        .load()
        .then(function (loaded) {
          document.fonts.add(loaded);
        })
        .catch(function (error) {
          console.warn("폰트 로드 실패:", error);
        });
    }
  }

  // =================================================================
  // [2] Create: 객체 생성 및 배치
  // * 화면에 보일 모든 요소를 '생성'합니다. 위치는 refreshLayout에서 잡습니다.
  // =================================================================
  create() {
    // 1. 배경 생성 (Depth 0, 1: 가장 뒤쪽)
    this.bg1 = this.add.image(0, 0, "bg1").setDepth(0);
    this.bg2 = this.add.image(0, 0, "bg2").setDepth(1);

    // 2. 게임 시간 및 상태 변수 설정
    let durationSec = 7 - (this.speedLevel - 1);
    if (durationSec < 4) durationSec = 4; // 최소 4초 보장
    this.totalTime = durationSec * 1000;
    this.timeLeft = this.totalTime;
    this.isGameActive = true; // 게임 진행 중 여부
    this.gameResult = false; // 최종 결과 (성공/실패)

    // [실패 연출용 객체 생성]
    // Depth 설명:
    // 과녁(20) < Success(50) < FailOverlay(80) < FailImage(81) < UI(100) < Cursor(999)
    // 이렇게 설정해야 실패 화면이 과녁은 가리지만, 타이머(UI)는 가리지 않습니다.

    // (1) 검은색 반투명 오버레이 (0x000000, 투명도 0.7)
    this.failOverlay = this.add
      .rectangle(0, 0, 100, 100, 0x000000, 0.7)
      .setDepth(80)
      .setVisible(false); // 처음엔 안 보이게

    // (2) 실패 이미지 (FailedImage.png)
    this.failImage = this.add
      .image(0, 0, "failedImage")
      .setDepth(81)
      .setVisible(false); // 처음엔 안 보이게

    // 3. UI 컨테이너 생성 (Depth: 100 - 최상단 UI)
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
      .rectangle(0, 0, 100, 10, 0xff0000) // 붉은색 게이지 바
      .setOrigin(0, 1.5);
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

    // 4. 커서 설정 (Depth: 999 - 제일 위)
    this.input.setDefaultCursor("none"); // 기본 마우스 커서 숨김
    this.cursorObj = this.add.graphics().setDepth(999);
    this.cursorObj.lineStyle(3, 0xff0000); // 붉은 십자선
    this.cursorObj.strokeCircle(0, 0, 15);
    this.cursorObj.lineBetween(-20, 0, 20, 0);
    this.cursorObj.lineBetween(0, -20, 0, 20);

    // 5. 게임 로직 실행 (과녁 만들기, 문제 내기)
    this.createTargets();
    this.setProblem();

    // 6. 화면 레이아웃 잡기 (반응형 대응)
    this.refreshLayout();
    this.scale.on("resize", this.refreshLayout, this); // 화면 크기 변경 감지
  }

  // =================================================================
  // [3] Update: 매 프레임 실행 (게임 루프)
  // =================================================================
  update(time, delta) {
    // 커서 위치 업데이트
    const pointer = this.input.activePointer;
    this.cursorObj.x = pointer.x;
    this.cursorObj.y = pointer.y;

    // 게임 종료 상태라면 종료 애니메이션 처리
    if (!this.isGameActive) {
      this.handleEndSequence(delta);
      return;
    }

    // 타이머 시간 감소
    this.timeLeft -= delta;

    // 남은 시간에 비례해서 게이지 바 길이 조절
    const ratio = Math.max(0, this.timeLeft / this.totalTime);
    this.timerBarFill.width = this.scale.width * 0.7 * ratio;

    // 타이머 텍스트 업데이트
    const secondsLeft = Math.ceil(this.timeLeft / 1000);
    this.timerText.setText(secondsLeft);
    this.updateTimerColor(secondsLeft); // 색상 변경

    // 시간 초과 체크
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      // 시간 초과는 '오답 클릭'이 아니므로 false 전달
      this.triggerFail(false);
    }
  }

  // 남은 초에 따라 타이머 글씨 색 변경 (흰->노->주->빨)
  updateTimerColor(seconds) {
    if (seconds <= 1) this.timerText.setColor("#ff0000");
    else if (seconds === 2) this.timerText.setColor("#ffa500");
    else if (seconds === 3) this.timerText.setColor("#ffff00");
    else this.timerText.setColor("#ffffff");
  }

  // =================================================================
  // [4] Create Targets: 과녁 생성
  // =================================================================
  createTargets() {
    this.targets = [];
    // 5개의 과녁 생성 루프
    for (let i = 1; i <= 5; i++) {
      let container = this.add.container(0, 0).setDepth(20);

      // 과녁 이미지
      let targetImg = this.add
        .image(0, 0, `target${i}`)
        .setDisplaySize(220, 225);
      targetImg.setInteractive(); // 클릭 가능하게

      // 단어 텍스트
      let word = this.add
        .text(0, 110, "", {
          fontSize: "34px",
          color: "#ffffff",
          fontFamily: "Nunito",
          align: "center",
        })
        .setStroke("#000000", 6)
        .setOrigin(0.5);

      container.add([targetImg, word]);
      this.add.existing(container);

      // 과녁 정보 객체 생성
      let targetData = {
        id: i,
        container,
        image: targetImg,
        word,
        isAnswer: false, // 정답 여부
        clicked: false, // 이미 클릭했는지 여부
      };
      this.targets.push(targetData);

      // 클릭 이벤트 연결
      targetImg.on("pointerdown", () => this.onTargetClick(targetData));
    }
  }

  // =================================================================
  // [5] Set Problem: 문제 출제
  // =================================================================
  setProblem() {
    // 문제 은행
    const problems = [
      {
        q: "She ___ happy.",
        answers: ["is", "was"],
        options: ["is", "not", "am", "playing", "was"],
      },
      {
        q: "We ___ friends.",
        answers: ["are", "were"],
        options: ["can", "are", "am", "were", "be"],
      },
      {
        q: "It ___ rain.",
        answers: ["will", "can"],
        options: ["will", "can", "apple", "are", "am"],
      },
    ];

    // 랜덤 문제 선택
    const p = Phaser.Utils.Array.GetRandom(problems);
    this.questionText.setText(p.q);

    // 보기 섞기
    const options = Phaser.Utils.Array.Shuffle([...p.options]).slice(0, 5);
    this.correctCount = 0;
    this.totalCorrect = 0;

    // 과녁에 단어 배치 및 정답 설정
    this.targets.forEach((t, i) => {
      t.word.setText(options[i]);
      t.clicked = false;
      t.image.setTexture(`target${t.id}`); // 깨진 이미지 초기화
      t.image.clearTint();

      if (p.answers.includes(options[i])) {
        t.isAnswer = true;
        this.totalCorrect++; // 정답 개수 카운트
      } else {
        t.isAnswer = false;
      }
    });
  }

  // 과녁 클릭 시 처리
  onTargetClick(target) {
    if (!this.isGameActive || target.clicked) return;

    target.clicked = true;
    target.image.setTexture(`target${target.id}Shot`); // 깨진 이미지로 변경

    if (target.isAnswer) {
      // 정답을 맞춘 경우
      this.correctCount++;
      if (this.correctCount >= this.totalCorrect) {
        this.triggerSuccess(); // 모든 정답을 맞추면 성공
      }
    } else {
      // 오답을 맞춘 경우 -> 즉시 실패 (오답 클릭이므로 true 전달)
      this.triggerFail(true);
    }
  }

  // =================================================================
  // [6] Success / Fail: 결과 처리
  // =================================================================

  // 성공 시 연출
  triggerSuccess() {
    this.isGameActive = false;
    this.gameResult = true;

    // 문제 UI 숨김
    this.problemBarBg.setVisible(false);
    this.questionText.setVisible(false);

    // 성공 그래픽 표시
    this.successBg = this.add.image(0, 0, "successBg1").setDepth(50);
    this.successGet = this.add.image(0, 0, "successGet").setDepth(51);

    const randomId = Phaser.Math.Between(1, 3);
    this.successGift = this.add
      .image(0, 0, `successGift${randomId}`)
      .setDepth(52);

    // 위치 재조정
    this.refreshLayout();

    // 깜빡이는 애니메이션
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

  // [수정됨] 실패 로직
  // isWrongClick: 오답 과녁을 클릭해서 실패했으면 true, 시간 초과면 false
  triggerFail(isWrongClick = false) {
    this.isGameActive = false;
    this.gameResult = false;

    // 오답 클릭으로 인한 실패일 때만 시각 효과(검은 화면 + 이미지) 표시
    if (isWrongClick) {
      // 1. 오버레이(검은 반투명막) 표시
      if (this.failOverlay) this.failOverlay.setVisible(true);
      // 2. 실패 이미지 표시
      if (this.failImage) this.failImage.setVisible(true);

      // 위치 및 크기 갱신 (화면 크기에 맞게)
      this.refreshLayout();
    }
    // 시간 초과일 경우(isWrongClick = false)는 아무 효과 없이 조용히 종료됨
  }

  // 게임 종료 전 대기 시퀀스 (타이머가 0이 될 때까지 기다림)
  handleEndSequence(delta) {
    this.timeLeft -= delta;
    const ratio = Math.max(0, this.timeLeft / this.totalTime);
    this.timerBarFill.width = this.scale.width * 0.7 * ratio;

    const secondsLeft = Math.ceil(this.timeLeft / 1000);
    this.timerText.setText(secondsLeft);
    this.updateTimerColor(secondsLeft);

    // 시간이 완전히 다 되면 진짜로 게임 종료
    if (this.timeLeft <= 0) {
      this.finishGame();
    }
  }

  // 최종 종료 및 결과 부모 씬에 전달
  finishGame() {
    this.scale.off("resize", this.refreshLayout, this); // 리사이즈 이벤트 해제
    this.input.setDefaultCursor("default"); // 마우스 커서 원상복구

    // 메인 씬에 결과 전달
    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      this.mainScene.handleMiniGameResult(this.gameResult);
    }
    this.scene.stop(); // 씬 정지
  }

  // =================================================================
  // [7] Refresh Layout: 반응형 위치 관리자
  // * 화면 크기가 변할 때마다 호출되어 모든 객체의 위치와 크기를 다시 잡습니다.
  // =================================================================
  refreshLayout() {
    const width = this.scale.width;
    const height = this.scale.height;

    // 1. 배경 (화면 중앙, 꽉 차게)
    this.bg1.setPosition(width / 2, height / 2).setDisplaySize(width, height);
    this.bg2.setPosition(width / 2, height / 2).setDisplaySize(width, height);

    // [수정됨] 실패 UI 위치 잡기 (보일 때만 실행)
    if (this.failOverlay && this.failOverlay.visible) {
      this.failOverlay.setPosition(width / 2, height / 2);
      this.failOverlay.setSize(width, height); // 화면 전체를 덮도록 크기 조절
    }
    if (this.failImage && this.failImage.visible) {
      // 실패 이미지는 화면 중앙, 크기는 0.3배로 축소
      this.failImage.setPosition(width / 2, height / 2).setScale(0.3);
    }

    // 2. 성공 UI 위치 잡기
    if (this.successBg) {
      this.successBg
        .setPosition(width / 2, height / 2)
        .setDisplaySize(width, height);

      const itemX = width * 0.63;
      const itemY = height * 0.37;

      let srcW = 0;
      if (this.successGet && this.successGet.texture) {
        srcW = this.successGet.width;
      }
      if (!srcW)
        srcW = this.textures.get("successGet").getSourceImage().width || 100;

      const targetScale = (width * 0.25) / srcW;

      if (this.successGet)
        this.successGet.setPosition(itemX, itemY).setScale(targetScale);
      if (this.successGift)
        this.successGift
          .setPosition(width * 0.4, height * 0.5)
          .setScale(targetScale);
    }

    // 3. 문제 표시줄 (상단)
    const problemBarY = height * 0.075;
    this.problemBarBg
      .setPosition(width / 2, problemBarY)
      .setDisplaySize(width * 0.9, 100);
    this.questionText.setPosition(width / 2, problemBarY + 5);

    // 4. 타이머 (하단)
    const timerY = height * 0.9;
    const timerBarWidth = width * 0.7;
    const timerBarHeight = 40;

    this.timerBarFrame
      .setPosition(width / 2 + 40, timerY)
      .setDisplaySize(timerBarWidth + 20, timerBarHeight + 30);

    this.timerFillContainer.setPosition(
      width / 2 + 40 - timerBarWidth / 2,
      timerY,
    );
    this.timerBarFill.setPosition(0, 0);
    this.timerBarFill.height = timerBarHeight - 10;

    this.timerIcon
      .setPosition(width / 2 - timerBarWidth / 2, timerY - 20)
      .setDisplaySize(94 + 24, 114 + 28);
    this.timerText.setPosition(this.timerIcon.x - 3, this.timerIcon.y + 18);

    // 5. 과녁 위치 (반응형 좌표)
    if (this.targets && this.targets.length > 0) {
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
        }
      });
    }
  }
}
