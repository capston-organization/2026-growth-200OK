/**
 * MultiChoiceGame.js (객관식 = 로봇 리듬 게임)
 * frontend MultipleChoiceScene와 동일한 에셋·UI·로직. MainGame3용 1라운드 후 결과 보고.
 * 에셋 경로: assets/images/, assets/sounds/
 */
class MultiChoiceGame extends Phaser.Scene {
  constructor() {
    super({ key: "MultiChoiceGame" });
  }

  init(data) {
    this.mainScene = data.parent;
    this.speedLevel = data.speedLevel || 1;
  }

  preload() {
    var base =
      typeof window.MAINGAME3_ASSETS_BASE !== "undefined"
        ? window.MAINGAME3_ASSETS_BASE
        : "assets/";
    this.load.image("robotBase", base + "images/로봇리듬기본로봇.png");
    this.load.image("robotLeft", base + "images/로봇리듬왼손로봇.png");
    this.load.image("robotRight", base + "images/로봇리듬오른손로봇.png");
    this.load.image("drumImg", base + "images/로봇리듬북.png");
    this.load.audio("drumHit", base + "sounds/드럼.mp3");
    this.load.audio("robotRhythmBg", base + "sounds/로봇리듬배경음악.mp3");
  }

  create() {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;

    this.cameras.main.setBackgroundColor("#1a1a2e");

    try {
      this.backgroundMusic = this.sound.add("robotRhythmBg", {
        loop: true,
        volume: 2.5,
      });
      var playBg = function () {
        if (!this.backgroundMusic || this.backgroundMusic.isPlaying) return;
        var ctx = this.sound.context;
        if (ctx.state === "suspended") {
          ctx
            .resume()
            .then(
              function () {
                this.backgroundMusic.play();
              }.bind(this),
            )
            .catch(function () {});
        } else {
          this.backgroundMusic.play();
        }
      }.bind(this);
      var unlockBg = function () {
        playBg();
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
          this.input.off("pointerdown", unlockBg);
          if (this.input.keyboard) this.input.keyboard.off("keydown", unlockBg);
        }
      };
      this.time.delayedCall(600, playBg);
      this.input.on("pointerdown", unlockBg);
      if (this.input.keyboard) this.input.keyboard.on("keydown", unlockBg);
    } catch (e) {
      console.warn("로봇 리듬 배경음악 로드 실패:", e);
    }

    this.heartsText = this.add
      .text(width - 50, 30, "❤️❤️❤️", {
        fontSize: "28px",
        fontFamily: "Arial",
      })
      .setOrigin(1, 0);

    this.scoreText = this.add
      .text(width - 50, 65, "맞힌 문제: 0", {
        fontSize: "24px",
        fill: "#00d4ff",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(1, 0);

    var questionBoxWidth = width - 400;
    var questionBoxHeight = 100;
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
        fontSize: "32px",
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
          fontSize: "20px",
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

    var robotY = height - 180;
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
    this.robot.setScale(robotScale);
    this.robot.setDepth(10);
    this.robot
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", this.hitRobot, this);
    this.robotPosition = 0;

    var drumY = height - 240;
    var drumWidth = (width - 20) / 5;
    var drumStartX = 10;
    var drumMaxW = drumWidth;
    var drumMaxH = 360;
    this.drums = [];
    for (var d = 0; d < 5; d++) {
      var drumX = drumStartX + d * drumWidth + drumWidth / 2;
      var drum = this.add.image(drumX, drumY, "drumImg").setOrigin(0.5, 0.5);
      var drumScale = Math.min(drumMaxW / drum.width, drumMaxH / drum.height);
      drum.setScale(drumScale);
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
          fontSize: "32px",
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

    var leftArrowX = robotStartX - 100;
    var arrowY = robotY + 80;
    this.leftArrow = this.add
      .polygon(leftArrowX, arrowY, [-30, 0, 10, -20, 10, 20], 0x00d4ff, 1)
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
      .polygon(rightArrowX, arrowY, [30, 0, -10, -20, -10, 20], 0x00d4ff, 1)
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
      .text(width / 2, height - 30, "", {
        fontSize: "32px",
        fill: "#00d4ff",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.timingGuideText = this.add
      .text(
        width / 2,
        height - 60,
        "화살표로 이동 후 로봇을 4번 클릭해서 북을 치세요!",
        {
          fontSize: "20px",
          fill: "#00d4ff",
          fontFamily: "Arial",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5);

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
    this.currentQuestionIndex = 0;
    this.showResult = false;
    this.drumHitCount = 0;
    this.currentDrumForHits = null;

    this.time.delayedCall(500, this.showQuestion, [], this);
  }

  moveRobot(direction) {
    if (this.showResult) return;
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
    if (this.showResult) return;
    try {
      this.sound.play("drumHit", { volume: 8 });
    } catch (e) {}
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

  checkAnswer(drumIndex) {
    if (this.showResult) return;
    this.drumHitCount = 0;
    this.currentDrumForHits = null;
    var question = this.questions[this.currentQuestionIndex];
    var isCorrect = drumIndex === question.correctAnswer;
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
      this.drums[drumIndex].drum.setTint(0xff4444);
      this.drums[question.correctAnswer].drum.setTint(0x00ff88);
    }
    this.resultText.setVisible(true);
    this.gameResult = isCorrect;
    if (this.backgroundMusic && this.backgroundMusic.isPlaying)
      this.backgroundMusic.stop();
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
    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      this.mainScene.handleMiniGameResult(this.gameResult);
    }
    this.scene.stop();
  }
}
