/* global Phaser */
/**
 * TteokOXGame.js (떡게임 = OX 게임)
 * MiniGame2 버전: MainGame1에서 재사용하기 위해 MiniGames 디렉터리로 이동.
 * 에셋 경로: ../../MiniGames/OXGames/MiniGame2/assets/
 */
class TteokOXGame extends Phaser.Scene {
  constructor() {
    super({ key: "TteokOXGame" });
  }

  init(data) {
    this.mainScene = data.parent;
    this.speedLevel = data.speedLevel || 1;
    this.currentProblem = data.problem || null; // MainGame1에서 넘겨준 1개의 문제
  }

  preload() {
    this.load.setPath("../../MiniGames/OXGames/MiniGame2/assets/");
    this.load.image("그냥떡", "images/그냥떡.png");
    this.load.image("망치떡", "images/망치떡.png");
    this.load.image("물떡", "images/물떡.png");
    this.load.image("망치기본토끼", "images/망치기본토끼.png");
    this.load.image("망치망치토끼", "images/망치망치토끼.png");
    this.load.image("물기본토끼", "images/물기본토끼.png");
    this.load.image("물물토끼", "images/물물토끼.png");
    this.load.audio("backgroundMusic", "sounds/떡게임배경소리.mp3");
    this.load.audio("hey", "sounds/hey.mp3");
    this.load.audio("one", "sounds/one.mp3");
    this.load.audio("two", "sounds/two.mp3");
    this.load.audio("three", "sounds/three.mp3");
    this.load.audio("four", "sounds/four.mp3");
  }

  create() {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;

    this.cameras.main.setBackgroundColor("#FFF8E7");
    this.hearts = 3;
    this.questionStartTime = 0;

    // [변경] MiniMultiGame1과 비슷하게, "문제 제시 후 첫 리듬이 나오기 전까지의 대기 시간"만 speedLevel에 따라 조절
    // - 원본(MainGame3) 기준 값: countStartTime=6000, rhythmStartTime=8000, rhythmEndTime=10000
    // - speedLevel이 높을수록 '처음 비트가 시작될 때까지의 딜레이'가 짧아지지만,
    //   실제 리듬 구간(4번의 박자) 길이와 박자 간 간격(beatInterval=500ms)은 그대로 유지
    var level = this.speedLevel || 1;
    var scaleFactor = 1 - (level - 1) * 0.15; // 1, 0.85, 0.7, 0.55, 0.4 ...
    if (scaleFactor < 0.4) scaleFactor = 0.4;

    // 원본 타이밍 상수
    var baseCountStart = 6000;
    var baseRhythmStart = 8000;
    var baseRhythmEnd = 10000;

    // [핵심] "처음 카운트가 시작되기까지의 대기 시간"만 scaleFactor로 줄임
    this.countStartTime = baseCountStart * scaleFactor;

    // 카운트 시작 후 첫 리듬 시작까지의 간격(원본: 2000ms)과,
    // 리듬 구간 자체의 길이(원본: 2000ms)는 그대로 유지
    var gapBeforeRhythm = baseRhythmStart - baseCountStart; // 2000
    var rhythmDuration = baseRhythmEnd - baseRhythmStart; // 2000

    this.rhythmStartTime = this.countStartTime + gapBeforeRhythm;
    this.rhythmEndTime = this.rhythmStartTime + rhythmDuration;

    this.beatInterval = 500; // 리듬 안의 4번 박자 간격은 항상 동일(500ms)

    this.isQuestionActive = false;
    this.questionChoice = null;
    this.showResult = false;
    this.beatInputs = { 1: null, 2: null, 3: null, 4: null };

    // MainGame1에서 problem을 넘겨준 경우: 그 문제 1개만 사용
    if (this.currentProblem) {
      var answerStr =
        this.currentProblem && this.currentProblem.correctAnswer != null
          ? String(this.currentProblem.correctAnswer)
          : "";
      var answerBool = answerStr.toUpperCase() === "O";

      this.questions = [
        {
          question: (this.currentProblem && this.currentProblem.question) || "",
          answer: answerBool,
        },
      ];
    } else {
      // 기존 MainGame3용 Mock 데이터 (문제 여러 개)
      this.questions = [
        { question: "'go'의 과거형은 'went'이다.", answer: true },
        {
          question: "영어 동사는 모두 -ed를 붙여 과거형을 만든다.",
          answer: false,
        },
        { question: "'child'의 복수형은 'children'이다.", answer: true },
        {
          question: "'She don't like it'은 문법적으로 맞는 문장이다.",
          answer: false,
        },
      ];
    }
    this.currentQuestionIndex = 0;

    var questionBoxWidth = width - 400;
    var questionBoxHeight = 100;
    var questionBoxY = 140;

    this.questionBoxBg = this.add.graphics();
    this.questionBoxBg.fillStyle(0xffb6c1, 1);
    this.questionBoxBg.fillRoundedRect(
      width / 2 - questionBoxWidth / 2,
      questionBoxY - questionBoxHeight / 2,
      questionBoxWidth,
      questionBoxHeight,
      20,
    );
    this.questionBoxBg.lineStyle(3, 0xffc0cb, 1);
    this.questionBoxBg.strokeRoundedRect(
      width / 2 - questionBoxWidth / 2,
      questionBoxY - questionBoxHeight / 2,
      questionBoxWidth,
      questionBoxHeight,
      20,
    );

    this.questionLabelText = this.add
      .text(width / 2, questionBoxY, "", {
        fontSize: "32px",
        fill: "#FFFFFF",
        fontFamily: "Arial",
        fontStyle: "bold",
        stroke: "#8B4A6B",
        strokeThickness: 2,
        wordWrap: { width: questionBoxWidth - 40 },
      })
      .setOrigin(0.5);

    var tteokY = height / 2 + 80;
    this.tteok = this.add.image(width / 2, tteokY, "그냥떡");
    this.tteok.setDisplaySize(300, 200);

    var hammerRabbitX = width / 2 - 250;
    var hammerRabbitY = height / 2 + 30;
    this.add
      .circle(hammerRabbitX, hammerRabbitY, 120, 0xffb6c1, 0.8)
      .setDepth(0);
    this.hammerRabbit = this.add.image(
      hammerRabbitX,
      hammerRabbitY,
      "망치기본토끼",
    );
    this.hammerRabbit.setDisplaySize(200, 250);
    this.hammerRabbit.setDepth(1);
    this.hammerRabbit
      .setInteractive({ useHandCursor: true })
      .on(
        "pointerdown",
        function (ptr) {
          ptr.event.stopPropagation();
          this.selectAnswerWithPointer(ptr);
        },
        this,
      )
      .on(
        "pointerover",
        function () {
          if (this.isQuestionActive && !this.showResult) {
            this.tweens.add({
              targets: this.hammerRabbit,
              scaleX: 1.1,
              scaleY: 1.1,
              duration: 150,
              ease: "Back.easeOut",
            });
          }
        },
        this,
      )
      .on(
        "pointerout",
        function () {
          if (!this.showResult) {
            this.tweens.add({
              targets: this.hammerRabbit,
              scaleX: 1,
              scaleY: 1,
              duration: 150,
              ease: "Back.easeIn",
            });
          }
        },
        this,
      );

    var waterRabbitX = width / 2 + 250;
    var waterRabbitY = height / 2 + 30;
    this.blueXLayer = this.add.graphics();
    this.blueXLayer.lineStyle(20, 0x87ceeb, 0.9);
    this.blueXLayer.setDepth(0);
    var xSize = 120;
    this.blueXLayer.lineBetween(
      waterRabbitX - xSize / 2,
      waterRabbitY - xSize / 2,
      waterRabbitX + xSize / 2,
      waterRabbitY + xSize / 2,
    );
    this.blueXLayer.lineBetween(
      waterRabbitX + xSize / 2,
      waterRabbitY - xSize / 2,
      waterRabbitX - xSize / 2,
      waterRabbitY + xSize / 2,
    );

    this.waterRabbit = this.add.image(waterRabbitX, waterRabbitY, "물기본토끼");
    this.waterRabbit.setDisplaySize(200, 250);
    this.waterRabbit.setDepth(1);
    this.waterRabbit
      .setInteractive({ useHandCursor: true })
      .on(
        "pointerdown",
        function (ptr) {
          ptr.event.stopPropagation();
          this.selectAnswerWithPointer(ptr);
        },
        this,
      )
      .on(
        "pointerover",
        function () {
          if (this.isQuestionActive && !this.showResult) {
            this.tweens.add({
              targets: this.waterRabbit,
              scaleX: 1.1,
              scaleY: 1.1,
              duration: 150,
              ease: "Back.easeOut",
            });
          }
        },
        this,
      )
      .on(
        "pointerout",
        function () {
          if (!this.showResult) {
            this.tweens.add({
              targets: this.waterRabbit,
              scaleX: 1,
              scaleY: 1,
              duration: 150,
              ease: "Back.easeIn",
            });
          }
        },
        this,
      );

    this.resultText = this.add
      .text(width / 2, height / 2 + 250, "", {
        fontSize: "36px",
        fill: "#6B8B9B",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.timingGuideText = this.add
      .text(
        width / 2,
        height - 30,
        "원투쓰리포 후 헤이 4번에 맞춰 모두 눌러주세요!",
        {
          fontSize: "20px",
          fill: "#D2B48C",
          fontFamily: "Arial",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5);

    this.createSounds();
    var self = this;
    var enableAudio = function () {
      if (self.sound.context.state === "suspended") self.sound.context.resume();
    };
    this.input.once("pointerdown", enableAudio);
    this.input.keyboard.once("keydown", enableAudio);

    this.time.delayedCall(500, this.showQuestion, [], this);
  }

  createSounds() {
    if (this.cache.audio.exists("backgroundMusic")) {
      this.backgroundMusic = this.sound.add("backgroundMusic", {
        loop: false,
        volume: 0.4,
      });
    }
    if (this.cache.audio.exists("one")) this.oneSound = this.sound.add("one");
    if (this.cache.audio.exists("two")) this.twoSound = this.sound.add("two");
    if (this.cache.audio.exists("three"))
      this.threeSound = this.sound.add("three");
    if (this.cache.audio.exists("four"))
      this.fourSound = this.sound.add("four");
  }

  playHeySound() {
    if (this.cache.audio.exists("hey")) this.sound.play("hey", { volume: 1 });
  }

  playCountSound(count) {
    if (count === 1 && this.oneSound) this.oneSound.play();
    else if (count === 2 && this.twoSound) this.twoSound.play();
    else if (count === 3 && this.threeSound) this.threeSound.play();
    else if (count === 4 && this.fourSound) this.fourSound.play();
  }

  showQuestion() {
    var question = this.questions[this.currentQuestionIndex];
    this.questionLabelText.setText(question.question);
    this.tteok.setTexture("그냥떡");
    this.tteok.setDisplaySize(300, 200);
    this.hammerRabbit.setTexture("망치기본토끼");
    this.waterRabbit.setTexture("물기본토끼");
    this.beatInputs = { 1: null, 2: null, 3: null, 4: null };
    this.resultText.setVisible(false);
    this.showResult = false;
    this.questionChoice = null;
    this.isQuestionActive = true;
    this.questionStartTime = this.time.now;

    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic.play();
    }
    this.time.delayedCall(this.countStartTime, this.startCountBeats, [], this);
    this.time.delayedCall(
      this.rhythmStartTime,
      this.startRhythmBeats,
      [],
      this,
    );
    this.time.delayedCall(
      this.rhythmEndTime + 200,
      this.checkQuestionResult,
      [],
      this,
    );
  }

  startCountBeats() {
    this.playCountSound(1);
    this.time.delayedCall(
      this.beatInterval,
      function () {
        this.playCountSound(2);
      },
      [],
      this,
    );
    this.time.delayedCall(
      this.beatInterval * 2,
      function () {
        this.playCountSound(3);
      },
      [],
      this,
    );
    this.time.delayedCall(
      this.beatInterval * 3,
      function () {
        this.playCountSound(4);
      },
      [],
      this,
    );
  }

  startRhythmBeats() {
    var baseTime = this.time.now;
    this.beatInputs[1] = { time: baseTime, answered: false, answer: null };
    this.beatInputs[2] = {
      time: baseTime + this.beatInterval,
      answered: false,
      answer: null,
    };
    this.beatInputs[3] = {
      time: baseTime + this.beatInterval * 2,
      answered: false,
      answer: null,
    };
    this.beatInputs[4] = {
      time: baseTime + this.beatInterval * 3,
      answered: false,
      answer: null,
    };
    this.playHeySound();
    this.time.delayedCall(
      this.beatInterval,
      function () {
        this.playHeySound();
        if (this.beatInputs[2]) this.beatInputs[2].time = this.time.now;
      },
      [],
      this,
    );
    this.time.delayedCall(
      this.beatInterval * 2,
      function () {
        this.playHeySound();
        if (this.beatInputs[3]) this.beatInputs[3].time = this.time.now;
      },
      [],
      this,
    );
    this.time.delayedCall(
      this.beatInterval * 3,
      function () {
        this.playHeySound();
        if (this.beatInputs[4]) this.beatInputs[4].time = this.time.now;
      },
      [],
      this,
    );
  }

  selectAnswerWithPointer(pointer) {
    var centerX = this.cameras.main.width / 2;
    this.selectAnswer(pointer.x < centerX);
  }

  selectAnswer(answer) {
    if (this.showResult || !this.isQuestionActive) return;
    var timeSinceStart = this.time.now - this.questionStartTime;
    if (
      timeSinceStart < this.rhythmStartTime ||
      timeSinceStart > this.rhythmEndTime
    )
      return;

    var assignedBeat = null;
    for (var beat = 1; beat <= 4; beat++) {
      if (!this.beatInputs[beat] || !this.beatInputs[beat].answered) {
        assignedBeat = beat;
        break;
      }
    }
    if (assignedBeat === null) return;

    if (this.questionChoice === null) this.questionChoice = answer;
    var lockedAnswer = this.questionChoice;
    if (!this.beatInputs[assignedBeat])
      this.beatInputs[assignedBeat] = {
        time: this.time.now,
        answered: false,
        answer: null,
      };
    this.beatInputs[assignedBeat].answered = true;
    this.beatInputs[assignedBeat].answer = lockedAnswer;

    if (lockedAnswer) {
      this.hammerRabbit.setTexture("망치망치토끼");
      this.tteok.setTexture("망치떡");
      this.tteok.setDisplaySize(300, 200);
      this.time.delayedCall(
        300,
        function () {
          if (!this.showResult) {
            this.hammerRabbit.setTexture("망치기본토끼");
            this.tteok.setTexture("그냥떡");
            this.tteok.setDisplaySize(300, 200);
          }
        },
        [],
        this,
      );
    } else {
      this.waterRabbit.setTexture("물물토끼");
      this.tteok.setTexture("물떡");
      this.tteok.setDisplaySize(300, 200);
      this.time.delayedCall(
        300,
        function () {
          if (!this.showResult) {
            this.waterRabbit.setTexture("물기본토끼");
            this.tteok.setTexture("그냥떡");
            this.tteok.setDisplaySize(300, 200);
          }
        },
        [],
        this,
      );
    }
  }

  checkQuestionResult() {
    if (this.showResult) return;
    this.isQuestionActive = false;
    this.showResult = true;
    var question = this.questions[this.currentQuestionIndex];
    var correctAnswer = question.answer;
    var allAnswered = true;
    var allCorrect = true;
    for (var beat = 1; beat <= 4; beat++) {
      if (!this.beatInputs[beat] || !this.beatInputs[beat].answered) {
        allAnswered = false;
        break;
      }
      if (this.beatInputs[beat].answer !== correctAnswer) allCorrect = false;
    }

    if (!allAnswered) {
      this.resultText.setText("모든 비트에 답해주세요! ✗");
      this.resultText.setFill("#FFDAB9");
    } else if (allCorrect) {
      this.resultText.setText("Perfect! 정답입니다! ✓");
      this.resultText.setFill("#90EE90");
      if (correctAnswer) {
        this.hammerRabbit.setTexture("망치망치토끼");
        this.tteok.setTexture("망치떡");
        this.tteok.setDisplaySize(300, 200);
      } else {
        this.waterRabbit.setTexture("물물토끼");
        this.tteok.setTexture("물떡");
        this.tteok.setDisplaySize(300, 200);
      }
    } else {
      this.resultText.setText("틀렸습니다! ✗");
      this.resultText.setFill("#FFB6C1");
    }
    this.resultText.setVisible(true);
    this.timingGuideText.setText(
      "원투쓰리포 후 헤이 4번에 맞춰 모두 눌러주세요!",
    );
    this.timingGuideText.setFill("#D2B48C");

    this.gameResult = allAnswered && allCorrect;
    if (this.backgroundMusic && this.backgroundMusic.isPlaying)
      this.backgroundMusic.stop();
    this.time.delayedCall(2000, this.finishGame, [], this);
  }

  finishGame() {
    if (this.mainScene && this.mainScene.handleMiniGameResult) {
      // MainGame1 흐름: 결과와 함께 어떤 문제였는지도 넘겨줌
      this.mainScene.handleMiniGameResult(this.gameResult, this.currentProblem);
    }
    this.scene.stop();
  }
}
