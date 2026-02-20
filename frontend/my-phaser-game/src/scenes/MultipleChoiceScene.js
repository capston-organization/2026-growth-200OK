import Phaser from 'phaser';

export default class MultipleChoiceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MultipleChoiceScene' });
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.showResult = false;
    this.hearts = 3; // 하트 개수
    
    // 로봇 관련 변수
    this.robot = null;
    this.robotPosition = 0; // 0: A ~ 4: E (5지선다)
    
    // 북 관련 변수
    this.drums = []; // 북 배열
    // 북 4번 쳐야 정답 처리
    this.drumHitCount = 0;
    this.currentDrumForHits = null; // 4번 치는 대상 북 인덱스
    this.backgroundMusic = null;
    
    // 객관식 문제 데이터 - 영어 문법 (5지선다)
    this.questions = [
      {
        question: "Which is correct? (3rd person singular)",
        options: ['He go', 'He goes', 'He going', 'He gone', 'He went'],
        correctAnswer: 1
      },
      {
        question: "What is the correct past tense of 'run'?",
        options: ['runned', 'ran', 'run', 'running', 'runs'],
        correctAnswer: 1
      },
      {
        question: "Which sentence is grammatically correct?",
        options: ["She don't like it", "She doesn't like it", "She not like it", "She doesn't likes it", "She not likes it"],
        correctAnswer: 1
      },
      {
        question: "What is the plural of 'mouse'?",
        options: ['mouses', 'mice', 'mouse', 'mices', 'mousies'],
        correctAnswer: 1
      },
    ];
  }

  preload() {
    this.load.image('robotBase', '/assets/images/로봇리듬기본로봇.png');
    this.load.image('robotLeft', '/assets/images/로봇리듬왼손로봇.png');
    this.load.image('robotRight', '/assets/images/로봇리듬오른손로봇.png');
    this.load.image('drumImg', '/assets/images/로봇리듬북.png');
    this.load.audio('drumHit', '/assets/sounds/드럼.mp3');
    this.load.audio('robotRhythmBg', '/assets/sounds/로봇리듬배경음악.mp3');
  }

  create() {
    const { width, height } = this.cameras.main;

    // 남색 배경 설정 (로봇 컨셉)
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // 로봇 리듬 배경음악 (무한 반복) - 브라우저 자동재생 제한 대응
    try {
      this.backgroundMusic = this.sound.add('robotRhythmBg', { loop: true, volume: 2.5 });
      const playBg = () => {
        if (!this.backgroundMusic || this.backgroundMusic.isPlaying) return;
        const ctx = this.sound.context;
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => { this.backgroundMusic.play(); }).catch(() => {});
        } else {
          this.backgroundMusic.play();
        }
      };
      const unlockBg = () => {
        playBg();
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
          this.input.off('pointerdown', unlockBg);
          if (this.input.keyboard) this.input.keyboard.off('keydown', unlockBg);
        }
      };
      this.time.delayedCall(600, playBg);
      this.input.on('pointerdown', unlockBg);
      if (this.input.keyboard) this.input.keyboard.on('keydown', unlockBg);
    } catch (e) {
      console.warn('로봇 리듬 배경음악 로드 실패:', e);
    }

    // 하트 표시 (오른쪽 위)
    this.heartsText = this.add.text(width - 50, 30, '❤️❤️❤️', {
      fontSize: '28px',
      fontFamily: 'Arial'
    }).setOrigin(1, 0);

    // 맞힌 문제 개수 표시 (오른쪽 위, 하트 아래) - 로봇 컨셉 색상
    this.scoreText = this.add.text(width - 50, 65, `맞힌 문제: ${this.score}`, {
      fontSize: '24px',
      fill: '#00d4ff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    // 문제 박스 (로봇 컨셉 - 메탈릭 블루) - 상단 중앙
    const questionBoxWidth = width - 400;
    const questionBoxHeight = 100;
    const questionBoxY = 100;
    
    this.questionBoxBg = this.add.graphics();
    this.questionBoxBg.fillStyle(0x16213e, 1); // 다크 블루
    this.questionBoxBg.fillRoundedRect(width / 2 - questionBoxWidth / 2, questionBoxY - questionBoxHeight / 2, questionBoxWidth, questionBoxHeight, 20);
    this.questionBoxBg.lineStyle(3, 0x00d4ff, 1); // 사이버 블루 테두리
    this.questionBoxBg.strokeRoundedRect(width / 2 - questionBoxWidth / 2, questionBoxY - questionBoxHeight / 2, questionBoxWidth, questionBoxHeight, 20);
    
    // 문제 텍스트 (박스 안에 표시)
    this.questionText = this.add.text(width / 2, questionBoxY, '', {
      fontSize: '32px',
      fill: '#00d4ff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#0f3460',
      strokeThickness: 2,
      wordWrap: { width: questionBoxWidth - 40 }
    }).setOrigin(0.5);

    // 선택지 버튼 생성 (문제 밑에 5지선다 A, B, C, D, E 한 줄)
    this.optionButtons = [];
    this.optionTexts = [];
    const optionStartY = questionBoxY + questionBoxHeight / 2 + 50;
    const buttonSpacing = 12;
    const totalOptionW = width - 120;
    const buttonWidth = (totalOptionW - buttonSpacing * 4) / 5;
    const buttonHeight = 72;
    const totalW = 5 * buttonWidth + 4 * buttonSpacing;
    const firstCenterX = width / 2 - totalW / 2 + buttonWidth / 2;
    
    const positions = [];
    for (let i = 0; i < 5; i++) {
      positions.push({ x: firstCenterX + i * (buttonWidth + buttonSpacing), y: optionStartY });
    }

    for (let i = 0; i < 5; i++) {
      const pos = positions[i];
      
      // 버튼 배경 (로봇 컨셉 - 메탈릭 그레이)
      const button = this.add.rectangle(pos.x, pos.y, buttonWidth, buttonHeight, 0x2a2a3e, 1)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          // 버튼 클릭은 정보 표시용 (실제 선택은 북을 쳐야 함)
        })
        .on('pointerover', () => {
          if (!this.showResult) {
            button.setFillStyle(0x3a3a4e, 1);
            button.setStrokeStyle(2, 0x00d4ff, 1);
          }
        })
        .on('pointerout', () => {
          if (!this.showResult) {
            button.setFillStyle(0x2a2a3e, 1);
            button.setStrokeStyle(0, 0x000000, 0);
          }
        });
      
      // 버튼 텍스트
      const text = this.add.text(pos.x, pos.y, '', {
        fontSize: '20px',
        fill: '#00d4ff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        wordWrap: { width: buttonWidth - 30 },
        align: 'center'
      }).setOrigin(0.5);
      
      this.optionButtons.push(button);
      this.optionTexts.push(text);
    }

    // 로봇 생성 (이미지: 로봇리듬기본로봇) - 비율 유지, 크게 표시
    const robotY = height - 180;
    const robotStartX = width / 2;
    this.robot = this.add.image(robotStartX, robotY, 'robotBase').setOrigin(0.5, 0.5);
    const robotMaxW = 280;
    const robotMaxH = 320;
    const robotScale = Math.min(robotMaxW / this.robot.width, robotMaxH / this.robot.height);
    this.robot.setScale(robotScale);
    this.robot.setDepth(10); // 로봇이 북 위에 그려지도록
    this.robot.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.hitRobot());
    this.robotPosition = 0;
    this.robotFace = null;

    // 북 생성 (로봇 위쪽, 5개 A~E) - 비율 유지
    const drumY = height - 240;
    const drumWidth = (width - 20) / 5;
    const drumStartX = 10;
    const drumMaxW = drumWidth;
    const drumMaxH = 360;
    this.drums = [];
    
    for (let i = 0; i < 5; i++) {
      const drumX = drumStartX + i * drumWidth + drumWidth / 2;
      
      const drum = this.add.image(drumX, drumY, 'drumImg').setOrigin(0.5, 0.5);
      const drumScale = Math.min(drumMaxW / drum.width, drumMaxH / drum.height);
      drum.setScale(drumScale);
      drum.setDepth(0); // 북은 로봇 뒤에
      drum.setInteractive({ useHandCursor: false })
        .on('pointerover', () => {
          if (!this.showResult) drum.setTint(0x88ffff);
        })
        .on('pointerout', () => drum.clearTint());
      
      const label = this.add.text(drumX, drumY, String.fromCharCode(65 + i), {
        fontSize: '32px',
        fill: '#00d4ff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#0f3460',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(5);
      
      this.drums.push({
        drum: drum,
        label: label,
        index: i
      });
    }

    // 왼쪽 화살표 버튼 (로봇 왼쪽, 더 아래로) - 로봇 컨셉 색상
    const leftArrowX = robotStartX - 100;
    const arrowY = robotY + 80; // 더 아래로 이동
    this.leftArrow = this.add.polygon(leftArrowX, arrowY, [
      -30, 0,
      10, -20,
      10, 20
    ], 0x00d4ff, 1)
      .setInteractive({ 
        useHandCursor: true,
        hitArea: new Phaser.Geom.Polygon([
          -30, 0,
          10, -20,
          10, 20
        ]),
        hitAreaCallback: Phaser.Geom.Polygon.Contains
      })
      .on('pointerdown', () => {
        console.log('왼쪽 화살표 클릭');
        this.moveRobot(-1);
      })
      .on('pointerover', () => this.leftArrow.setFillStyle(0x00ffff, 1))
      .on('pointerout', () => this.leftArrow.setFillStyle(0x00d4ff, 1));
    
    // 오른쪽 화살표 버튼 (로봇 오른쪽, 더 아래로) - 로봇 컨셉 색상
    const rightArrowX = robotStartX + 100;
    this.rightArrow = this.add.polygon(rightArrowX, arrowY, [
      30, 0,
      -10, -20,
      -10, 20
    ], 0x00d4ff, 1)
      .setInteractive({ 
        useHandCursor: true,
        hitArea: new Phaser.Geom.Polygon([
          30, 0,
          -10, -20,
          -10, 20
        ]),
        hitAreaCallback: Phaser.Geom.Polygon.Contains
      })
      .on('pointerdown', () => {
        console.log('오른쪽 화살표 클릭');
        this.moveRobot(1);
      })
      .on('pointerover', () => this.rightArrow.setFillStyle(0x00ffff, 1))
      .on('pointerout', () => this.rightArrow.setFillStyle(0x00d4ff, 1));

    // 결과 메시지 (로봇 컨셉 색상)
    this.resultText = this.add.text(width / 2, height - 30, '', {
      fontSize: '32px',
      fill: '#00d4ff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // 안내 텍스트 (로봇 컨셉 색상)
    this.timingGuideText = this.add.text(width / 2, height - 60, '화살표로 이동 후 로봇을 4번 클릭해서 북을 치세요!', {
      fontSize: '20px',
      fill: '#00d4ff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 게임 종료 텍스트
    this.gameOverText = this.add.text(width / 2, height / 2 - 60, '', {
      fontSize: '64px',
      fill: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#8B4A6B',
      strokeThickness: 6,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 5,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setVisible(false);
    
    // 게임 종료 배경 (반투명 박스)
    this.gameOverBackground = this.add.graphics();
    this.gameOverBackground.fillStyle(0x000000, 0.7);
    this.gameOverBackground.fillRoundedRect(width / 2 - 400, height / 2 - 150, 800, 300, 20);
    this.gameOverBackground.setVisible(false);

    // 메뉴로 돌아가기 버튼 (파스텔 그레이, 둥근 모서리)
    this.menuButton = this.createRoundedButton(0, 0, 200, 60, 0xD3D3D3);
    this.menuText = this.add.text(0, 0, '메뉴로', {
      fontSize: '24px',
      fill: '#6B6B6B',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);
    
    const menuContainer = this.add.container(width / 2, height / 2 + 80, [this.menuButton, this.menuText]);
    menuContainer.setSize(200, 60);
    menuContainer.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'))
      .setVisible(false);
    this.menuContainer = menuContainer;

    // 첫 문제 표시
    this.time.delayedCall(500, () => {
      this.showQuestion();
    });
  }

  createRoundedButton(x, y, width, height, color, radius = 25) {
    const graphics = this.add.graphics();
    
    // 그림자 효과
    graphics.fillStyle(0x000000, 0.15);
    graphics.fillRoundedRect(x - width/2 + 3, y - height/2 + 3, width, height, radius);
    
    // 버튼 본체
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(x - width/2, y - height/2, width, height, radius);
    
    // 하이라이트
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.strokeRoundedRect(x - width/2, y - height/2, width, height, radius);
    
    return graphics;
  }

  moveRobot(direction) {
    if (this.showResult) return;
    
    const newPosition = this.robotPosition + direction;
    if (newPosition < 0 || newPosition > 4) return;
    
    this.robotPosition = newPosition;
    const targetX = this.drums[this.robotPosition].drum.x;
    
    this.tweens.add({
      targets: this.robot,
      x: targetX,
      duration: 300,
      ease: 'Power2'
    });
  }

  hitRobot() {
    if (this.showResult) return;
    
    // 드럼 소리 엄청 크게 재생
    try {
      this.sound.play('drumHit', { volume: 8 });
    } catch (e) {
      console.warn('드럼 소리 재생 실패:', e);
    }
    
    const drumIndex = this.robotPosition;
    if (this.currentDrumForHits !== null && this.currentDrumForHits !== drumIndex) {
      this.drumHitCount = 0;
    }
    this.currentDrumForHits = drumIndex;
    this.drumHitCount += 1;
    
    // 클릭할 때마다 왼손 로봇 ↔ 오른손 로봇 번갈아 (북 치는 모션)
    if (this.drumHitCount % 2 === 1) {
      this.robot.setTexture('robotLeft');
    } else {
      this.robot.setTexture('robotRight');
    }
    
    // 현재 서 있는 북 살짝 튀는 애니메이션
    const drum = this.drums[drumIndex].drum;
    const baseScale = drum.scaleX;
    this.tweens.add({
      targets: drum,
      scaleX: baseScale * 1.1,
      scaleY: baseScale * 1.1,
      duration: 80,
      yoyo: true,
      ease: 'Power2'
    });
    
    // 4번째 클릭에서 정답 처리
    if (this.drumHitCount >= 4) {
      this.time.delayedCall(150, () => {
        this.robot.setTexture('robotBase');
        this.checkAnswer(drumIndex);
      });
    } else {
      this.time.delayedCall(200, () => {
        if (!this.showResult) this.robot.setTexture('robotBase');
      });
    }
  }

  checkAnswer(drumIndex) {
    if (this.showResult) return;
    
    this.drumHitCount = 0;
    this.currentDrumForHits = null;
    
    const question = this.questions[this.currentQuestionIndex];
    const isCorrect = drumIndex === question.correctAnswer;
    
    this.showResult = true;
    this.robot.setTexture('robotBase');
    
    if (isCorrect) {
      this.resultText.setText('Perfect! 정답입니다! ✓');
      this.resultText.setFill('#00ff88');
      this.score++;
      this.scoreText.setText(`맞힌 문제: ${this.score}`);
      this.drums[drumIndex].drum.setTint(0x00ff88);
    } else {
      this.resultText.setText(`틀렸습니다! 정답은 ${String.fromCharCode(65 + question.correctAnswer)}번입니다. ✗`);
      this.resultText.setFill('#ff4444');
      this.loseHeart();
      this.drums[drumIndex].drum.setTint(0xff4444);
      this.drums[question.correctAnswer].drum.setTint(0x00ff88);
    }
    
    this.resultText.setVisible(true);

    this.time.delayedCall(2000, () => {
      try {
        if (this.hearts === 0) return;
        this.drums.forEach(d => d.drum.clearTint());
        this.currentQuestionIndex++;
        this.showQuestion();
      } catch (e) {
        console.error('다음 문제로 넘어가기 실패:', e);
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.questions.length) this.showQuestion();
        else this.endGame();
      }
    });
  }

  showQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    
    // 문제 텍스트 표시
    this.questionText.setText(question.question);
    
    // 선택지 버튼에 옵션 표시
    question.options.forEach((option, index) => {
      if (this.optionTexts[index]) {
        this.optionTexts[index].setText(`${String.fromCharCode(65 + index)}. ${option}`);
      }
    });
    
    // 상태 초기화
    this.resultText.setVisible(false);
    this.showResult = false;
    
    this.drumHitCount = 0;
    this.currentDrumForHits = null;
    
    this.robotPosition = 0;
    const robotStartX = this.drums[0].drum.x;
    this.robot.setPosition(robotStartX, this.robot.y);
    this.robot.setTexture('robotBase');
    
    this.drums.forEach(d => d.drum.clearTint());
  }

  loseHeart() {
    // 하트 감소
    if (this.hearts > 0) {
      this.hearts--;
      const heartsDisplay = '❤️'.repeat(this.hearts) + '🤍'.repeat(3 - this.hearts);
      this.heartsText.setText(heartsDisplay);
      
      // 하트가 0이 되면 게임 종료
      if (this.hearts === 0) {
        this.time.delayedCall(1000, () => {
          this.endGame();
        });
      }
    }
  }

  endGame() {
    this.questionText.setVisible(false);
    this.questionBoxBg.setVisible(false);
    this.resultText.setVisible(false);
    this.timingGuideText.setVisible(false);
    this.robot.setVisible(false);
    this.robotFace.setVisible(false);
    this.leftArrow.setVisible(false);
    this.rightArrow.setVisible(false);
    this.drums.forEach(d => {
      d.drum.setVisible(false);
      d.label.setVisible(false);
    });
    this.optionButtons.forEach(btn => btn.setVisible(false));
    this.optionTexts.forEach(txt => txt.setVisible(false));

    // 배경 표시
    this.gameOverBackground.setVisible(true);
    
    // 게임 종료 텍스트 표시
    if (this.hearts === 0) {
      this.gameOverText.setText(`게임 오버!\n하트가 모두 소진되었습니다.\n맞힌 문제: ${this.score}개`);
    } else {
      this.gameOverText.setText(`게임 종료!\n맞힌 문제: ${this.score}개`);
    }
    this.gameOverText.setVisible(true);
    
    // 버튼 표시
    this.menuContainer.setVisible(true);

    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop();
    }
  }
}
