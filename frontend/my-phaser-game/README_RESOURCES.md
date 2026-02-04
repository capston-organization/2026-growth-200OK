# 떡 만들기 게임 리소스 가이드

## 필요한 이미지 파일

다음 이미지 파일들을 `public/assets/images/` 폴더에 추가하세요:

1. **떡.png** - 기본 떡 이미지 (약 200x150px 권장)
2. **떡_찟힌.png** - 찟힌 떡 이미지 (약 200x100px 권장, 납작한 모양)
3. **망치.png** - 망치 이미지 (약 100x120px 권장)
4. **물.png** 또는 **물_효과.png** - 물 효과 이미지 (투명 배경 권장)

## 필요한 사운드 파일

다음 사운드 파일들을 `public/assets/sounds/` 폴더에 추가하세요:

1. **drum.mp3** - 드럼 소리 (1초마다 재생)
2. **hit.mp3** - 떡 찟는 소리
3. **water.mp3** - 물 묻히는 소리
4. **one.mp3** - "원" 음성
5. **two.mp3** - "투" 음성
6. **three.mp3** - "쓰리" 음성
7. **four.mp3** - "포" 음성

## 리소스 추가 후 설정

리소스 파일을 추가한 후, `src/scenes/TteokGameScene.js` 파일의 `preload()` 메서드에서 주석 처리된 부분을 해제하고 경로를 확인하세요:

```javascript
preload() {
  // 이미지 로드
  this.load.image('tteok', '/assets/images/떡.png');
  this.load.image('tteok_hit', '/assets/images/떡_찟힌.png');
  this.load.image('hammer', '/assets/images/망치.png');
  this.load.image('water', '/assets/images/물.png');

  // 사운드 로드
  this.load.audio('drum', '/assets/sounds/drum.mp3');
  this.load.audio('hit', '/assets/sounds/hit.mp3');
  this.load.audio('water', '/assets/sounds/water.mp3');
  this.load.audio('one', '/assets/sounds/one.mp3');
  this.load.audio('two', '/assets/sounds/two.mp3');
  this.load.audio('three', '/assets/sounds/three.mp3');
  this.load.audio('four', '/assets/sounds/four.mp3');
}
```

## 임시 리소스 없이 테스트

리소스 파일이 없어도 게임은 작동합니다. 현재는:
- 떡, 망치, 물 효과가 색상 박스와 텍스트로 표시됩니다
- 사운드는 Web Audio API로 생성된 간단한 효과음이 재생됩니다

리소스를 추가하면 더 풍부한 게임 경험을 제공할 수 있습니다.
