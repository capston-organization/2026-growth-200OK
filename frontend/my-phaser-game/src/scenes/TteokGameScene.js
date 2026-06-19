import Phaser from 'phaser';

export default class TteokGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TteokGameScene' });
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.showResult = false;
    
    // 리듬 게임 변수
    this.backgroundMusic = null; // 배경 음악
    this.questionStartTime = 0; // 문제 시작 시간
    this.musicDuration = 10000; // 10초
    this.countStartTime = 6000; // 원투쓰리포 시작 (6초) - 안내용
    this.rhythmStartTime = 8000; // 입력 시작 (8초)
    this.rhythmEndTime = 10000; // 입력 끝 (10초) → 8~10초 사이에 4번 누르면 정답
    this.beatInterval = 500; // 0.5초 간격 (헤이 소리용)
    this.isQuestionActive = false; // 문제가 활성화되어 있는지
    this.questionChoice = null; // 이 문제에서 첫 입력으로 확정된 O/X (4비트 모두 동일 적용)

    // 원투쓰리포 입력 체크
    this.beatInputs = {
      1: null, // 원 입력 여부
      2: null, // 투 입력 여부
      3: null, // 쓰리 입력 여부
      4: null  // 포 입력 여부
    };
    
    // 문제 데이터 (4개) - 영어 문법 O/X (한국어 문장, 필요한 단어만 영어)
    this.questions = [
      { question: "'go'의 과거형은 'went'이다.", answer: true },
      { question: "영어 동사는 모두 -ed를 붙여 과거형을 만든다.", answer: false },
      { question: "'child'의 복수형은 'children'이다.", answer: true },
      { question: "'She don't like it'은 문법적으로 맞는 문장이다.", answer: false },
    ];
  }

  preload() {
    // 떡 이미지 로드
    this.load.image('그냥떡', '/assets/images/그냥떡.png');
    this.load.image('망치떡', '/assets/images/망치떡.png');
    this.load.image('물떡', '/assets/images/물떡.png');
    
    // 토끼 이미지 로드
    this.load.image('망치기본토끼', '/assets/images/망치기본토끼.png');
    this.load.image('망치망치토끼', '/assets/images/망치망치토끼.png');
    this.load.image('물기본토끼', '/assets/images/물기본토끼.png');
    this.load.image('물물토끼', '/assets/images/물물토끼.png');

    // 사운드 로드
    this.load.audio('backgroundMusic', '/assets/sounds/떡게임배경소리.mp3');
    this.load.audio('hey', '/assets/sounds/hey.mp3');
    this.load.audio('one', '/assets/sounds/one.mp3');
    this.load.audio('two', '/assets/sounds/two.mp3');
    this.load.audio('three', '/assets/sounds/three.mp3');
    this.load.audio('four', '/assets/sounds/four.mp3');
  }

  create() {
    const { width, height } = this.cameras.main;

    // 파스텔톤 배경색 설정
    this.cameras.main.setBackgroundColor('#FFF8E7');

    // 문제 박스 (파스텔 핑크, 둥근 모서리) - 맞힌 문제/하트와 겹치지 않도록 조정
    const questionBoxWidth = width - 400; // 가로 크기 줄임
    const questionBoxHeight = 100;
    const questionBoxY = 140; // 아래로 내림
    
    // 박스 배경
    this.questionBoxBg = this.add.graphics();
    this.questionBoxBg.fillStyle(0xFFB6C1, 1); // 파스텔 핑크
    this.questionBoxBg.fillRoundedRect(width / 2 - questionBoxWidth / 2, questionBoxY - questionBoxHeight / 2, questionBoxWidth, questionBoxHeight, 20);
    this.questionBoxBg.lineStyle(3, 0xFFC0CB, 1);
    this.questionBoxBg.strokeRoundedRect(width / 2 - questionBoxWidth / 2, questionBoxY - questionBoxHeight / 2, questionBoxWidth, questionBoxHeight, 20);
    
    // 문제 텍스트 (박스 안에 표시)
    this.questionLabelText = this.add.text(width / 2, questionBoxY, '', {
      fontSize: '32px',
      fill: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#8B4A6B',
      strokeThickness: 2,
      wordWrap: { width: questionBoxWidth - 40 }
    }).setOrigin(0.5);

    // 맞힌 문제 개수 표시 (오른쪽 위)
    this.scoreText = this.add.text(width - 50, 30, `맞힌 문제: ${this.score}`, {
      fontSize: '24px',
      fill: '#4A6B8B',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(1, 0);
    
    // 하트 표시 (오른쪽 위, 맞힌 문제 아래)
    this.heartsText = this.add.text(width - 50, 60, '❤️❤️❤️', {
      fontSize: '28px',
      fontFamily: 'Arial'
    }).setOrigin(1, 0);



    // 떡 생성 (중앙)
    const tteokY = height / 2 + 80;
    this.tteok = this.add.image(width / 2, tteokY, '그냥떡');
    this.tteok.setDisplaySize(300, 200);

    // 망치 기본 토끼 (왼쪽, 선택 가능)
    const hammerRabbitX = width / 2 - 250;
    const hammerRabbitY = height / 2 + 30;
    
    // 망치 토끼 뒤에 빨간 파스텔 톤 동그라미 레이어
    const redCircle = this.add.circle(hammerRabbitX, hammerRabbitY, 120, 0xFFB6C1, 0.8); // 파스텔 핑크/빨강
    redCircle.setDepth(0); // 토끼 뒤에 배치
    
    this.hammerRabbit = this.add.image(hammerRabbitX, hammerRabbitY, '망치기본토끼');
    this.hammerRabbit.setDisplaySize(200, 250);
    this.hammerRabbit.setDepth(1); // 토끼를 앞에 배치
    this.hammerRabbit.setInteractive({ useHandCursor: true })
      .on('pointerdown', (ptr) => {
        ptr.event.stopPropagation();
        this.selectAnswerWithPointer(ptr);
      })
      .on('pointerover', () => {
        if (this.isQuestionActive && !this.showResult) {
          this.tweens.add({
            targets: this.hammerRabbit,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 150,
            ease: 'Back.easeOut'
          });
        }
      })
      .on('pointerout', () => {
        if (!this.showResult) {
          this.tweens.add({
            targets: this.hammerRabbit,
            scaleX: 1,
            scaleY: 1,
            duration: 150,
            ease: 'Back.easeIn'
          });
        }
      });

    // 물 기본 토끼 (오른쪽, 선택 가능)
    const waterRabbitX = width / 2 + 250;
    const waterRabbitY = height / 2 + 30;
    
    // 물 토끼 뒤에 파란 파스텔 톤 엑스 레이어
    this.blueXLayer = this.add.graphics();
    this.blueXLayer.lineStyle(20, 0x87CEEB, 0.9); // 파스텔 블루 (더 진하게)
    this.blueXLayer.setDepth(0); // 토끼 뒤에 배치
    
    // 엑스 그리기 (대각선 두 개)
    const xSize = 120;
    // 첫 번째 대각선
    this.blueXLayer.lineBetween(
      waterRabbitX - xSize/2, 
      waterRabbitY - xSize/2,
      waterRabbitX + xSize/2, 
      waterRabbitY + xSize/2
    );
    // 두 번째 대각선
    this.blueXLayer.lineBetween(
      waterRabbitX + xSize/2, 
      waterRabbitY - xSize/2,
      waterRabbitX - xSize/2, 
      waterRabbitY + xSize/2
    );
    
    this.waterRabbit = this.add.image(waterRabbitX, waterRabbitY, '물기본토끼');
    this.waterRabbit.setDisplaySize(200, 250);
    this.waterRabbit.setDepth(1); // 토끼를 앞에 배치
    this.waterRabbit.setInteractive({ useHandCursor: true })
      .on('pointerdown', (ptr) => {
        ptr.event.stopPropagation();
        this.selectAnswerWithPointer(ptr);
      })
      .on('pointerover', () => {
        if (this.isQuestionActive && !this.showResult) {
          this.tweens.add({
            targets: this.waterRabbit,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 150,
            ease: 'Back.easeOut'
          });
        }
      })
      .on('pointerout', () => {
        if (!this.showResult) {
          this.tweens.add({
            targets: this.waterRabbit,
            scaleX: 1,
            scaleY: 1,
            duration: 150,
            ease: 'Back.easeIn'
          });
        }
      });

    // 결과 메시지 (파스텔 색상)
    this.resultText = this.add.text(width / 2, height / 2 + 250, '', {
      fontSize: '36px',
      fill: '#6B8B9B',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // 타이밍 안내 텍스트 (파스텔 옐로우)
    this.timingGuideText = this.add.text(width / 2, height - 30, '원투쓰리포 후 헤이 4번에 맞춰 모두 눌러주세요!', {
      fontSize: '20px',
      fill: '#D2B48C',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 게임 종료 텍스트 (더 진한 색상과 배경으로 가독성 개선)
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

    // 다시 시작 버튼 (파스텔 블루, 둥근 모서리)
    this.restartButton = this.createRoundedButton(0, 0, 200, 60, 0xADD8E6);
    this.restartText = this.add.text(0, 0, '다시 시작', {
      fontSize: '24px',
      fill: '#4A6B8B',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);
    
    const restartContainer = this.add.container(width / 2, height / 2 + 80, [this.restartButton, this.restartText]);
    restartContainer.setSize(200, 60);
    restartContainer.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.restartGame())
      .setVisible(false);
    this.restartContainer = restartContainer;

    // 메뉴로 돌아가기 버튼 (파스텔 그레이, 둥근 모서리)
    this.menuButton = this.createRoundedButton(0, 0, 200, 60, 0xD3D3D3);
    this.menuText = this.add.text(0, 0, '메뉴로', {
      fontSize: '24px',
      fill: '#6B6B6B',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);
    
    const menuContainer = this.add.container(width / 2, height / 2 + 160, [this.menuButton, this.menuText]);
    menuContainer.setSize(200, 60);
    menuContainer.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.stopMusic();
        this.scene.start('MenuScene');
      })
      .setVisible(false);
    this.menuContainer = menuContainer;

    // 사운드 생성
    this.createSounds();

    // 브라우저 자동 재생 정책 대응: 사용자 상호작용 후 오디오 컨텍스트 활성화
    const enableAudio = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('오디오 컨텍스트 활성화됨');
        });
      }
    };
    
    // 화면 클릭 시 오디오 활성화
    this.input.once('pointerdown', enableAudio);
    this.input.keyboard.once('keydown', enableAudio);

    // 첫 문제 표시
    this.time.delayedCall(500, () => {
      this.showQuestion();
    });
  }

  createSounds() {
    // Web Audio API로 사운드 생성
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // 배경 음악 생성 (볼륨 조정)
    if (this.cache.audio.exists('backgroundMusic')) {
      this.backgroundMusic = this.sound.add('backgroundMusic', { loop: false, volume: 0.4 });
    }
    
    // 원투쓰리포 사운드 객체 생성
    if (this.cache.audio.exists('one')) {
      this.oneSound = this.sound.add('one');
    }
    if (this.cache.audio.exists('two')) {
      this.twoSound = this.sound.add('two');
    }
    if (this.cache.audio.exists('three')) {
      this.threeSound = this.sound.add('three');
    }
    if (this.cache.audio.exists('four')) {
      this.fourSound = this.sound.add('four');
    }
  }

  playHeySound() {
    // hey 소리 재생 (Phaser의 sound.play() 직접 사용)
    try {
      if (this.cache.audio.exists('hey')) {
        // sound.play()는 매번 새로운 인스턴스를 생성하여 재생
        this.sound.play('hey', { volume: 1.0 });
        console.log('hey 소리 재생');
      } else {
        console.log('hey 사운드 파일이 캐시에 없습니다');
      }
    } catch (e) {
      console.log('hey 소리 재생 실패:', e);
    }
  }

  playCountSound(count) {
    // 원, 투, 쓰리, 포 음성 재생
    try {
      if (count === 1 && this.oneSound) {
        this.oneSound.play();
      } else if (count === 2 && this.twoSound) {
        this.twoSound.play();
      } else if (count === 3 && this.threeSound) {
        this.threeSound.play();
      } else if (count === 4 && this.fourSound) {
        this.fourSound.play();
      }
    } catch (e) {
      console.log('카운트 사운드 재생 실패:', e);
    }
  }

  stopMusic() {
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop();
    }
  }

  showQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    // 문제 텍스트를 박스 안에 표시
    this.questionLabelText.setText(question.question);
    
    // 떡 초기화
    this.resetTteok();
    
    // 토끼 초기화
    this.resetRabbits();
    
    // 입력 초기화
    this.beatInputs = { 1: null, 2: null, 3: null, 4: null };
    this.resultText.setVisible(false);
    this.showResult = false;
    this.selectedAnswer = null;
    this.questionChoice = null; // 이 문제에서 첫 입력만 O/X 확정
    this.isQuestionActive = true;
    this.questionStartTime = this.time.now;

    // 배경 음악 재생
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic.play();
    }

    // 원투쓰리포 안내 (6초~7.5초) - 안내용
    const delayToCount = this.countStartTime; // 6초 후
    this.time.delayedCall(delayToCount, () => {
      this.startCountBeats();
    });

    // 헤이 4번 재생 (8초~9.5초) - 실제 입력 구간
    const delayToRhythm = this.rhythmStartTime; // 8초 후
    this.time.delayedCall(delayToRhythm, () => {
      this.startRhythmBeats();
    });

    // 10.2초 후 결과 확인 (8~10초 구간에서 4번 눌렀는지로 판정)
    this.time.delayedCall(this.rhythmEndTime + 200, () => {
      this.checkQuestionResult();
    });
  }

  startCountBeats() {
    // 원투쓰리포 안내 (6초~7.5초) - 안내용
    // 원 (6초)
    this.playCountSound(1);
    
    // 투 (6.5초)
    this.time.delayedCall(this.beatInterval, () => {
      this.playCountSound(2);
    });
    
    // 쓰리 (7초)
    this.time.delayedCall(this.beatInterval * 2, () => {
      this.playCountSound(3);
    });
    
    // 포 (7.5초)
    this.time.delayedCall(this.beatInterval * 3, () => {
      this.playCountSound(4);
    });
  }

  startRhythmBeats() {
    // 헤이 4번 재생 (8초~9.5초) - 실제 입력 구간
    // 첫 문제 오답 방지: 4개 비트 입력 슬롯을 미리 모두 생성
    const baseTime = this.time.now;
    this.beatInputs[1] = { time: baseTime, answered: false, answer: null };
    this.beatInputs[2] = { time: baseTime + this.beatInterval, answered: false, answer: null };
    this.beatInputs[3] = { time: baseTime + this.beatInterval * 2, answered: false, answer: null };
    this.beatInputs[4] = { time: baseTime + this.beatInterval * 3, answered: false, answer: null };
    
    // 첫 번째 헤이 (8초)
    this.playHeySound();
    
    // 두 번째 헤이 (8.5초)
    this.time.delayedCall(this.beatInterval, () => {
      this.playHeySound();
      if (this.beatInputs[2]) this.beatInputs[2].time = this.time.now;
    });
    
    // 세 번째 헤이 (9초)
    this.time.delayedCall(this.beatInterval * 2, () => {
      this.playHeySound();
      if (this.beatInputs[3]) this.beatInputs[3].time = this.time.now;
    });
    
    // 네 번째 헤이 (9.5초)
    this.time.delayedCall(this.beatInterval * 3, () => {
      this.playHeySound();
      if (this.beatInputs[4]) this.beatInputs[4].time = this.time.now;
    });
  }

  /** 클릭 좌표로 O/X 판단 (어느 객체가 이벤트 받았는지 말고, 실제 터치/클릭 위치로 통일) */
  selectAnswerWithPointer(pointer) {
    const centerX = this.cameras.main.width / 2;
    const answer = pointer.x < centerX; // 왼쪽 = 망치(O), 오른쪽 = 물(X)
    this.selectAnswer(answer);
  }

  selectAnswer(answer) {
    if (this.showResult || !this.isQuestionActive) return;
    
    const currentTime = this.time.now;
    const timeSinceStart = currentTime - this.questionStartTime;
    
    // 8~10초 구간에서만 입력 허용 (그 사이 4번 누르면 정답 처리)
    if (timeSinceStart < this.rhythmStartTime || timeSinceStart > this.rhythmEndTime) {
      return;
    }

    // 누른 순서대로 1→2→3→4 슬롯에 할당 (4번 누르면 4개 모두 채움)
    let assignedBeat = null;
    for (let beat = 1; beat <= 4; beat++) {
      if (!this.beatInputs[beat] || !this.beatInputs[beat].answered) {
        assignedBeat = beat;
        break;
      }
    }

    if (assignedBeat !== null) {
      // 첫 입력으로 이 문제의 O/X 확정 (4비트 모두 같은 값 적용)
      if (this.questionChoice === null) this.questionChoice = answer;
      const lockedAnswer = this.questionChoice;

      if (!this.beatInputs[assignedBeat]) {
        this.beatInputs[assignedBeat] = { time: this.time.now, answered: false, answer: null };
      }
      this.beatInputs[assignedBeat].answered = true;
      this.beatInputs[assignedBeat].answer = lockedAnswer;

      // 시각적 피드백 (실제 누른 버튼 기준)
      if (lockedAnswer) {
        // 망치 토끼 애니메이션
        this.hammerRabbit.setTexture('망치망치토끼');
        // 망치 떡: 망치떡으로 바뀌었다가 다시 기본떡
        this.tteok.setTexture('망치떡');
        this.tteok.setDisplaySize(300, 200);
        this.time.delayedCall(300, () => {
          if (!this.showResult) {
            this.hammerRabbit.setTexture('망치기본토끼');
            this.tteok.setTexture('그냥떡');
            this.tteok.setDisplaySize(300, 200);
          }
        });
      } else {
        // 물 토끼 애니메이션
        this.waterRabbit.setTexture('물물토끼');
        // 물 떡: 물떡으로 바뀌었다가 다시 기본떡
        this.tteok.setTexture('물떡');
        this.tteok.setDisplaySize(300, 200);
        this.time.delayedCall(300, () => {
          if (!this.showResult) {
            this.waterRabbit.setTexture('물기본토끼');
            this.tteok.setTexture('그냥떡');
            this.tteok.setDisplaySize(300, 200);
          }
        });
      }
    }
  }

  checkQuestionResult() {
    if (this.showResult) return;
    
    this.isQuestionActive = false;
    this.showResult = true;
    
    const question = this.questions[this.currentQuestionIndex];
    const correctAnswer = question.answer;
    
    // 모든 비트에 답했는지 확인
    let allAnswered = true;
    let allCorrect = true;
    
    for (let beat = 1; beat <= 4; beat++) {
      if (!this.beatInputs[beat] || !this.beatInputs[beat].answered) {
        allAnswered = false;
        break;
      }
      if (this.beatInputs[beat].answer !== correctAnswer) {
        allCorrect = false;
      }
    }

    // 결과 처리
    if (!allAnswered) {
      // 모든 비트에 답하지 않음
      this.resultText.setText('모든 비트에 답해주세요! ✗');
      this.resultText.setFill('#FFDAB9');
      // 하트 감소
      this.loseHeart();
    } else if (allCorrect) {
      // 모든 비트가 정답
      this.score++;
      this.resultText.setText('Perfect! 정답입니다! ✓');
      this.resultText.setFill('#90EE90');
      
      // 맞힌 문제 개수 업데이트
      this.scoreText.setText(`맞힌 문제: ${this.score}`);
      
      // 정답에 맞는 액션 수행
      if (correctAnswer) {
        this.hitTteok(true);
      } else {
        this.waterTteok(true);
      }
    } else {
      // 일부 비트가 오답
      this.resultText.setText('틀렸습니다! ✗');
      this.resultText.setFill('#FFB6C1');
      // 하트 감소
      this.loseHeart();
    }

    this.resultText.setVisible(true);
    this.timingGuideText.setText('원투쓰리포 후 헤이 4번에 맞춰 모두 눌러주세요!');
    this.timingGuideText.setFill('#D2B48C');

    // 2초 후 다음 문제로
    this.time.delayedCall(2000, () => {
      this.currentQuestionIndex++;
      this.showQuestion();
    });
  }

  hitTteok(isCorrect) {
    // 망치로 떡 만들기 애니메이션
    this.hammerRabbit.setTexture('망치망치토끼');
    
    this.tweens.add({
      targets: this.hammerRabbit,
      y: this.hammerRabbit.y + 30,
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        // 떡 변경: 기본떡 → 망치떡
        this.tteok.setTexture('망치떡');
        this.tteok.setDisplaySize(300, 200);
        
        // 떡 흔들림 효과
        this.tweens.add({
          targets: this.tteok,
          x: this.tteok.x - 10,
          duration: 50,
          yoyo: true,
          repeat: 3,
          ease: 'Power2'
        });
      }
    });
  }

  waterTteok(isCorrect) {
    // 물 묻히기 애니메이션
    this.waterRabbit.setTexture('물물토끼');
    
    this.tweens.add({
      targets: this.waterRabbit,
      y: this.waterRabbit.y + 20,
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        // 떡 변경: 기본떡 → 물떡
        this.tteok.setTexture('물떡');
        this.tteok.setDisplaySize(300, 200);
        
        // 떡 흔들림 효과
        this.tweens.add({
          targets: this.tteok,
          x: this.tteok.x - 10,
          duration: 50,
          yoyo: true,
          repeat: 3,
          ease: 'Power2'
        });
      }
    });
  }

  resetTteok() {
    // 떡을 기본 상태로 복원
    this.tteok.setTexture('그냥떡');
    this.tteok.setDisplaySize(300, 200);
  }

  resetRabbits() {
    // 토끼들을 기본 상태로 복원
    this.hammerRabbit.setTexture('망치기본토끼');
    this.waterRabbit.setTexture('물기본토끼');
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
    this.stopMusic();
    this.questionLabelText.setVisible(false);
    this.questionBoxBg.setVisible(false);
    this.hammerRabbit.setVisible(false);
    this.waterRabbit.setVisible(false);
    this.resultText.setVisible(false);
    this.timingGuideText.setVisible(false);
    this.tteok.setVisible(false);
    this.scoreText.setVisible(false);
    this.heartsText.setVisible(false);
    if (this.blueXLayer) this.blueXLayer.setVisible(false);

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
    if (this.restartContainer) this.restartContainer.setVisible(true);
    if (this.menuContainer) this.menuContainer.setVisible(true);
  }

  restartGame() {
    this.stopMusic();
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.showResult = false;
    this.isQuestionActive = false;
    this.beatInputs = { 1: null, 2: null, 3: null, 4: null };
    this.hearts = 3; // 하트 초기화

    this.questionLabelText.setVisible(true);
    this.questionBoxBg.setVisible(true);
    this.hammerRabbit.setVisible(true);
    this.waterRabbit.setVisible(true);
    this.timingGuideText.setVisible(true);
    this.tteok.setVisible(true);
    this.scoreText.setVisible(true);
    this.heartsText.setVisible(true);
    this.gameOverText.setVisible(false);
    this.gameOverBackground.setVisible(false);
    if (this.restartContainer) this.restartContainer.setVisible(false);
    if (this.menuContainer) this.menuContainer.setVisible(false);

    this.scoreText.setText(`맞힌 문제: ${this.score}`);
    this.heartsText.setText('❤️❤️❤️');
    this.timingGuideText.setText('원투쓰리포 후 헤이 4번에 맞춰 모두 눌러주세요!');
    this.timingGuideText.setFill('#D2B48C');
    
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
}
