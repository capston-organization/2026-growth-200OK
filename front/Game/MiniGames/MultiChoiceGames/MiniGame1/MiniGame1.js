/**
 * MiniGame1: 영어 단어 맞추기 (객관식)
 * 화면에 문제와 여러 개의 과녁(단어)을 띄우고 제한시간 내에 맞추는 게임
 */
class MiniGame1 extends Phaser.Scene {
  constructor() {
    super({ key: "MiniGame1" }); // 이 씬의 고유 키
  }

  // init: MainScene에서 scene.launch로 넘겨준 데이터를 받는 곳
  init(data) {
    this.mainScene = data.parent; // 결과를 보고할 MainScene의 참조(주소)
    this.speedLevel = data.speedLevel || 1; // 현재 스피드 레벨 (기본값 1)
  }

  create() {
    // 1. 화면 크기 가져오기
    const { width, height } = this.scale;

    // 2. 미니게임 전용 배경 생성 (MainScene 위에 덮어씌움)
    this.background = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0xffffff,
    );
    this.background.setDepth(0); // 가장 뒤쪽에 배치

    // 3. 타이머 설정 (스피드 레벨에 따라 시간 단축)
    // Lv1: 8초, Lv2: 7초 ... Lv5: 4초 (최소 4초 보장)
    let durationSec = 8 - (this.speedLevel - 1);
    if (durationSec < 4) durationSec = 4;

    this.totalTime = durationSec * 1000; // 밀리초 변환
    this.timeLeft = this.totalTime;
    this.isGameActive = true; // 게임 진행 중 플래그
    this.gameResult = false; // 기본값은 실패로 설정

    // 4. UI 요소를 담을 컨테이너 생성
    this.uiContainer = this.add.container(0, 0);

    // --- 문제 텍스트 표시 (화면 상단) ---
    this.questionText = this.add
      .text(width * 0.5, height * 0.15, "", {
        fontSize: "32px",
        color: "#000",
        fontFamily: "Arial",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);
    this.uiContainer.add(this.questionText);

    // --- 남은 시간 표시 바 (화면 하단) ---
    // 배경(회색)
    this.timerBarBg = this.add
      .rectangle(width * 0.5, height * 0.9, width * 0.9, 20, 0xcccccc)
      .setOrigin(0.5);
    // 게이지(빨간색)
    this.timerBarFill = this.add
      .rectangle(width * 0.05, height * 0.9, width * 0.9, 20, 0xff0000)
      .setOrigin(0, 0.5);
    this.uiContainer.add([this.timerBarBg, this.timerBarFill]);

    // 5. 커서 변경 (기본 마우스 숨기고 조준점 표시)
    this.input.setDefaultCursor("none");
    this.cursorObj = this.add.graphics();
    this.cursorObj.lineStyle(3, 0xff0000); // 빨간색 선
    this.cursorObj.strokeCircle(0, 0, 15); // 원형
    this.cursorObj.lineBetween(-20, 0, 20, 0); // 가로 십자
    this.cursorObj.lineBetween(0, -20, 0, 20); // 세로 십자
    this.cursorObj.setDepth(999); // 모든 요소보다 위에 표시

    // 6. 과녁 생성 및 문제 세팅
    this.createTargets(width, height);
    this.setProblem();

    // 7. 창 크기 변경 시 UI 위치 재조정 이벤트 연결
    this.scale.on("resize", this.resize, this);
  }

  // 매 프레임마다 실행되는 루프
  update(time, delta) {
    // 커서(조준점)가 마우스 위치를 따라다니게 함
    const pointer = this.input.activePointer;
    this.cursorObj.x = pointer.x;
    this.cursorObj.y = pointer.y;

    // 게임 종료 시퀀스(성공/실패 판정 후)라면 타이머만 줄이고 로직 종료
    if (!this.isGameActive) {
      this.handleEndSequence(delta);
      return;
    }

    // 시간 감소 로직
    this.timeLeft -= delta;

    // 타이머 바 길이 조절 (남은 시간에 비례)
    const ratio = Math.max(0, this.timeLeft / this.totalTime);
    this.timerBarFill.width = this.scale.width * 0.9 * ratio;

    // 시간 초과 체크
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.triggerFail(); // 시간 다 되면 실패 처리
    }
  }

  // 과녁(선택지)들을 생성하는 함수
  createTargets(width, height) {
    this.targets = [];
    // 화면 중앙 영역에 2행 3열(총 6개) 배치 계산
    const startX = width * 0.3;
    const startY = height * 0.4;
    const gapX = width * 0.2;
    const gapY = height * 0.25;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        let x = startX + col * gapX;
        let y = startY + row * gapY;

        let container = this.add.container(x, y);

        // 과녁 원 모양
        let circle = this.add.circle(0, 0, 40, 0xffffff);
        circle.setStrokeStyle(4, 0x000000);
        circle.setInteractive(); // 클릭 가능하게 설정

        // 단어 텍스트
        let word = this.add
          .text(0, 60, "", {
            fontSize: "20px",
            color: "#000",
            fontFamily: "Arial",
          })
          .setOrigin(0.5);

        container.add([circle, word]);
        this.add.existing(container);

        // 타겟의 상태 정보 저장
        let targetData = {
          container,
          circle,
          word,
          isAnswer: false, // 정답 여부
          clicked: false, // 이미 클릭했는지 여부
        };
        this.targets.push(targetData);

        // 클릭 이벤트 연결
        circle.on("pointerdown", () => this.onTargetClick(targetData));
      }
    }
  }

  // 문제를 출제하고 보기(과녁)에 단어를 배치하는 함수
  setProblem() {
    // 문제 데이터 (확장 가능)
    const problems = [
      {
        q: "She ___ happy.",
        answers: ["is", "was"],
        options: ["is", "are", "am", "were", "was", "be"],
      },
      {
        q: "We ___ friends.",
        answers: ["are", "were"],
        options: ["is", "are", "am", "were", "was", "be"],
      },
      {
        q: "It ___ rain.",
        answers: ["will", "can"],
        options: ["will", "can", "do", "are", "is", "am"],
      },
    ];

    // 문제 하나를 랜덤으로 선택
    const p = Phaser.Utils.Array.GetRandom(problems);
    this.questionText.setText(p.q);

    // 보기 순서를 섞음
    const options = Phaser.Utils.Array.Shuffle([...p.options]);

    this.correctCount = 0; // 플레이어가 찾은 정답 개수
    this.totalCorrect = 0; // 실제 정답 총 개수

    // 각 과녁에 단어 할당 및 정답 여부 설정
    this.targets.forEach((t, i) => {
      t.word.setText(options[i]);
      t.clicked = false;
      t.circle.setFillStyle(0xffffff); // 흰색으로 초기화

      if (p.answers.includes(options[i])) {
        t.isAnswer = true;
        this.totalCorrect++;
      } else {
        t.isAnswer = false;
      }
    });
  }

  // 과녁을 클릭했을 때 실행되는 함수
  onTargetClick(target) {
    if (!this.isGameActive || target.clicked) return; // 게임 끝났거나 이미 클릭했으면 무시

    target.clicked = true;

    if (target.isAnswer) {
      // 정답을 클릭했을 때: 회색으로 변경
      target.circle.setFillStyle(0xaaaaaa);
      this.correctCount++;

      // 모든 정답을 다 찾았는지 확인
      if (this.correctCount >= this.totalCorrect) {
        this.triggerSuccess(); // 성공 처리
      }
    } else {
      // 오답을 클릭했을 때: 빨간색 표시 후 즉시 실패
      target.circle.setFillStyle(0xff0000);
      this.triggerFail(true); // 오답 클릭으로 인한 실패임을 표시
    }
  }

  // 성공 시 실행: 배경을 푸르게 바꾸고 종료 대기
  triggerSuccess() {
    this.isGameActive = false;
    this.gameResult = true; // 결과: 성공
    this.background.setFillStyle(0xccccff); // 연한 푸른색 배경
    // 남은 시간(타이머)이 다 줄어들 때까지 기다렸다가 finishGame 호출됨 (update에서 처리)
  }

  // 실패 시 실행: 배경을 붉게 바꾸고 종료 대기
  triggerFail(isWrongClick = false) {
    this.isGameActive = false;
    this.gameResult = false; // 결과: 실패
    if (isWrongClick) {
      this.background.setFillStyle(0xffcccc); // 오답 클릭 시 연한 붉은색 배경
    }
    // 남은 시간이 다 줄어들 때까지 기다림
  }

  // 결과 판정 후, 남은 시간이 줄어드는 연출을 처리하는 함수
  handleEndSequence(delta) {
    this.timeLeft -= delta;
    const ratio = Math.max(0, this.timeLeft / this.totalTime);
    this.timerBarFill.width = this.scale.width * 0.9 * ratio;

    // 시간이 완전히 0이 되면 게임을 진짜로 종료함
    if (this.timeLeft <= 0) {
      this.finishGame();
    }
  }

  // 미니게임을 완전히 종료하고 MainScene으로 복귀하는 함수
  finishGame() {
    // [★ 수정] 중요! 게임이 끝날 때 리사이즈 이벤트를 반드시 꺼줘야 합니다.
    this.scale.off("resize", this.resize, this);

    this.input.setDefaultCursor("default"); // 시스템 커서(화살표)로 복구

    // MainScene에 결과(true/false) 전달
    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      this.mainScene.handleMiniGameResult(this.gameResult);
    }

    // 현재 씬(MiniGame1)을 종료하고 제거
    this.scene.stop();
  }

  // 창 크기 변경 시 UI 위치 재조정 (반응형)
  resize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    this.background.setSize(width, height);
    this.background.setPosition(width / 2, height / 2);

    this.questionText.setPosition(width * 0.5, height * 0.15);
    this.timerBarBg.setPosition(width * 0.5, height * 0.9);
    this.timerBarBg.setSize(width * 0.9, 20);
    this.timerBarFill.setPosition(width * 0.05, height * 0.9);

    // 과녁들도 위치 재계산
    const startX = width * 0.3;
    const startY = height * 0.4;
    const gapX = width * 0.2;
    const gapY = height * 0.25;

    this.targets.forEach((t, i) => {
      let row = Math.floor(i / 3);
      let col = i % 3;
      t.container.setPosition(startX + col * gapX, startY + row * gapY);
    });
  }
}
