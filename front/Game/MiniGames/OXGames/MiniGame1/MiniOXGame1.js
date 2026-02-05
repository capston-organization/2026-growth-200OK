/**
 * MiniOXGame1: 와리오웨어 스타일의 문법 OX 퀴즈 미니게임
 * * [게임 규칙]
 * 1. 화면 중앙 상단 검은 박스(컨베이어 벨트)에서 흰색 직사각형들이 지나갑니다.
 * 2. 특정 타이밍에 '영어 문장'이 적힌 직사각형이 지나갑니다.
 * 3. 플레이어는 문법이 맞으면 O, 틀리면 X 버튼을 누릅니다.
 * 4. 정답/오답 여부를 선택해도 게임은 멈추지 않고 타이머가 0이 될 때까지 진행됩니다.
 * 5. 타이머가 종료되면 메인 씬(MainScene)으로 결과를 반환하고 종료합니다.
 */

class MiniOXGame1 extends Phaser.Scene {
  constructor() {
    super({ key: "MiniOXGame1" });
  }

  /**
   * init: 장면이 시작되기 전 데이터를 받아오는 단계
   * @param {object} data - MainScene에서 전달받은 데이터 (speedLevel, parent 등)
   */
  init(data) {
    this.mainScene = data.parent; // 결과를 보고할 메인 씬 참조
    this.speedLevel = data.speedLevel || 1; // 난이도 조절용 속도 값
  }

  /**
   * create: 화면의 시각적 요소(배경, 버튼, 박스 등)를 배치하고 초기화하는 단계
   */
  create() {
    const { width, height } = this.scale;

    // ----------------------------------------------------------------
    // 1. 기본 배경 및 타이머 설정
    // ----------------------------------------------------------------
    this.background = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0xffffff, // 흰색 배경
    );
    this.background.setDepth(0); // 가장 뒤쪽에 배치

    // 난이도(speedLevel)에 따른 제한 시간 설정 (레벨이 높을수록 시간이 짧아짐)
    let durationSec = 8 - (this.speedLevel - 1);
    if (durationSec < 4) durationSec = 4; // 최소 4초는 보장
    this.totalTime = durationSec * 1000;
    this.timeLeft = this.totalTime;

    // ----------------------------------------------------------------
    // 2. 게임 상태 플래그 (Flag) 변수들
    // ----------------------------------------------------------------
    this.isGameActive = true; // true일 때만 update 루프가 동작함
    this.isResolved = false; // 사용자가 O/X 버튼을 눌렀는지 여부 (중복 클릭 방지)
    this.gameResult = false; // 최종 성공/실패 여부 저장

    // ----------------------------------------------------------------
    // 3. UI 레이아웃 구성
    // ----------------------------------------------------------------
    this.uiContainer = this.add.container(0, 0);
    this.uiContainer.setDepth(1);

    // --- [중요] 중앙 상단 '컨베이어 벨트' 영역 (검은 박스) ---
    const boxWidth = width * 0.85;
    const boxHeight = height * 0.4;
    const boxY = height * 0.35;

    // [마스크(Mask) 생성]
    // 이 마스크 영역 밖으로 나가는 아이템(흰색 직사각형)은 화면에 보이지 않게 잘라냅니다.
    // 즉, 검은 박스 안에서만 아이템이 보이는 효과를 줍니다.
    this.maskShape = this.make.graphics();
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(
      width / 2 - boxWidth / 2,
      boxY - boxHeight / 2,
      boxWidth,
      boxHeight,
    );
    const mask = this.maskShape.createGeometryMask();

    // 검은색 배경 박스 그리기
    this.conveyorBg = this.add.rectangle(
      width / 2,
      boxY,
      boxWidth,
      boxHeight,
      0x000000,
    );
    this.conveyorBg.setDepth(10);

    // 중앙의 흰색 기둥 (시각적 장식)
    this.pillar = this.add.rectangle(width / 2, boxY, 20, boxHeight, 0xffffff);
    this.pillar.setDepth(30);

    // --- [아이템 관리 변수] ---
    this.movingItems = []; // 현재 화면에 떠다니는 아이템들을 담을 배열
    this.conveyorY = boxY;
    this.conveyorBoxSize = { w: boxWidth, h: boxHeight }; // 나중에 아이템 크기 계산용
    this.itemMask = mask; // 아이템 생성 시 적용할 마스크

    // 문제 데이터 준비
    this.problemData = this.getProblem();
    this.hasSentenceSpawned = false; // "문제가 적힌 박스"가 이미 나왔는지 체크

    // 아이템 순차 생성 제어용 플래그
    this.isWaitingForNextSpawn = false;

    // 게임 시작 시 첫 번째 아이템 바로 생성
    this.spawnConveyorItem();

    // ----------------------------------------------------------------
    // 4. 하단 컨트롤러 (O / X 버튼)
    // ----------------------------------------------------------------
    const btnY = height * 0.75;
    const btnGap = width * 0.2;

    // O 버튼 (파란색)
    this.btnO = this.add.circle(width / 2 - btnGap, btnY, 50, 0x0000ff);
    this.btnO.setDepth(10);
    this.btnO.setInteractive(); // 클릭 가능하게 설정
    this.textO = this.add
      .text(this.btnO.x, this.btnO.y, "O", {
        fontSize: "40px",
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(11);

    // X 버튼 (빨간색)
    this.btnX = this.add.circle(width / 2 + btnGap, btnY, 50, 0xff0000);
    this.btnX.setDepth(10);
    this.btnX.setInteractive();
    this.textX = this.add
      .text(this.btnX.x, this.btnX.y, "X", {
        fontSize: "40px",
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(11);

    // 클릭 이벤트 연결
    this.btnO.on("pointerdown", () => this.handleAnswer(true));
    this.btnX.on("pointerdown", () => this.handleAnswer(false));

    // ----------------------------------------------------------------
    // 5. 하단 타이머 바 (남은 시간 표시)
    // ----------------------------------------------------------------
    this.timerBarBg = this.add
      .rectangle(width * 0.5, height * 0.95, width * 0.9, 20, 0xcccccc)
      .setOrigin(0.5);
    this.timerBarFill = this.add
      .rectangle(width * 0.05, height * 0.95, width * 0.9, 20, 0xff0000)
      .setOrigin(0, 0.5);

    // 화면 크기가 변하면 resize 함수 호출
    this.scale.on("resize", this.resize, this);
  }

  /**
   * update: 매 프레임마다 실행되는 게임 루프
   * @param {number} time - 현재 시간
   * @param {number} delta - 이전 프레임과의 시간 차이(ms)
   */
  update(time, delta) {
    // 1. 게임 종료 상태라면 아무것도 하지 않음 (안전장치)
    if (!this.isGameActive) return;

    // 2. 타이머 감소 로직 (버튼을 눌렀어도 시간은 계속 흐릅니다!)
    this.timeLeft -= delta;

    // 타이머 바 길이 시각화 (비율 계산)
    const ratio = Math.max(0, this.timeLeft / this.totalTime);
    this.timerBarFill.width = this.scale.width * 0.9 * ratio;

    // 3. 시간이 다 됐을 때 처리 (게임 종료)
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finishGame(); // 여기서 메인 게임으로 결과를 보내고 종료
      return;
    }

    // 4. 아이템 이동 및 화면 밖 삭제 로직
    const moveSpeed = this.scale.width * 0.8 * (delta / 1000); // 이동 속도

    // 배열을 역순으로 순회합니다 (삭제 시 인덱스 오류 방지)
    for (let i = this.movingItems.length - 1; i >= 0; i--) {
      let item = this.movingItems[i];
      item.x += moveSpeed;

      // ★ [핵심] 자연스러운 삭제 조건
      // 아이템의 중심점(x)에서 절반 너비(halfWidth)를 뺀 값, 즉 '왼쪽 꼬리'가
      // 화면 오른쪽 끝을 완전히 넘어갔을 때만 삭제합니다.
      // 이렇게 해야 긴 문장 박스가 툭 하고 사라지지 않고 부드럽게 퇴장합니다.
      if (item.x - item.halfWidth > this.scale.width + 100) {
        item.destroy(); // 화면에서 객체 제거
        this.movingItems.splice(i, 1); // 배열에서 데이터 제거
      }
    }

    // 5. 다음 아이템 생성 관리 (순차적 생성)
    // 화면에 움직이는 아이템이 하나도 없고, 생성 대기 중도 아니라면?
    if (this.movingItems.length === 0 && !this.isWaitingForNextSpawn) {
      this.isWaitingForNextSpawn = true;

      // 랜덤 딜레이 후 생성 (0.8 ~ 1.8초)
      const randomDelay = Phaser.Math.Between(600, 1200);

      this.time.delayedCall(randomDelay, () => {
        if (this.isGameActive) {
          this.spawnConveyorItem(); // 새 아이템 생성
          this.isWaitingForNextSpawn = false; // 대기 해제
        }
      });
    }
  }

  /**
   * spawnConveyorItem: 컨베이어 벨트에 새로운 흰색 직사각형(아이템)을 생성
   */
  spawnConveyorItem() {
    let isProblem = false;

    // --- 문제 출제 여부 결정 로직 ---
    // 1. 아직 문제를 안 냈는데 시간이 4.5초 이하로 남았다면? -> 강제 출제 (무조건 나옴)
    if (!this.hasSentenceSpawned && this.timeLeft <= 4500) {
      isProblem = true;
    }
    // 2. 아직 문제를 안 냈고, 랜덤 확률(40%)에 당첨됐다면? -> 출제
    else if (!this.hasSentenceSpawned && Phaser.Math.Between(0, 100) < 40) {
      isProblem = true;
    }

    // 아이템 기본 크기 설정
    let itemWidth = this.conveyorBoxSize.w * 0.55;
    const itemHeight = this.conveyorBoxSize.h * 0.7;

    let textObj = null;

    // 이번에 문제를 낼 차례라면?
    if (isProblem) {
      this.hasSentenceSpawned = true; // "문제 냈음" 체크

      // 텍스트 객체 미리 생성 (길이 측정을 위해)
      const fontSizeVal = Math.floor(itemHeight * 0.4);
      textObj = this.add
        .text(0, 0, this.problemData.sentence, {
          fontSize: `${fontSizeVal}px`,
          color: "#000",
          fontFamily: "Arial",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      // 만약 텍스트가 기본 박스보다 길다면, 박스 크기를 텍스트에 맞춰 늘림
      if (textObj.width + 60 > itemWidth) {
        itemWidth = textObj.width + 60;
      }
    }

    // 시작 위치: 화면 왼쪽 바깥 (너비만큼 뒤에서 시작해야 자연스럽게 등장)
    const startX = -itemWidth;
    const startY = this.conveyorY;

    // [Container 사용] 박스(Rect)와 텍스트(Text)를 하나의 그룹으로 묶음
    const container = this.add.container(startX, startY);
    container.setDepth(20);
    container.setMask(this.itemMask); // 마스크 적용 (검은 박스 안에서만 보임)

    // ★ [삭제 로직을 위한 핵심 데이터 저장]
    // 나중에 update에서 '왼쪽 꼬리' 위치를 계산하기 위해 절반 너비를 저장해둡니다.
    container.halfWidth = itemWidth / 2;

    // 흰색 배경 사각형 추가
    const rect = this.add.rectangle(0, 0, itemWidth, itemHeight, 0xffffff);
    container.add(rect);

    // 텍스트가 있다면 컨테이너에 추가
    if (textObj) {
      container.add(textObj);
    }

    // 씬에 추가하고 관리 배열에 등록
    this.add.existing(container);
    this.movingItems.push(container);
  }

  /**
   * getProblem: 랜덤한 문제 데이터 하나를 반환
   */
  getProblem() {
    const problems = [
      { sentence: "She were happy because she are a girls.", isCorrect: false },
      {
        sentence: "He want to play basketball.",
        isCorrect: true, // (참고: 문법적으로 틀린 문장이지만 코드 원본 데이터 유지)
      },
      {
        sentence: "They runs fastly but they can't walking.",
        isCorrect: false,
      },
      { sentence: "I am a boy.", isCorrect: true },
      { sentence: "Cat can't fly.", isCorrect: false },
      { sentence: "Sun is very hot.", isCorrect: true },
    ];
    return Phaser.Utils.Array.GetRandom(problems);
  }

  /**
   * handleAnswer: 사용자가 O 또는 X 버튼을 눌렀을 때 처리
   * @param {boolean} userChoseO - 사용자가 O를 눌렀으면 true, X면 false
   */
  handleAnswer(userChoseO) {
    // 1. 이미 답을 골랐거나(isResolved), 게임이 끝났다면 무시 (중복 클릭 방지)
    if (this.isResolved || !this.isGameActive) return;

    this.isResolved = true; // "답변 완료" 상태로 변경

    // 2. 버튼 클릭 시각 효과 (선택한 버튼 색을 진하게 변경)
    if (userChoseO) this.btnO.setFillStyle(0x000088);
    else this.btnX.setFillStyle(0x880000);

    // 3. 정답 판별
    const isCorrect = userChoseO === this.problemData.isCorrect;

    // 4. 결과에 따른 배경색 변경 (성공/실패 피드백)
    // ★ 주의: 여기서 게임을 멈추지 않습니다! 배경색만 바꾸고 시간은 계속 흐르게 둡니다.
    if (isCorrect) {
      this.gameResult = true; // 결과: 성공
      this.background.setFillStyle(0xffff00); // 노란 배경
    } else {
      this.gameResult = false; // 결과: 실패
      this.background.setFillStyle(0xff0000); // 붉은 배경
    }
  }

  /**
   * finishGame: 시간이 완전히 종료(0초)되었을 때 호출
   */
  finishGame() {
    this.isGameActive = false; // 게임 루프 정지

    // 만약 시간이 다 될 때까지 버튼을 한 번도 안 눌렀다면? -> 실패 처리
    if (!this.isResolved) {
      this.gameResult = false;
      this.background.setFillStyle(0xff0000); // 실패 피드백 (붉은색)
    }

    // 리사이즈 이벤트 리스너 해제 (메모리 누수 방지)
    this.scale.off("resize", this.resize, this);

    // MainScene에 최종 결과(true/false)를 보고하고 씬을 종료
    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      this.mainScene.handleMiniGameResult(this.gameResult);
    }
    this.scene.stop();
  }

  /**
   * resize: 브라우저 창 크기가 바뀔 때 UI 요소들의 위치/크기를 재조정 (반응형)
   */
  resize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    // 배경 크기 재조정
    this.background.setSize(width, height);
    this.background.setPosition(width / 2, height / 2);

    // 검은 박스 크기 및 위치 재계산
    const boxWidth = width * 0.85;
    const boxHeight = height * 0.4;
    const boxY = height * 0.35;

    this.conveyorBoxSize = { w: boxWidth, h: boxHeight };

    this.conveyorBg.setPosition(width / 2, boxY);
    this.conveyorBg.setSize(boxWidth, boxHeight);
    this.conveyorY = boxY;

    this.pillar.setPosition(width / 2, boxY);
    this.pillar.setSize(20, boxHeight);

    // 마스크 영역 재설정
    if (this.maskShape) {
      this.maskShape.clear();
      this.maskShape.fillStyle(0xffffff);
      this.maskShape.fillRect(
        width / 2 - boxWidth / 2,
        boxY - boxHeight / 2,
        boxWidth,
        boxHeight,
      );
    }

    // 버튼 위치 재조정
    const btnY = height * 0.75;
    const btnGap = width * 0.2;

    this.btnO.setPosition(width / 2 - btnGap, btnY);
    this.textO.setPosition(width / 2 - btnGap, btnY);

    this.btnX.setPosition(width / 2 + btnGap, btnY);
    this.textX.setPosition(width / 2 + btnGap, btnY);

    // 타이머 바 재조정
    this.timerBarBg.setPosition(width * 0.5, height * 0.95);
    this.timerBarBg.setSize(width * 0.9, 20);
    this.timerBarFill.setPosition(width * 0.05, height * 0.95);
  }
}
