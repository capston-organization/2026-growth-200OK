import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // 파스텔톤 배경색 설정
    this.cameras.main.setBackgroundColor('#FFF8E7');

    // 제목 (파스텔 핑크)
    this.add.text(width / 2, height / 2 - 200, '게임 선택', {
      fontSize: '64px',
      fill: '#FFB6C1',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#FFC0CB',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 떡 만들기 게임 버튼 (파스텔 핑크, 둥근 모서리)
    const tteokButton = this.createRoundedButton(0, 0, 400, 80, 0xFFB6C1);
    const tteokText = this.add.text(0, 0, '떡 만들기 리듬 게임', {
      fontSize: '32px',
      fill: '#8B4A6B',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const tteokContainer = this.add.container(width / 2, height / 2 - 100, [tteokButton, tteokText]);
    tteokContainer.setSize(400, 80);
    tteokContainer.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('TteokGameScene');
      })
      .on('pointerover', () => {
        this.tweens.add({
          targets: tteokContainer,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 150,
          ease: 'Back.easeOut'
        });
      })
      .on('pointerout', () => {
        this.tweens.add({
          targets: tteokContainer,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Back.easeIn'
        });
      });

    // 단답형 게임 버튼 (파스텔 그린, 둥근 모서리)
    const shortAnswerButton = this.createRoundedButton(0, 0, 400, 80, 0x98FB98);
    const shortAnswerText = this.add.text(0, 0, '단답형 문제', {
      fontSize: '32px',
      fill: '#4A8B6B',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const shortAnswerContainer = this.add.container(width / 2, height / 2, [shortAnswerButton, shortAnswerText]);
    shortAnswerContainer.setSize(400, 80);
    shortAnswerContainer.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('ShortAnswerScene');
      })
      .on('pointerover', () => {
        this.tweens.add({
          targets: shortAnswerContainer,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 150,
          ease: 'Back.easeOut'
        });
      })
      .on('pointerout', () => {
        this.tweens.add({
          targets: shortAnswerContainer,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Back.easeIn'
        });
      });

    // 객관식 게임 버튼 (파스텔 퍼플, 둥근 모서리)
    const multipleChoiceButton = this.createRoundedButton(0, 0, 400, 80, 0xDDA0DD);
    const multipleChoiceText = this.add.text(0, 0, '객관식 문제', {
      fontSize: '32px',
      fill: '#8B6B8B',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const multipleChoiceContainer = this.add.container(width / 2, height / 2 + 100, [multipleChoiceButton, multipleChoiceText]);
    multipleChoiceContainer.setSize(400, 80);
    multipleChoiceContainer.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('MultipleChoiceScene');
      })
      .on('pointerover', () => {
        this.tweens.add({
          targets: multipleChoiceContainer,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 150,
          ease: 'Back.easeOut'
        });
      })
      .on('pointerout', () => {
        this.tweens.add({
          targets: multipleChoiceContainer,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Back.easeIn'
        });
      });
  }

  createRoundedButton(x, y, width, height, color, radius = 30) {
    const graphics = this.add.graphics();
    
    // 그림자 효과 (Container 내부 좌표 기준)
    graphics.fillStyle(0x000000, 0.15);
    graphics.fillRoundedRect(x - width/2 + 3, y - height/2 + 3, width, height, radius);
    
    // 버튼 본체 (Container 내부 좌표 기준)
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(x - width/2, y - height/2, width, height, radius);
    
    // 하이라이트
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.strokeRoundedRect(x - width/2, y - height/2, width, height, radius);
    
    return graphics;
  }
}
