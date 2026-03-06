/**
 * ShortAnswerGame.js (단답형 = 도넛게임)
 * frontend ShortAnswerScene와 동일한 에셋·UI·로직. MainGame3용 1라운드 후 결과 보고.
 * 에셋 경로: assets/images/, assets/sounds/
 */
class ShortAnswerGame extends Phaser.Scene {
  constructor() {
    super({ key: "ShortAnswerGame" });
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
    this.load.image("alienWaiting", base + "images/도넛게임기다리는외계인.png");
    this.load.image("alienHappy", base + "images/도넛게임웃는외계인.png");
    this.load.image("alienAngry", base + "images/도넛게임화난외계인.png");
    this.load.image("donut", base + "images/도넛게임도넛.png");
    this.load.audio("donutBgMusic", base + "sounds/도넛게임배경음악.mp3");
  }

  create() {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    this.width = width;
    this.height = height;

    this.cameras.main.setBackgroundColor("#1a0a2e");

    if (this.cache.audio.exists("donutBgMusic")) {
      this.backgroundMusic = this.sound.add("donutBgMusic", {
        loop: true,
        volume: 0.5,
      });
      var playBg = function () {
        if (!this.backgroundMusic) return;
        if (this.sound.context.state === "suspended") {
          this.sound.context.resume().then(
            function () {
              this.backgroundMusic.play();
            }.bind(this),
          );
        } else {
          this.backgroundMusic.play();
        }
      }.bind(this);
      this.time.delayedCall(300, playBg);
      this.input.once("pointerdown", playBg);
      this.input.keyboard.once("keydown", playBg);
    }

    this.scoreText = this.add
      .text(width - 30, 30, "맞힌 문제: 0", {
        fontSize: "24px",
        fill: "#FF6B9D",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(1, 0);

    this.heartsText = this.add
      .text(width - 30, 65, "❤️❤️❤️", {
        fontSize: "32px",
        fontFamily: "Arial",
      })
      .setOrigin(1, 0);

    var questionBoxY = 100;
    var questionBoxWidth = width - 400;
    var questionBoxHeight = 100;

    this.questionBoxBg = this.add.graphics();
    this.questionBoxBg.fillStyle(0x8b5cf6, 1);
    this.questionBoxBg.fillRoundedRect(
      width / 2 - questionBoxWidth / 2,
      questionBoxY - questionBoxHeight / 2,
      questionBoxWidth,
      questionBoxHeight,
      20,
    );
    this.questionBoxBg.lineStyle(4, 0xa855f7, 1);
    this.questionBoxBg.strokeRoundedRect(
      width / 2 - questionBoxWidth / 2,
      questionBoxY - questionBoxHeight / 2,
      questionBoxWidth,
      questionBoxHeight,
      20,
    );

    this.questionText = this.add
      .text(width / 2, questionBoxY, "", {
        fontSize: "28px",
        fill: "#FFFFFF",
        fontFamily: "Arial",
        fontStyle: "bold",
        wordWrap: { width: questionBoxWidth - 40 },
        align: "center",
      })
      .setOrigin(0.5);

    var timerX = width / 2;
    var timerY = questionBoxY + questionBoxHeight / 2 + 70;
    this.timerY = timerY;

    this.timerCircle = this.add.circle(timerX, timerY, 50, 0x00d9ff, 1);
    this.timerCircle.setStrokeStyle(4, 0x00ff88, 1);

    this.timerText = this.add
      .text(timerX, timerY, "10", {
        fontSize: "48px",
        fill: "#00FF88",
        fontFamily: "Arial",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    var alienY = timerY + 170;
    var alienSpacing = 180;
    var alienPositions = [timerX - alienSpacing, timerX, timerX + alienSpacing];

    this.aliens = [];
    for (var i = 0; i < 3; i++) {
      var alien = this.add.image(alienPositions[i], alienY, "alienWaiting");
      alien.setScale(0.5);
      this.aliens.push(alien);
    }

    this.inputY = alienY + 200;
    this.inputBackground = this.add.graphics();
    this.inputBackground.fillStyle(0x1a1a2e, 1);
    this.inputBackground.fillRoundedRect(
      width / 2 - 250,
      this.inputY - 40,
      500,
      80,
      15,
    );
    this.inputBackground.lineStyle(4, 0x00ff88, 1);
    this.inputBackground.strokeRoundedRect(
      width / 2 - 250,
      this.inputY - 40,
      500,
      80,
      15,
    );

    this.inputDisplayText = this.add
      .text(width / 2, this.inputY, "", {
        fontSize: "48px",
        fill: "#00FF88",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    var submitY = this.inputY + 80;
    this.submitButton = this.add.graphics();
    this.submitButton.fillStyle(0x00ff88, 1);
    this.submitButton.fillRoundedRect(
      width / 2 - 100,
      submitY - 30,
      200,
      60,
      15,
    );
    this.submitButton.lineStyle(3, 0x39ff14, 1);
    this.submitButton.strokeRoundedRect(
      width / 2 - 100,
      submitY - 30,
      200,
      60,
      15,
    );
    this.submitButton
      .setInteractive(
        new Phaser.Geom.Rectangle(width / 2 - 100, submitY - 30, 200, 60),
        Phaser.Geom.Rectangle.Contains,
      )
      .on("pointerdown", this.submitAnswer, this)
      .on(
        "pointerover",
        function () {
          if (!this.isTimerRunning) return;
          this.submitButton.clear();
          this.submitButton.fillStyle(0x39ff14, 1);
          this.submitButton.fillRoundedRect(
            width / 2 - 100,
            submitY - 30,
            200,
            60,
            15,
          );
          this.submitButton.lineStyle(3, 0x00ff88, 1);
          this.submitButton.strokeRoundedRect(
            width / 2 - 100,
            submitY - 30,
            200,
            60,
            15,
          );
        },
        this,
      )
      .on(
        "pointerout",
        function () {
          this.submitButton.clear();
          this.submitButton.fillStyle(0x00ff88, 1);
          this.submitButton.fillRoundedRect(
            width / 2 - 100,
            submitY - 30,
            200,
            60,
            15,
          );
          this.submitButton.lineStyle(3, 0x39ff14, 1);
          this.submitButton.strokeRoundedRect(
            width / 2 - 100,
            submitY - 30,
            200,
            60,
            15,
          );
        },
        this,
      );

    this.add
      .text(width / 2, submitY, "제출", {
        fontSize: "28px",
        fill: "#FFFFFF",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.resultText = this.add
      .text(width / 2, submitY + 50, "", {
        fontSize: "36px",
        fill: "#00FF88",
        fontFamily: "Arial",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setVisible(false);

    var donutY = height + 150;
    var donutScale = 0.45;
    var donutGap = 130;
    this.add
      .image(-60, donutY, "donut")
      .setOrigin(0.5, 1)
      .setScale(donutScale)
      .setDepth(0);
    this.add
      .image(-60, donutY - donutGap, "donut")
      .setOrigin(0.5, 1)
      .setScale(donutScale)
      .setFlipX(true)
      .setDepth(0);
    this.add
      .image(width + 60, donutY, "donut")
      .setOrigin(0.5, 1)
      .setScale(donutScale)
      .setDepth(0);
    this.add
      .image(width + 60, donutY - donutGap, "donut")
      .setOrigin(0.5, 1)
      .setScale(donutScale)
      .setFlipX(true)
      .setDepth(0);

    this.inputText = "";
    this.timerEvent = null;
    this.isTimerRunning = false;
    this.questions = [
      { question: "What is the comparative form of 'good'?", answer: "better" },
      {
        question: "What is the third person singular form of 'have'?",
        answer: "has",
      },
      {
        question: "What is the past participle of 'write'?",
        answer: "written",
      },
      { question: "What is the plural of 'tooth'?", answer: "teeth" },
      { question: "What is the past tense of 'swim'?", answer: "swam" },
    ];
    this.currentQuestionIndex = 0;

    this.input.keyboard.on(
      "keydown",
      function (event) {
        if (!this.isTimerRunning) return;
        if (event.key === "Backspace") {
          this.inputText = this.inputText.slice(0, -1);
          this.inputDisplayText.setText(this.inputText);
        } else if (event.key === "Enter") {
          this.submitAnswer();
        } else if (event.key.length === 1 && event.key.match(/[a-zA-Z0-9\s]/)) {
          this.inputText += event.key;
          this.inputDisplayText.setText(this.inputText);
        }
      },
      this,
    );

    this.showQuestion();
  }

  updateInputDisplay() {
    this.inputDisplayText.setText(this.inputText || "");
  }

  showQuestion() {
    var question = this.questions[this.currentQuestionIndex];
    this.questionText.setText(question.question);
    this.questionText.setFill("#FFFFFF");
    this.inputText = "";
    this.inputDisplayText.setText("");
    this.resultText.setVisible(false);

    this.inputBackground.clear();
    this.inputBackground.fillStyle(0x1a1a2e, 1);
    this.inputBackground.fillRoundedRect(
      this.width / 2 - 250,
      this.inputY - 40,
      500,
      80,
      15,
    );
    this.inputBackground.lineStyle(4, 0x00ff88, 1);
    this.inputBackground.strokeRoundedRect(
      this.width / 2 - 250,
      this.inputY - 40,
      500,
      80,
      15,
    );

    for (var i = 0; i < this.aliens.length; i++) {
      this.aliens[i].setTexture("alienWaiting");
    }

    var durationSec = 10 - (this.speedLevel - 1);
    if (durationSec < 5) durationSec = 5;
    this.timer = durationSec;
    this.timerText.setText(String(this.timer));
    this.isTimerRunning = true;

    if (this.timerEvent) this.timerEvent.remove();
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: function () {
        this.timer--;
        this.timerText.setText(this.timer.toString());
        if (this.timer <= 0) {
          this.isTimerRunning = false;
          this.timerText.setText("0");
          this.submitAnswer();
        }
      },
      repeat: durationSec - 1,
      callbackScope: this,
    });
  }

  submitAnswer() {
    if (this.resultText.visible) return;
    if (!this.isTimerRunning && this.timer === 10) return;

    this.isTimerRunning = false;
    if (this.timerEvent) this.timerEvent.remove();

    var question = this.questions[this.currentQuestionIndex];
    var userAnswer = this.inputText.trim().toLowerCase();
    var correctAnswer = question.answer.toLowerCase();
    var isCorrect = userAnswer === correctAnswer;

    if (isCorrect) {
      this.resultText.setText("정답입니다! ✓");
      this.resultText.setFill("#4ADE80");
      this.inputBackground.clear();
      this.inputBackground.fillStyle(0x00ff88, 0.3);
      this.inputBackground.fillRoundedRect(
        this.width / 2 - 250,
        this.inputY - 40,
        500,
        80,
        15,
      );
      this.inputBackground.lineStyle(4, 0x39ff14, 1);
      this.inputBackground.strokeRoundedRect(
        this.width / 2 - 250,
        this.inputY - 40,
        500,
        80,
        15,
      );
      for (var a = 0; a < this.aliens.length; a++)
        this.aliens[a].setTexture("alienHappy");
      this.tweens.add({
        targets: [this.inputDisplayText],
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        ease: "Power2",
      });
    } else {
      this.resultText.setText("틀렸습니다! 정답: " + question.answer + " ✗");
      this.resultText.setFill("#FF6B00");
      this.inputBackground.clear();
      this.inputBackground.fillStyle(0xff4444, 0.3);
      this.inputBackground.fillRoundedRect(
        this.width / 2 - 250,
        this.inputY - 40,
        500,
        80,
        15,
      );
      this.inputBackground.lineStyle(4, 0xff6b00, 1);
      this.inputBackground.strokeRoundedRect(
        this.width / 2 - 250,
        this.inputY - 40,
        500,
        80,
        15,
      );
      for (var b = 0; b < this.aliens.length; b++)
        this.aliens[b].setTexture("alienAngry");
    }

    this.resultText.setVisible(true);
    this.gameResult = isCorrect;
    if (this.backgroundMusic && this.backgroundMusic.isPlaying)
      this.backgroundMusic.stop();
    this.time.delayedCall(2000, this.finishGame, [], this);
  }

  finishGame() {
    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      this.mainScene.handleMiniGameResult(this.gameResult);
    }
    this.scene.stop();
  }
}
