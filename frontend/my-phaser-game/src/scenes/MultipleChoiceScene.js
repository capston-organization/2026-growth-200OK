import Phaser from 'phaser';

export default class MultipleChoiceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MultipleChoiceScene' });
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.showResult = false;
    
    // 객관식 문제 데이터 - 영어 문법
    this.questions = [
      {
        question: "Which is correct? (3rd person singular)",
        options: ['He go', 'He goes', 'He going', 'He gone'],
        correctAnswer: 1
      },
      {
        question: "What is the correct past tense of 'run'?",
        options: ['runned', 'ran', 'run', 'running'],
        correctAnswer: 1
      },
      {
        question: "Which sentence is grammatically correct?",
        options: ["She don't like it", "She doesn't like it", "She not like it", "She doesn't likes it"],
        correctAnswer: 1
      },
      {
        question: "What is the plural of 'mouse'?",
        options: ['mouses', 'mice', 'mouse', 'mices'],
        correctAnswer: 1
      },
      {
        question: "Which article fits: ___ apple?",
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 1
      },
      {
        question: "The past participle of 'eat' is ___.",
        options: ['eated', 'ate', 'eaten', 'eating'],
        correctAnswer: 2
      },
      {
        question: "Which is the correct comparative form?",
        options: ['gooder', 'more good', 'better', 'best'],
        correctAnswer: 2
      },
      {
        question: "She ___ to school every day. (correct form)",
        options: ['walk', 'walks', 'walking', 'walked'],
        correctAnswer: 1
      },
      {
        question: "What is the past tense of 'swim'?",
        options: ['swimmed', 'swam', 'swum', 'swims'],
        correctAnswer: 1
      },
      {
        question: "The plural of 'foot' is ___.",
        options: ['foots', 'feet', 'foot', 'feets'],
        correctAnswer: 1
      },
    ];
    
    this.optionButtons = [];
    this.optionTexts = [];
  }

  create() {
    const { width, height } = this.cameras.main;

    // 배경색 설정
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // 제목
    this.add.text(width / 2, 60, '객관식 문제 게임', {
      fontSize: '40px',
      fill: '#f87171',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 점수 표시
    this.scoreText = this.add.text(width / 2, 110, `점수: ${this.score} / ${this.questions.length}`, {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 문제 번호
    this.questionNumberText = this.add.text(width / 2, 150, `문제 ${this.currentQuestionIndex + 1} / ${this.questions.length}`, {
      fontSize: '20px',
      fill: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 문제 텍스트
    this.questionText = this.add.text(width / 2, height / 2 - 200, '', {
      fontSize: '56px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      wordWrap: { width: width - 100 }
    }).setOrigin(0.5);

    // 결과 메시지
    this.resultText = this.add.text(width / 2, height / 2 + 250, '', {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // 게임 종료 텍스트
    this.gameOverText = this.add.text(width / 2, height / 2, '', {
      fontSize: '48px',
      fill: '#f87171',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // 메뉴로 돌아가기 버튼
    this.menuButton = this.add.rectangle(width / 2, height / 2 + 100, 200, 60, 0x646cff, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'))
      .setVisible(false);

    this.menuText = this.add.text(width / 2, height / 2 + 100, '메뉴로', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // 첫 문제 표시
    this.showQuestion();
  }

  createOptionButtons(question) {
    // 기존 버튼 제거
    this.optionButtons.forEach(btn => btn.destroy());
    this.optionTexts.forEach(txt => txt.destroy());
    this.optionButtons = [];
    this.optionTexts = [];

    const { width, height } = this.cameras.main;
    const startY = height / 2 - 50;
    const buttonWidth = 300;
    const buttonHeight = 70;
    const spacing = 90;

    question.options.forEach((option, index) => {
      const y = startY + (index * spacing);
      const x = width / 2;

      // 버튼 생성
      const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x333333, 1)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectAnswer(index))
        .on('pointerover', () => {
          if (!this.showResult) {
            button.setFillStyle(0x444444, 1);
          }
        })
        .on('pointerout', () => {
          if (!this.showResult) {
            button.setFillStyle(0x333333, 1);
          }
        });

      // 텍스트 생성
      const text = this.add.text(x, y, `${String.fromCharCode(65 + index)}. ${option}`, {
        fontSize: '32px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.optionButtons.push(button);
      this.optionTexts.push(text);
    });
  }

  showQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    this.questionText.setText(question.question);
    this.questionText.setFill('#ffffff');
    this.questionNumberText.setText(`문제 ${this.currentQuestionIndex + 1} / ${this.questions.length}`);
    
    // 선택지 버튼 생성
    this.createOptionButtons(question);
    
    // 상태 초기화
    this.showResult = false;
    this.selectedAnswer = null;
    this.resultText.setVisible(false);
  }

  selectAnswer(answerIndex) {
    if (this.showResult) return;

    this.selectedAnswer = answerIndex;
    this.showResult = true;
    const question = this.questions[this.currentQuestionIndex];
    const isCorrect = answerIndex === question.correctAnswer;

    // 결과 표시
    if (isCorrect) {
      this.score++;
      this.resultText.setText('정답입니다! ✓');
      this.resultText.setFill('#4ade80');
      this.questionText.setFill('#4ade80');
      
      // 정답 버튼 강조
      this.optionButtons[answerIndex].setFillStyle(0x4ade80, 0.8);
      this.tweens.add({
        targets: [this.optionButtons[answerIndex], this.optionTexts[answerIndex]],
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      });
    } else {
      this.resultText.setText(`틀렸습니다! 정답: ${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]} ✗`);
      this.resultText.setFill('#f87171');
      this.questionText.setFill('#f87171');
      
      // 오답 버튼 강조
      this.optionButtons[answerIndex].setFillStyle(0xf87171, 0.8);
      // 정답 버튼 강조
      this.optionButtons[question.correctAnswer].setFillStyle(0x4ade80, 0.8);
      
      // 오답 애니메이션
      this.tweens.add({
        targets: [this.optionButtons[answerIndex], this.optionTexts[answerIndex]],
        x: this.optionButtons[answerIndex].x - 10,
        duration: 50,
        yoyo: true,
        repeat: 3,
        ease: 'Power2'
      });
    }

    this.resultText.setVisible(true);
    this.scoreText.setText(`점수: ${this.score} / ${this.questions.length}`);

    // 2초 후 다음 문제로
    this.time.delayedCall(2000, () => {
      this.currentQuestionIndex++;
      this.showQuestion();
    });
  }

  endGame() {
    this.questionText.setVisible(false);
    this.optionButtons.forEach(btn => btn.destroy());
    this.optionTexts.forEach(txt => txt.destroy());
    this.resultText.setVisible(false);
    this.questionNumberText.setVisible(false);

    this.gameOverText.setText(`게임 종료!\n최종 점수: ${this.score} / ${this.questions.length}`);
    this.gameOverText.setVisible(true);
    this.menuButton.setVisible(true);
    this.menuText.setVisible(true);
  }
}
