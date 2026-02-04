import Phaser from 'phaser';

export default class ShortAnswerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShortAnswerScene' });
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.inputText = '';
    this.width = 0;
    
    // 단답형 문제 데이터 - 영어 문법
    this.questions = [
      { question: "What is the past tense of 'go'?", answer: 'went' },
      { question: "What is the plural of 'child'?", answer: 'children' },
      { question: "What is the comparative form of 'good'?", answer: 'better' },
      { question: "What is the third person singular form of 'have'?", answer: 'has' },
      { question: "What is the past participle of 'write'?", answer: 'written' },
      { question: "What is the plural of 'tooth'?", answer: 'teeth' },
      { question: "What is the superlative form of 'bad'?", answer: 'worst' },
      { question: "What is the past tense of 'think'?", answer: 'thought' },
      { question: "What article do we use before a vowel sound: 'a' or 'an'?", answer: 'an' },
      { question: "What is the past tense of 'swim'?", answer: 'swam' },
    ];
  }

  create() {
    const { width, height } = this.cameras.main;
    this.width = width;
    this.height = height;

    // 배경색 설정
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // 제목
    this.add.text(width / 2, 60, '단답형 문제 게임', {
      fontSize: '40px',
      fill: '#4ade80',
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
    this.questionText = this.add.text(width / 2, height / 2 - 150, '', {
      fontSize: '56px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      wordWrap: { width: width - 100 }
    }).setOrigin(0.5);

    // 입력 필드 배경
    this.inputBackground = this.add.rectangle(width / 2, height / 2, 500, 80, 0x333333, 1);
    
    // 입력 텍스트
    this.inputDisplayText = this.add.text(width / 2, height / 2, '', {
      fontSize: '48px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 제출 버튼
    this.submitButton = this.add.rectangle(width / 2, height / 2 + 120, 200, 60, 0x4ade80, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.submitAnswer())
      .on('pointerover', () => {
        this.submitButton.setFillStyle(0x22c55e, 1);
      })
      .on('pointerout', () => {
        this.submitButton.setFillStyle(0x4ade80, 1);
      });

    this.submitText = this.add.text(width / 2, height / 2 + 120, '제출', {
      fontSize: '28px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 결과 메시지
    this.resultText = this.add.text(width / 2, height / 2 + 200, '', {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // 게임 종료 텍스트
    this.gameOverText = this.add.text(width / 2, height / 2, '', {
      fontSize: '48px',
      fill: '#4ade80',
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

    // 키보드 입력 처리
    this.input.keyboard.on('keydown', (event) => {
      if (this.gameOverText.visible) return;
      
      if (event.key === 'Backspace') {
        this.inputText = this.inputText.slice(0, -1);
        this.updateInputDisplay();
      } else if (event.key === 'Enter') {
        this.submitAnswer();
      } else if (event.key.match(/[0-9]/)) {
        this.inputText += event.key;
        this.updateInputDisplay();
      }
    });

    // 첫 문제 표시
    this.showQuestion();
  }

  updateInputDisplay() {
    this.inputDisplayText.setText(this.inputText || '');
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
    
    // 입력 초기화
    this.inputText = '';
    this.updateInputDisplay();
    this.resultText.setVisible(false);
    this.inputBackground.setFillStyle(0x333333, 1);
  }

  submitAnswer() {
    if (this.gameOverText.visible) return;
    if (!this.inputText.trim()) return;

    const question = this.questions[this.currentQuestionIndex];
    const isCorrect = this.inputText.trim() === question.answer;

    // 결과 표시
    if (isCorrect) {
      this.score++;
      this.resultText.setText('정답입니다! ✓');
      this.resultText.setFill('#4ade80');
      this.questionText.setFill('#4ade80');
      this.inputBackground.setFillStyle(0x4ade80, 0.3);
      
      // 정답 애니메이션
      this.tweens.add({
        targets: [this.inputBackground, this.inputDisplayText],
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      });
    } else {
      this.resultText.setText(`틀렸습니다! 정답: ${question.answer} ✗`);
      this.resultText.setFill('#f87171');
      this.questionText.setFill('#f87171');
      this.inputBackground.setFillStyle(0xf87171, 0.3);
      
      // 오답 애니메이션
      this.tweens.add({
        targets: [this.inputBackground, this.inputDisplayText],
        x: this.width / 2 - 10,
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
    this.inputBackground.setVisible(false);
    this.inputDisplayText.setVisible(false);
    this.submitButton.setVisible(false);
    this.submitText.setVisible(false);
    this.resultText.setVisible(false);
    this.questionNumberText.setVisible(false);

    this.gameOverText.setText(`게임 종료!\n최종 점수: ${this.score} / ${this.questions.length}`);
    this.gameOverText.setVisible(true);
    this.menuButton.setVisible(true);
    this.menuText.setVisible(true);
  }
}
