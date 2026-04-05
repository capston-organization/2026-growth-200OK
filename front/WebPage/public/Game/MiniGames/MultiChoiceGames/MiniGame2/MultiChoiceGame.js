/* global Phaser */
/**
 * MultiChoiceGame.js (객관식 = 로봇 리듬 게임)
 * MiniGame2 버전: MainGame1에서 재사용하기 위해 MiniGames 디렉터리로 이동.
 * 에셋 경로: ../../MiniGames/MultiChoiceGames/MiniGame2/assets/
 */
class MultiChoiceGame extends Phaser.Scene {
  constructor() {
    super({ key: "MultiChoiceGame" });
  }

  init(data) {
    this.mainScene = data.parent;
    this.speedLevel = data.speedLevel || 1;
    this.currentProblem = data.problem || null; // MainGame1에서 넘겨준 1개의 문제
  }

  preload() {
    this.load.setPath("../../MiniGames/MultiChoiceGames/MiniGame2/assets/");
    this.load.image("robotBase", "images/로봇리듬기본로봇.png");
    this.load.image("robotLeft", "images/로봇리듬왼손로봇.png");
    this.load.image("robotRight", "images/로봇리듬오른손로봇.png");
    this.load.image("drumImg", "images/로봇리듬북.png");
    this.load.audio("drumHit", "sounds/드럼.mp3");
    this.load.audio("robotRhythmBg", "sounds/로봇리듬배경음악.mp3");
  }

  create() {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    /** 이미지 스프라이트만 확대 (위치·앵커는 그대로). 조절 시 이 값만 변경 */
    var spriteDisplayMul = 1.5;
    /** 로봇·북 줄을 통째로 위로 올림(px) — 하단 텍스트 가림 완화 */
    var robotDrumLiftPx = 145;
    /** 로봇(기본/왼손/오른손)만 추가 축소 — 북은 그대로 */
    var robotOnlyScaleMul = 0.9;

    this.cameras.main.setBackgroundColor("#1a1a2e");

    // 배경음은 로드에 성공한 경우에만 재생
    if (this.cache.audio.exists("robotRhythmBg")) {
      try {
        this._bgMusicSuppressed = false;
        this.backgroundMusic = this.sound.add("robotRhythmBg", {
          loop: true,
          volume: 2.5,
        });
        var playBg = function () {
          if (this._bgMusicSuppressed) return;
          if (!this.backgroundMusic || this.backgroundMusic.isPlaying) return;
          var ctx = this.sound.context;
          if (ctx.state === "suspended") {
            ctx
              .resume()
              .then(
                function () {
                  if (!this._bgMusicSuppressed && this.backgroundMusic) {
                    this.backgroundMusic.play();
                  }
                }.bind(this),
              )
              .catch(function () {});
          } else {
            this.backgroundMusic.play();
          }
        }.bind(this);
        var unlockBg = function () {
          if (this._bgMusicSuppressed) return;
          playBg();
          if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.input.off("pointerdown", this._unlockBgHandler);
            if (this.input.keyboard)
              this.input.keyboard.off("keydown", this._unlockBgHandler);
          }
        }.bind(this);
        this._unlockBgHandler = unlockBg;
        this._bgDelayedPlayEvent = this.time.delayedCall(600, playBg);
        this.input.on("pointerdown", unlockBg);
        if (this.input.keyboard) this.input.keyboard.on("keydown", unlockBg);
      } catch (e) {
        console.warn("로봇 리듬 배경음악 재생 실패:", e);
      }
    }

    var questionBoxWidth = width - 400;
    var questionBoxHeight = 120;
    var questionBoxY = 100;

    this.questionBoxBg = this.add.graphics();
    this.questionBoxBg.fillStyle(0x16213e, 1);
    this.questionBoxBg.fillRoundedRect(
      width / 2 - questionBoxWidth / 2,
      questionBoxY - questionBoxHeight / 2,
      questionBoxWidth,
      questionBoxHeight,
      20,
    );
    this.questionBoxBg.lineStyle(3, 0x00d4ff, 1);
    this.questionBoxBg.strokeRoundedRect(
      width / 2 - questionBoxWidth / 2,
      questionBoxY - questionBoxHeight / 2,
      questionBoxWidth,
      questionBoxHeight,
      20,
    );

    this.questionText = this.add
      .text(width / 2, questionBoxY, "", {
        fontSize: "38px",
        fill: "#00d4ff",
        fontFamily: "Arial",
        fontStyle: "bold",
        stroke: "#0f3460",
        strokeThickness: 2,
        wordWrap: { width: questionBoxWidth - 40 },
      })
      .setOrigin(0.5);

    var optionStartY = questionBoxY + questionBoxHeight / 2 + 50;
    var buttonSpacing = 12;
    var totalOptionW = width - 120;
    var buttonWidth = (totalOptionW - buttonSpacing * 4) / 5;
    var buttonHeight = 72;
    var totalW = 5 * buttonWidth + 4 * buttonSpacing;
    var firstCenterX = width / 2 - totalW / 2 + buttonWidth / 2;

    this.optionButtons = [];
    this.optionTexts = [];
    for (var j = 0; j < 5; j++) {
      var px = firstCenterX + j * (buttonWidth + buttonSpacing);
      var py = optionStartY;
      var btn = this.add
        .rectangle(px, py, buttonWidth, buttonHeight, 0x2a2a3e, 1)
        .setInteractive({ useHandCursor: true });
      var txt = this.add
        .text(px, py, "", {
          fontSize: "28px",
          fill: "#00d4ff",
          fontFamily: "Arial",
          fontStyle: "bold",
          wordWrap: { width: buttonWidth - 30 },
          align: "center",
        })
        .setOrigin(0.5);
      this.optionButtons.push(btn);
      this.optionTexts.push(txt);
      (function (button) {
        btn
          .on(
            "pointerover",
            function () {
              if (!this.showResult) {
                button.setFillStyle(0x3a3a4e, 1);
                button.setStrokeStyle(2, 0x00d4ff, 1);
              }
            },
            this,
          )
          .on(
            "pointerout",
            function () {
              if (!this.showResult) {
                button.setFillStyle(0x2a2a3e, 1);
                button.setStrokeStyle(0, 0x000000, 0);
              }
            },
            this,
          );
      }).call(this, btn);
    }

    var robotY = height - 180 - robotDrumLiftPx;
    var robotStartX = width / 2;
    this.robot = this.add
      .image(robotStartX, robotY, "robotBase")
      .setOrigin(0.5, 0.5);
    var robotMaxW = 280;
    var robotMaxH = 320;
    var robotScale = Math.min(
      robotMaxW / this.robot.width,
      robotMaxH / this.robot.height,
    );
    this.robot.setScale(robotScale * spriteDisplayMul * robotOnlyScaleMul);
    this.robot.setDepth(10);
    this.robot
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", this.hitRobot, this);
    this.robotPosition = 0;

    var drumY = height - 240 - robotDrumLiftPx;
    var drumWidth = (width - 20) / 5;
    var drumStartX = 10;
    var drumMaxW = drumWidth;
    var drumMaxH = 360;
    this.drums = [];
    for (var d = 0; d < 5; d++) {
      var drumX = drumStartX + d * drumWidth + drumWidth / 2;
      var drum = this.add.image(drumX, drumY, "drumImg").setOrigin(0.5, 0.5);
      var drumScale = Math.min(drumMaxW / drum.width, drumMaxH / drum.height);
      drum.setScale(drumScale * spriteDisplayMul);
      drum.setDepth(0);
      (function (drumObj) {
        drum
          .setInteractive({ useHandCursor: false })
          .on(
            "pointerover",
            function () {
              if (!this.showResult) drumObj.setTint(0x88ffff);
            },
            this,
          )
          .on(
            "pointerout",
            function () {
              drumObj.clearTint();
            },
            this,
          );
      }).call(this, drum);
      var label = this.add
        .text(drumX, drumY, String.fromCharCode(65 + d), {
          fontSize: "48px",
          fill: "#00d4ff",
          fontFamily: "Arial",
          fontStyle: "bold",
          stroke: "#0f3460",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(5);
      this.drums.push({ drum: drum, label: label, index: d });
    }

    var timingGuideY = height - 64;
    var arrowAboveGuideOffset = 52;
    var arrowRowY = timingGuideY - arrowAboveGuideOffset;
    var arrowScaleMul = 1.1;

    var leftArrowX = robotStartX - 100;
    this.leftArrow = this.add
      .polygon(leftArrowX, arrowRowY, [-30, 0, 10, -20, 10, 20], 0x00d4ff, 1)
      .setScale(arrowScaleMul)
      .setDepth(25)
      .setInteractive({
        useHandCursor: true,
        hitArea: new Phaser.Geom.Polygon([-30, 0, 10, -20, 10, 20]),
        hitAreaCallback: Phaser.Geom.Polygon.Contains,
      })
      .on(
        "pointerdown",
        function () {
          this.moveRobot(-1);
        },
        this,
      )
      .on(
        "pointerover",
        function () {
          this.leftArrow.setFillStyle(0x00ffff, 1);
        },
        this,
      )
      .on(
        "pointerout",
        function () {
          this.leftArrow.setFillStyle(0x00d4ff, 1);
        },
        this,
      );

    var rightArrowX = robotStartX + 100;
    this.rightArrow = this.add
      .polygon(rightArrowX, arrowRowY, [30, 0, -10, -20, -10, 20], 0x00d4ff, 1)
      .setScale(arrowScaleMul)
      .setDepth(25)
      .setInteractive({
        useHandCursor: true,
        hitArea: new Phaser.Geom.Polygon([30, 0, -10, -20, -10, 20]),
        hitAreaCallback: Phaser.Geom.Polygon.Contains,
      })
      .on(
        "pointerdown",
        function () {
          this.moveRobot(1);
        },
        this,
      )
      .on(
        "pointerover",
        function () {
          this.rightArrow.setFillStyle(0x00ffff, 1);
        },
        this,
      )
      .on(
        "pointerout",
        function () {
          this.rightArrow.setFillStyle(0x00d4ff, 1);
        },
        this,
      );

    this.resultText = this.add
      .text(width / 2, height - 28, "", {
        fontSize: "38px",
        fill: "#00d4ff",
        fontFamily: "Arial",
        fontStyle: "bold",
        wordWrap: { width: width - 80 },
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setVisible(false);

    this.timingGuideText = this.add
      .text(
        width / 2,
        timingGuideY,
        "화살표로 이동 후 로봇을 4번 클릭해서 북을 치세요!",
        {
          fontSize: "26px",
          fill: "#00d4ff",
          fontFamily: "Arial",
          fontStyle: "bold",
          wordWrap: { width: width - 80 },
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setDepth(30);

    // MainGame1에서 problem을 넘겨준 경우: 그 문제 1개로만 라운드 구성
    if (this.currentProblem) {
      var opts =
        this.currentProblem && this.currentProblem.options
          ? this.currentProblem.options.slice()
          : [];
      while (opts.length < 5) opts.push("");

      var correctStr =
        this.currentProblem && this.currentProblem.correctAnswer != null
          ? String(this.currentProblem.correctAnswer)
          : "";
      var correctIndex = opts.findIndex(function (o) {
        return String(o) === correctStr;
      });
      if (correctIndex < 0) correctIndex = 0;

      this.questions = [
        {
          question: (this.currentProblem && this.currentProblem.question) || "",
          options: opts.slice(0, 5),
          correctAnswer: correctIndex,
        },
      ];
    } else {
      // 기존 MainGame3용 Mock 데이터 (문제 여러 개)
      this.questions = [
        {
          question: "Which is correct? (3rd person singular)",
          options: ["He go", "He goes", "He going", "He gone", "He went"],
          correctAnswer: 1,
        },
        {
          question: "What is the correct past tense of 'run'?",
          options: ["runned", "ran", "run", "running", "runs"],
          correctAnswer: 1,
        },
        {
          question: "Which sentence is grammatically correct?",
          options: [
            "She don't like it",
            "She doesn't like it",
            "She not like it",
            "She doesn't likes it",
            "She not likes it",
          ],
          correctAnswer: 1,
        },
        {
          question: "What is the plural of 'mouse'?",
          options: ["mouses", "mice", "mouse", "mices", "mousies"],
          correctAnswer: 1,
        },
      ];
    }
    this.currentQuestionIndex = 0;
    this.showResult = false;
    this.drumHitCount = 0;
    this.currentDrumForHits = null;

    // [추가] MiniMultiGame1과 동일하게 speedLevel에 따라 제한시간을 두는 타이머 로직
    // - speedLevel이 높을수록 durationSec이 짧아지도록 설정 (최소 4초)
    var durationSec = 9 - (this.speedLevel - 1);
    if (durationSec < 4) durationSec = 4;
    this.totalTimeMs = durationSec * 1000;
    this.isGameActive = true;

    // 제한시간이 끝나면 자동으로 오답 처리(checkAnswer를 timeout 모드로 호출)
    this.time.delayedCall(
      this.totalTimeMs,
      function () {
        if (this.showResult || !this.isGameActive) return;
        this.isGameActive = false;
        this.checkAnswer(null); // null을 넘겨서 '시간 초과 = 오답' 처리
      },
      [],
      this,
    );

    this.time.delayedCall(500, this.showQuestion, [], this);
  }

  /** 정답/오답/시간초과 등 결과가 나오는 순간 배경음을 끄고, 지연 재생·언락으로 다시 켜지지 않게 함 */
  stopBackgroundMusic() {
    this._bgMusicSuppressed = true;
    if (this._bgDelayedPlayEvent) {
      this._bgDelayedPlayEvent.remove(false);
      this._bgDelayedPlayEvent = null;
    }
    if (this._unlockBgHandler) {
      this.input.off("pointerdown", this._unlockBgHandler);
      if (this.input.keyboard)
        this.input.keyboard.off("keydown", this._unlockBgHandler);
      this._unlockBgHandler = null;
    }
    if (this.sound && this.sound.stopByKey) {
      this.sound.stopByKey("robotRhythmBg");
    }
    if (this.backgroundMusic) {
      try {
        this.backgroundMusic.stop();
      } catch (e) {
        console.warn("배경음 정지 실패:", e);
      }
      this.backgroundMusic = null;
    }
  }

  moveRobot(direction) {
    // [변경] 결과가 나왔거나 제한시간이 끝난 뒤에는 이동 불가
    if (this.showResult || !this.isGameActive) return;
    var newPosition = this.robotPosition + direction;
    if (newPosition < 0 || newPosition > 4) return;
    this.robotPosition = newPosition;
    var targetX = this.drums[this.robotPosition].drum.x;
    this.tweens.add({
      targets: this.robot,
      x: targetX,
      duration: 300,
      ease: "Power2",
    });
  }

  hitRobot() {
    // [변경] 결과가 나왔거나 제한시간이 끝난 뒤에는 입력(북 치기) 불가
    if (this.showResult || !this.isGameActive) return;
    try {
      this.sound.play("drumHit", { volume: 8 });
    } catch {
      // ignore sound error
    }
    var drumIndex = this.robotPosition;
    if (
      this.currentDrumForHits !== null &&
      this.currentDrumForHits !== drumIndex
    ) {
      this.drumHitCount = 0;
    }
    this.currentDrumForHits = drumIndex;
    this.drumHitCount += 1;

    if (this.drumHitCount % 2 === 1) {
      this.robot.setTexture("robotLeft");
    } else {
      this.robot.setTexture("robotRight");
    }

    var drum = this.drums[drumIndex].drum;
    var baseScale = drum.scaleX;
    this.tweens.add({
      targets: drum,
      scaleX: baseScale * 1.1,
      scaleY: baseScale * 1.1,
      duration: 80,
      yoyo: true,
      ease: "Power2",
    });

    if (this.drumHitCount >= 4) {
      this.time.delayedCall(
        150,
        function () {
          this.robot.setTexture("robotBase");
          this.checkAnswer(drumIndex);
        },
        [],
        this,
      );
    } else {
      this.time.delayedCall(
        200,
        function () {
          if (!this.showResult) this.robot.setTexture("robotBase");
        },
        [],
        this,
      );
    }
  }

  // [변경] drumIndex가 null이면 '시간 초과'로 간주하여 무조건 오답 처리
  checkAnswer(drumIndex) {
    if (this.showResult) return;
    this.stopBackgroundMusic();
    this.drumHitCount = 0;
    this.currentDrumForHits = null;
    var question = this.questions[this.currentQuestionIndex];
    var isTimeout = drumIndex === null || drumIndex === undefined;
    var isCorrect = !isTimeout && drumIndex === question.correctAnswer;
    this.showResult = true;
    this.robot.setTexture("robotBase");

    if (isCorrect) {
      this.resultText.setText("Perfect! 정답입니다! ✓");
      this.resultText.setFill("#00ff88");
      this.drums[drumIndex].drum.setTint(0x00ff88);
    } else {
      this.resultText.setText(
        "틀렸습니다! 정답은 " +
          String.fromCharCode(65 + question.correctAnswer) +
          "번입니다. ✗",
      );
      this.resultText.setFill("#ff4444");
      // 시간 초과(null)일 때는 선택된 드럼이 없으므로 틴트 처리 생략
      if (!isTimeout && this.drums[drumIndex]) {
        this.drums[drumIndex].drum.setTint(0xff4444);
      }
      this.drums[question.correctAnswer].drum.setTint(0x00ff88);
    }
    this.resultText.setVisible(true);
    this.gameResult = isCorrect;
    this.time.delayedCall(2000, this.finishGame, [], this);
  }

  showQuestion() {
    var question = this.questions[this.currentQuestionIndex];
    this.questionText.setText(question.question);
    for (var i = 0; i < 5; i++) {
      this.optionTexts[i].setText(
        String.fromCharCode(65 + i) + ". " + question.options[i],
      );
    }
    this.resultText.setVisible(false);
    this.showResult = false;
    this.drumHitCount = 0;
    this.currentDrumForHits = null;
    this.robotPosition = 0;
    var robotStartX = this.drums[0].drum.x;
    this.robot.setPosition(robotStartX, this.robot.y);
    this.robot.setTexture("robotBase");
    for (var k = 0; k < this.drums.length; k++) this.drums[k].drum.clearTint();
  }

  finishGame() {
    this.stopBackgroundMusic();
    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      // MainGame1 흐름: 결과와 함께 어떤 문제였는지도 넘겨줌
      this.mainScene.handleMiniGameResult(this.gameResult, this.currentProblem);
    }
    this.scene.stop();
  }
}
