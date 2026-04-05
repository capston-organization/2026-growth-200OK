/* global Phaser */
/**
 * ShortAnswerGame.js (단답형 = 도넛게임)
 * MiniGame2 버전: MainGame1에서 재사용하기 위해 MiniGames 디렉터리로 이동.
 * 에셋 경로: ../../MiniGames/ShortAnswerGames/MiniGame2/assets/
 */
class ShortAnswerGame extends Phaser.Scene {
  constructor() {
    super({ key: "ShortAnswerGame" });
  }

  init(data) {
    this.mainScene = data.parent;
    this.speedLevel = data.speedLevel || 1;
    this.currentProblem = data.problem || null; // MainGame1에서 넘겨준 1개의 문제
    this.backgroundMusic = null;
    this.hiddenInputEl = null;
    this.handleHiddenInput = null;
    this.handleHiddenKeydown = null;
  }

  /**
   * 도넛 BGM 완전히 끄기
   */
  stopDonutBgm() {
    if (!this.backgroundMusic) return;
    try {
      this.backgroundMusic.stop();
    } catch {
      // ignore stop error
    }
    try {
      if (typeof this.backgroundMusic.destroy === "function") {
        this.backgroundMusic.destroy();
      }
    } catch {
      // ignore destroy error
    }
    this.backgroundMusic = null;
  }

  // 한글 IME 입력을 안정적으로 받기 위한 숨김 input
  setupHiddenInput(maxLength) {
    var self = this;
    this.destroyHiddenInput();
    var input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.spellcheck = false;
    input.maxLength = maxLength;
    input.value = this.inputText || "";
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "0";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    document.body.appendChild(input);

    this.handleHiddenInput = function () {
      self.inputText = input.value.slice(0, maxLength);
      self.inputDisplayText.setText(self.inputText);
    };
    this.handleHiddenKeydown = function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        self.submitAnswer();
      }
    };

    input.addEventListener("input", this.handleHiddenInput);
    input.addEventListener("keydown", this.handleHiddenKeydown);
    this.hiddenInputEl = input;
    setTimeout(function () {
      if (self.hiddenInputEl) self.hiddenInputEl.focus();
    }, 0);
    this.input.on("pointerdown", function () {
      if (self.hiddenInputEl) self.hiddenInputEl.focus();
    });
  }

  destroyHiddenInput() {
    if (!this.hiddenInputEl) return;
    try {
      if (this.handleHiddenInput)
        this.hiddenInputEl.removeEventListener("input", this.handleHiddenInput);
      if (this.handleHiddenKeydown)
        this.hiddenInputEl.removeEventListener(
          "keydown",
          this.handleHiddenKeydown,
        );
      if (this.hiddenInputEl.parentNode)
        this.hiddenInputEl.parentNode.removeChild(this.hiddenInputEl);
    } catch {
      // ignore DOM detach error
    }
    this.hiddenInputEl = null;
    this.handleHiddenInput = null;
    this.handleHiddenKeydown = null;
  }

  preload() {
    this.load.setPath("../../MiniGames/ShortAnswerGames/MiniGame2/assets/");
    this.load.image("alienWaiting", "images/도넛게임기다리는외계인.png");
    this.load.image("alienHappy", "images/도넛게임웃는외계인.png");
    this.load.image("alienAngry", "images/도넛게임화난외계인.png");
    this.load.image("donut", "images/도넛게임도넛.png");
    this.load.audio("donutBgMusic", "sounds/도넛게임배경음악.mp3");
  }

  create() {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    this.width = width;
    this.height = height;
    /** 도넛 등 기타 스프라이트 배율 */
    var spriteDisplayMul = 1.5;
    /** 기다리는/웃는 외계인 등 — 기존 0.5×spriteDisplayMul 대비 추가 배율 (≈120%) */
    var alienSpriteExtraMul = 1;

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

    // 씬 종료 시 정리
    this.events.once("shutdown", this.stopDonutBgm, this);
    this.events.once("shutdown", this.destroyHiddenInput, this);

    var questionBoxY = 100;
    var questionBoxWidth = width - 400;
    var questionBoxHeight = 120;

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
        fontSize: "36px",
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

    var alienY = timerY + 230;
    var alienSpacing = 240;
    var alienPositions = [timerX - alienSpacing, timerX, timerX + alienSpacing];
    var alienScale = 0.5 * spriteDisplayMul * alienSpriteExtraMul;

    this.aliens = [];
    for (var i = 0; i < 3; i++) {
      var alien = this.add.image(alienPositions[i], alienY, "alienWaiting");
      alien.setScale(alienScale);
      this.aliens.push(alien);
    }

    var inputBoxHalfH = 40;
    this.inputBoxHalfH = inputBoxHalfH;
    this.inputY = alienY + 260;
    this.inputBackground = this.add.graphics();
    this.inputBackground.fillStyle(0x1a1a2e, 1);
    this.inputBackground.fillRoundedRect(
      width / 2 - 250,
      this.inputY - inputBoxHalfH,
      500,
      inputBoxHalfH * 2,
      15,
    );
    this.inputBackground.lineStyle(4, 0x00ff88, 1);
    this.inputBackground.strokeRoundedRect(
      width / 2 - 250,
      this.inputY - inputBoxHalfH,
      500,
      inputBoxHalfH * 2,
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

    var submitGapBelowInput = 56;
    var submitY = this.inputY + inputBoxHalfH + submitGapBelowInput;
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
      .text(width / 2, submitY + 58, "", {
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
    var donutScale = 0.45 * spriteDisplayMul;
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

    // [설명] MiniMultiGame1과 동일한 아이디어로 speedLevel에 따라 제한시간을 조절
    // - speedLevel이 1에서 5로 높아질수록 durationSec(초)가 점점 짧아짐
    // - 최소 5초까지 줄어들도록 하여 난이도 상승 효과 부여

    // MainGame1에서 problem을 넘겨준 경우: 그 문제 1개만 사용
    if (this.currentProblem) {
      this.questions = [
        {
          question: (this.currentProblem && this.currentProblem.question) || "",
          answer:
            this.currentProblem && this.currentProblem.correctAnswer != null
              ? String(this.currentProblem.correctAnswer)
              : "",
        },
      ];
    } else {
      // 기존 MainGame3용 Mock 데이터 (문제 여러 개)
      this.questions = [
        {
          question: "What is the comparative form of 'good'?",
          answer: "better",
        },
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
    }
    this.currentQuestionIndex = 0;

    this.input.keyboard.on(
      "keydown",
      function (event) {
        if (!this.isTimerRunning) return;
        // 숨김 input이 포커스면 텍스트 입력은 input 이벤트가 처리
        if (
          this.hiddenInputEl &&
          document.activeElement === this.hiddenInputEl
        ) {
          if (event.key === "Enter") {
            this.submitAnswer();
          }
          return;
        }
        if (event.key === "Backspace") {
          this.inputText = this.inputText.slice(0, -1);
          this.inputDisplayText.setText(this.inputText);
        } else if (event.key === "Enter") {
          this.submitAnswer();
        } else {
          if (event.isComposing || event.key === "Process") return;
          if (event.ctrlKey || event.metaKey || event.altKey) return;
          if (event.key === "Dead" || event.key === "Unidentified") return;
          var k = event.key;
          if (k.length < 1 || k.length > 4) return;
          var code = k.charCodeAt(0);
          if (code <= 31 || code === 127) return;
          this.inputText += k;
          this.inputDisplayText.setText(this.inputText);
        }
      },
      this,
    );

    this.setupHiddenInput(40);
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
      this.inputY - this.inputBoxHalfH,
      500,
      this.inputBoxHalfH * 2,
      15,
    );
    this.inputBackground.lineStyle(4, 0x00ff88, 1);
    this.inputBackground.strokeRoundedRect(
      this.width / 2 - 250,
      this.inputY - this.inputBoxHalfH,
      500,
      this.inputBoxHalfH * 2,
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
        this.inputY - this.inputBoxHalfH,
        500,
        this.inputBoxHalfH * 2,
        15,
      );
      this.inputBackground.lineStyle(4, 0x39ff14, 1);
      this.inputBackground.strokeRoundedRect(
        this.width / 2 - 250,
        this.inputY - this.inputBoxHalfH,
        500,
        this.inputBoxHalfH * 2,
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
      this.resultText.setText("틀렸습니다! ✗");
      this.resultText.setFill("#FF6B00");
      this.inputBackground.clear();
      this.inputBackground.fillStyle(0xff4444, 0.3);
      this.inputBackground.fillRoundedRect(
        this.width / 2 - 250,
        this.inputY - this.inputBoxHalfH,
        500,
        this.inputBoxHalfH * 2,
        15,
      );
      this.inputBackground.lineStyle(4, 0xff6b00, 1);
      this.inputBackground.strokeRoundedRect(
        this.width / 2 - 250,
        this.inputY - this.inputBoxHalfH,
        500,
        this.inputBoxHalfH * 2,
        15,
      );
      for (var b = 0; b < this.aliens.length; b++)
        this.aliens[b].setTexture("alienAngry");
    }

    this.resultText.setVisible(true);
    this.gameResult = isCorrect;
    this.stopDonutBgm();
    this.time.delayedCall(2000, this.finishGame, [], this);
  }

  finishGame() {
    this.destroyHiddenInput();
    this.stopDonutBgm();
    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      // MainGame1 흐름: 결과와 함께 어떤 문제였는지도 넘겨줌
      this.mainScene.handleMiniGameResult(this.gameResult, this.currentProblem);
    }
    this.scene.stop();
  }
}
