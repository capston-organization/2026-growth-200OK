// UI 헬퍼 함수들
export class UIHelpers {
  // 그라데이션 배경 생성
  static createGradientBackground(scene, color1, color2, width, height) {
    const graphics = scene.add.graphics();
    
    // 그라데이션 효과를 위해 여러 레이어 사용
    graphics.fillGradientStyle(color1, color1, color2, color2, 1);
    graphics.fillRect(0, 0, width, height);
    
    return graphics;
  }

  // 둥근 모서리 버튼 생성
  static createRoundedButton(scene, x, y, width, height, color, radius = 20) {
    const graphics = scene.add.graphics();
    
    // 그림자
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillRoundedRect(x + 3, y + 3, width, height, radius);
    
    // 버튼 본체
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(x, y, width, height, radius);
    
    // 하이라이트
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.strokeRoundedRect(x, y, width, height, radius);
    
    return graphics;
  }

  // 텍스트에 그림자 효과 추가
  static createTextWithShadow(scene, x, y, text, style) {
    const shadowStyle = { ...style };
    shadowStyle.fill = '#000000';
    shadowStyle.alpha = 0.5;
    
    const shadow = scene.add.text(x + 3, y + 3, text, shadowStyle);
    const mainText = scene.add.text(x, y, text, style);
    
    return { shadow, main: mainText };
  }

  // 카드 스타일 컨테이너 생성
  static createCard(scene, x, y, width, height, color = 0xffffff) {
    const graphics = scene.add.graphics();
    
    // 그림자
    graphics.fillStyle(0x000000, 0.2);
    graphics.fillRoundedRect(x + 5, y + 5, width, height, 15);
    
    // 카드 본체
    graphics.fillStyle(color, 0.95);
    graphics.fillRoundedRect(x, y, width, height, 15);
    
    // 테두리
    graphics.lineStyle(2, 0xffffff, 0.1);
    graphics.strokeRoundedRect(x, y, width, height, 15);
    
    return graphics;
  }

  // 파티클 효과 생성
  static createParticles(scene, x, y, color, count = 20) {
    const particles = scene.add.particles(x, y, 'particle', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      tint: color,
      emitting: false
    });
    
    return particles;
  }

  // 버튼 호버 애니메이션
  static addButtonHoverAnimation(button, text, scale = 1.1) {
    button.on('pointerover', () => {
      scene.tweens.add({
        targets: [button, text],
        scaleX: scale,
        scaleY: scale,
        duration: 150,
        ease: 'Back.easeOut'
      });
    });
    
    button.on('pointerout', () => {
      scene.tweens.add({
        targets: [button, text],
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeIn'
      });
    });
  }
}
