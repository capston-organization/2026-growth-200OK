import Phaser from 'phaser';

export default class ShortAnswerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShortAnswerScene' });
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.inputText = '';
    this.width = 0;
    this.timer = 10; // 10초 타이머
    this.timerEvent = null;
    this.isTimerRunning = false;
    this.aliens = []; // 외계인 배열 (3명)
    this.hearts = 3; // 하트 개수
    this.backgroundMusic = null; // 배경 음악
    
    // 단답형 문제 데이터 - 영어 문법
    this.questions = [
      { question: "Some art is useful in a practical sense, such as a sculptured clay bowl that can be used. That kind of art is sometimes called a craft.", answer: 'went' },
      { question: "August doesn't begin on the same day of the week as any other month in common years, but begins on the same day of the week as February in leap years. August always ends on the same day of the week as November.", answer: 'children' },
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

  preload() {
    // 도넛게임 외계인 이미지 로드
    this.load.image('alienWaiting', '/assets/images/도넛게임기다리는외계인.png');
    this.load.image('alienHappy', '/assets/images/도넛게임웃는외계인.png');
    this.load.image('alienAngry', '/assets/images/도넛게임화난외계인.png');
    this.load.image('donut', '/assets/images/도넛게임도넛.png');
    // 도넛게임 배경음악
    this.load.audio('donutBgMusic', '/assets/sounds/도넛게임배경음악.mp3');
  }

  create() {
    const { width, height } = this.cameras.main;
    this.width = width;
    this.height = height;

    // 배경색 설정 (외계인 컨셉 - 어두운 우주/보라 톤)
    this.cameras.main.setBackgroundColor('#1a0a2e');

    // 도넛게임 배경음악 (무한 반복)
    if (this.cache.audio.exists('donutBgMusic')) {
      this.backgroundMusic = this.sound.add('donutBgMusic', { loop: true, volume: 0.5 });
      const playBg = () => {
        if (!this.backgroundMusic) return;
        if (this.sound.context.state === 'suspended') {
          this.sound.context.resume().then(() => { this.backgroundMusic.play(); });
        } else {
          this.backgroundMusic.play();
        }
      };
      this.time.delayedCall(300, playBg); // 씬 준비 후 재생 시도
      this.input.once('pointerdown', playBg); // 첫 클릭 시 재생 (자동재생 차단 대응)
      this.input.keyboard.once('keydown', playBg); // 첫 키입력 시 재생
    }

    // 오른쪽 상단에 맞힌 문제 표시
    this.scoreText = this.add.text(width - 30, 30, `맞힌 문제: ${this.score}`, {
      fontSize: '24px',
      fill: '#FF6B9D',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    // 오른쪽 상단에 하트 3개 표시
    this.heartsText = this.add.text(width - 30, 65, '❤️❤️❤️', {
      fontSize: '32px',
      fontFamily: 'Arial'
    }).setOrigin(1, 0);

    // 문제 박스 (떡만들기리듬게임과 동일한 크기)
    const questionBoxY = 100; // 더 위로 올림 (120 -> 100)
    const questionBoxWidth = width - 400; // 떡게임과 동일한 크기
    const questionBoxHeight = 100; // 떡게임과 동일한 높이
    
    // 문제 박스 배경 (외계인 컨셉 - 보라색 계열)
    this.questionBoxBg = this.add.graphics();
    this.questionBoxBg.fillStyle(0x8B5CF6, 1); // 보라색
    this.questionBoxBg.fillRoundedRect(
      width / 2 - questionBoxWidth / 2,
      questionBoxY - questionBoxHeight / 2,
      questionBoxWidth,
      questionBoxHeight,
      20
    );
    this.questionBoxBg.lineStyle(4, 0xA855F7, 1); // 네온 보라색 테두리
    this.questionBoxBg.strokeRoundedRect(
      width / 2 - questionBoxWidth / 2,
      questionBoxY - questionBoxHeight / 2,
      questionBoxWidth,
      questionBoxHeight,
      20
    );

    // 문제 텍스트 (박스 안에)
    this.questionText = this.add.text(width / 2, questionBoxY, '', {
      fontSize: '28px',
      fill: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      wordWrap: { width: questionBoxWidth - 40 },
      align: 'center'
    }).setOrigin(0.5);

    // 1. 타이머 위치 (문제 박스 아래, 20px 내림)
    const timerX = width / 2;
    const timerY = questionBoxY + questionBoxHeight / 2 + 70; // 문제 박스 아래 70px (50 -> 70, 20px 내림)
    this.timerY = timerY; // 나중에 사용하기 위해 저장
    
    // 시계 배경 원 (외계인 컨셉 - 사이버 블루)
    this.timerCircle = this.add.circle(timerX, timerY, 50, 0x00D9FF, 1); // 사이버 블루
    this.timerCircle.setStrokeStyle(4, 0x00FF88, 1); // 네온 그린 테두리
    
    // 타이머 텍스트
    this.timerText = this.add.text(timerX, timerY, '10', {
      fontSize: '48px',
      fill: '#00FF88',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 2. 외계인 배치 (타이머 아래, 충분한 간격, 20px 내림)
    // 타이머 원 반지름 50 + 간격 100 = 150px 아래, 추가로 20px 내림
    const alienY = timerY + 170; // 150 + 20 = 170
    const alienSpacing = 180; // 외계인 간격
    const alienPositions = [
      timerX - alienSpacing, // 왼쪽
      timerX,                // 가운데
      timerX + alienSpacing  // 오른쪽
    ];

    this.aliens = [];
    alienPositions.forEach((x, index) => {
      const alien = this.add.image(x, alienY, 'alienWaiting');
      alien.setScale(0.5); // 크기 키우기
      this.aliens.push(alien);
    });

    // 3. 답 제출 박스 (외계인 아래, 많이 내림, 20px 내림)
    // 외계인 이미지 높이 대략 50px (100px * 0.5), 하단 기준으로 +200px 간격, 추가로 20px 내림
    this.inputY = alienY + 200; // 200 + 20 = 220
    this.inputBackground = this.add.graphics();
    this.inputBackground.fillStyle(0x1a1a2e, 1); // 어두운 배경
    this.inputBackground.fillRoundedRect(width / 2 - 250, this.inputY - 40, 500, 80, 15);
    this.inputBackground.lineStyle(4, 0x00FF88, 1); // 네온 그린 테두리
    this.inputBackground.strokeRoundedRect(width / 2 - 250, this.inputY - 40, 500, 80, 15);
    
    // 입력 텍스트
    this.inputDisplayText = this.add.text(width / 2, this.inputY, '', {
      fontSize: '48px',
      fill: '#00FF88',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 4. 제출 버튼 (답 제출 박스 아래, 충분한 간격, 20px 내림)
    // 입력 필드 높이 80px, 하단 기준으로 +80px 간격, 추가로 20px 내림
    const submitY = this.inputY + 80;
    this.submitButton = this.add.graphics();
    this.submitButton.fillStyle(0x00FF88, 1); // 네온 그린
    this.submitButton.fillRoundedRect(width / 2 - 100, submitY - 30, 200, 60, 15);
    this.submitButton.lineStyle(3, 0x39FF14, 1); // 밝은 네온 그린 테두리
    this.submitButton.strokeRoundedRect(width / 2 - 100, submitY - 30, 200, 60, 15);
    this.submitButton.setInteractive(new Phaser.Geom.Rectangle(width / 2 - 100, submitY - 30, 200, 60), Phaser.Geom.Rectangle.Contains)
      .on('pointerdown', () => this.submitAnswer())
      .on('pointerover', () => {
        if (!this.isTimerRunning) return;
        this.submitButton.clear();
        this.submitButton.fillStyle(0x39FF14, 1); // 밝은 네온 그린으로 변경
        this.submitButton.fillRoundedRect(width / 2 - 100, submitY - 30, 200, 60, 15);
        this.submitButton.lineStyle(3, 0x00FF88, 1);
        this.submitButton.strokeRoundedRect(width / 2 - 100, submitY - 30, 200, 60, 15);
      })
      .on('pointerout', () => {
        this.submitButton.clear();
        this.submitButton.fillStyle(0x00FF88, 1); // 원래 색으로
        this.submitButton.fillRoundedRect(width / 2 - 100, submitY - 30, 200, 60, 15);
        this.submitButton.lineStyle(3, 0x39FF14, 1);
        this.submitButton.strokeRoundedRect(width / 2 - 100, submitY - 30, 200, 60, 15);
      });

    this.submitText = this.add.text(width / 2, submitY, '제출', {
      fontSize: '28px',
      fill: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 결과 메시지 (제출 버튼 아래, 충분한 간격)
    // 제출 버튼 높이 60px, 하단 기준으로 +30px
    this.resultText = this.add.text(width / 2, submitY + 50, '', {
      fontSize: '36px',
      fill: '#00FF88',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setVisible(false);

    // 게임 종료 텍스트 (외계인 컨셉)
    this.gameOverText = this.add.text(width / 2, height / 2, '', {
      fontSize: '48px',
      fill: '#00FF88',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setVisible(false);

    // 메뉴로 돌아가기 버튼 (외계인 컨셉)
    this.menuButton = this.add.graphics();
    this.menuButton.fillStyle(0x8B5CF6, 1);
    this.menuButton.fillRoundedRect(width / 2 - 100, height / 2 + 70, 200, 60, 15);
    this.menuButton.lineStyle(3, 0xA855F7, 1);
    this.menuButton.strokeRoundedRect(width / 2 - 100, height / 2 + 70, 200, 60, 15);
    this.menuButton.setInteractive(new Phaser.Geom.Rectangle(width / 2 - 100, height / 2 + 70, 200, 60), Phaser.Geom.Rectangle.Contains)
      .on('pointerdown', () => this.scene.start('MenuScene'))
      .setVisible(false);

    this.menuText = this.add.text(width / 2, height / 2 + 100, '메뉴로', {
      fontSize: '24px',
      fill: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // 왼쪽 밑, 오른쪽 밑 도넛 장식 (한 반원 정도만 보이게) - 아주 밑으로, 각 쪽에 2개씩
    const donutY = height + 150;
    const donutScale = 0.45;
    const donutGap = 130; // 위쪽 도넛과 많이 떨어지게
    // 왼쪽 도넛 2개 (위쪽은 좌우 반전)
    this.donutLeft = this.add.image(-60, donutY, 'donut')
      .setOrigin(0.5, 1)
      .setScale(donutScale)
      .setDepth(0);
    this.donutLeft2 = this.add.image(-60, donutY - donutGap, 'donut')
      .setOrigin(0.5, 1)
      .setScale(donutScale)
      .setFlipX(true)
      .setDepth(0);
    // 오른쪽 도넛 2개 (위쪽은 좌우 반전)
    this.donutRight = this.add.image(width + 60, donutY, 'donut')
      .setOrigin(0.5, 1)
      .setScale(donutScale)
      .setDepth(0);
    this.donutRight2 = this.add.image(width + 60, donutY - donutGap, 'donut')
      .setOrigin(0.5, 1)
      .setScale(donutScale)
      .setFlipX(true)
      .setDepth(0);

    // 키보드 입력 처리
    this.input.keyboard.on('keydown', (event) => {
      if (this.gameOverText.visible) return;
      if (!this.isTimerRunning) return;
      
      if (event.key === 'Backspace') {
        this.inputText = this.inputText.slice(0, -1);
        this.updateInputDisplay();
      } else if (event.key === 'Enter') {
        this.submitAnswer();
      } else if (event.key.length === 1 && event.key.match(/[a-zA-Z0-9\s]/)) {
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
    this.questionText.setFill('#FFFFFF');
    
    // 입력 초기화
    this.inputText = '';
    this.updateInputDisplay();
    this.resultText.setVisible(false);
    
    // 입력 필드 배경 초기화 (외계인 컨셉)
    this.inputBackground.clear();
    this.inputBackground.fillStyle(0x1a1a2e, 1);
    this.inputBackground.fillRoundedRect(this.width / 2 - 250, this.inputY - 40, 500, 80, 15);
    this.inputBackground.lineStyle(4, 0x00FF88, 1);
    this.inputBackground.strokeRoundedRect(this.width / 2 - 250, this.inputY - 40, 500, 80, 15);

    // 외계인을 기다리는 상태로 변경
    this.aliens.forEach(alien => {
      alien.setTexture('alienWaiting');
    });

    // 타이머 초기화 및 시작
    this.timer = 10;
    this.timerText.setText('10');
    this.isTimerRunning = true;

    // 기존 타이머 이벤트가 있으면 제거
    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    // 타이머 시작 (1초마다 감소)
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timer--;
        this.timerText.setText(this.timer.toString());
        
        if (this.timer <= 0) {
          // 시간 초과 시 자동으로 제출
          this.isTimerRunning = false;
          this.timer = 0; // 타이머를 0으로 설정
          this.timerText.setText('0');
          this.submitAnswer();
        }
      },
      repeat: 9 // 10번 반복 (10초)
    });
  }

  submitAnswer() {
    if (this.gameOverText.visible) return;
    // 이미 제출했거나 타이머가 아직 시작되지 않았으면 제출 불가
    if (!this.isTimerRunning && this.timer === 10) return;
    // 결과가 이미 표시되어 있으면 중복 제출 방지
    if (this.resultText.visible) return;

    // 타이머 중지
    this.isTimerRunning = false;
    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    const question = this.questions[this.currentQuestionIndex];
    const userAnswer = this.inputText.trim().toLowerCase();
    const correctAnswer = question.answer.toLowerCase();
    const isCorrect = userAnswer === correctAnswer;

    // 결과 표시
    if (isCorrect) {
      this.score++;
      this.resultText.setText('정답입니다! ✓');
      this.resultText.setFill('#4ADE80');
      this.questionText.setFill('#FFFFFF');
      
      // 입력 필드 배경 변경 (외계인 컨셉 - 네온 그린)
      this.inputBackground.clear();
      this.inputBackground.fillStyle(0x00FF88, 0.3);
      this.inputBackground.fillRoundedRect(this.width / 2 - 250, this.inputY - 40, 500, 80, 15);
      this.inputBackground.lineStyle(4, 0x39FF14, 1);
      this.inputBackground.strokeRoundedRect(this.width / 2 - 250, this.inputY - 40, 500, 80, 15);
      
      // 정답: 모든 외계인을 웃는 상태로 변경
      this.aliens.forEach(alien => {
        alien.setTexture('alienHappy');
      });

      // 정답 애니메이션
      this.tweens.add({
        targets: [this.inputDisplayText],
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      });
    } else {
      this.resultText.setText(`틀렸습니다! 정답: ${question.answer} ✗`);
      this.resultText.setFill('#FF6B00');
      this.questionText.setFill('#FFFFFF');
      
      // 입력 필드 배경 변경 (외계인 컨셉 - 네온 레드/오렌지)
      this.inputBackground.clear();
      this.inputBackground.fillStyle(0xFF4444, 0.3);
      this.inputBackground.fillRoundedRect(this.width / 2 - 250, this.inputY - 40, 500, 80, 15);
      this.inputBackground.lineStyle(4, 0xFF6B00, 1);
      this.inputBackground.strokeRoundedRect(this.width / 2 - 250, this.inputY - 40, 500, 80, 15);
      
      // 하트 감소
      this.loseHeart();
      
      // 오답: 모든 외계인을 화난 상태로 변경
      this.aliens.forEach(alien => {
        alien.setTexture('alienAngry');
      });

      // 오답 애니메이션
      this.tweens.add({
        targets: [this.inputDisplayText],
        x: this.width / 2 - 10,
        duration: 50,
        yoyo: true,
        repeat: 3,
        ease: 'Power2'
      });
    }

    this.resultText.setVisible(true);
    this.scoreText.setText(`맞힌 문제: ${this.score}`);

    // 2초 후 다음 문제로
    this.time.delayedCall(2000, () => {
      // 하트가 0이면 게임 종료
      if (this.hearts === 0) {
        this.endGame();
        return;
      }
      this.currentQuestionIndex++;
      this.showQuestion();
    });
  }

  loseHeart() {
    // 하트 감소
    if (this.hearts > 0) {
      this.hearts--;
      const heartsDisplay = '❤️'.repeat(this.hearts) + '🤍'.repeat(3 - this.hearts);
      this.heartsText.setText(heartsDisplay);
    }
  }

  endGame() {
    // 타이머 중지
    this.isTimerRunning = false;
    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    this.questionText.setVisible(false);
    this.questionBoxBg.setVisible(false);
    this.inputBackground.setVisible(false);
    this.inputDisplayText.setVisible(false);
    this.submitButton.setVisible(false);
    this.submitText.setVisible(false);
    this.resultText.setVisible(false);
    this.timerText.setVisible(false);
    this.timerCircle.setVisible(false);
    this.aliens.forEach(alien => alien.setVisible(false));

    // 게임 종료 메시지
    if (this.hearts === 0) {
      this.gameOverText.setText(`게임 오버!\n하트가 모두 소진되었습니다.\n맞힌 문제: ${this.score}개`);
    } else {
      this.gameOverText.setText(`게임 종료!\n맞힌 문제: ${this.score}개`);
    }
    this.gameOverText.setVisible(true);
    this.menuButton.setVisible(true);
    this.menuText.setVisible(true);
  }

  shutdown() {
    // 씬 종료 시 배경음악 정지
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop();
    }
  }
}
