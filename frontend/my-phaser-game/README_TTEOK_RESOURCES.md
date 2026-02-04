# 떡 만들기 게임 리소스 가이드

## 필요한 이미지 파일

다음 이미지 파일들을 `public/assets/images/` 폴더에 추가하세요:

### 사람 캐릭터
1. **person_hammer_stand.png** - 망치를 들고 서있는 사람 (약 150x200px 권장)
2. **person_hammer_hit.png** - 망치로 떡을 내려치는 사람 (약 150x200px 권장)
3. **person_water_stand.png** - 물을 들고 있는 사람 (약 150x200px 권장)
4. **person_water_splash.png** - 물을 뿌려주는 사람 (약 150x200px 권장)

### 절구와 떡
5. **mortar.png** - 절구 (약 300x250px 권장)
6. **tteok_in_mortar.png** - 절구 안에 있는 떡 (약 250x150px 권장)
7. **tteok_hit_in_mortar.png** - 절구 안에 찟힌 떡 (약 250x100px 권장, 납작한 모양)

## 필요한 사운드 파일

다음 사운드 파일들을 `public/assets/sounds/` 폴더에 추가하세요:

1. **drum.mp3** - 드럼 소리 (1초마다 재생되는 리듬)
2. **hammer_hit.mp3** - 망치로 떡을 찟는 소리
3. **water_splash.mp3** - 물을 뿌리는 소리
4. **one.mp3** - "원" 음성
5. **two.mp3** - "투" 음성
6. **three.mp3** - "쓰리" 음성
7. **four.mp3** - "포" 음성

## 리소스 추가 후 설정

리소스 파일을 추가한 후, `src/scenes/TteokGameScene.js` 파일의 `preload()` 메서드에서 주석 처리된 부분을 해제하고 경로를 확인하세요:

```javascript
preload() {
  // 사람 캐릭터 이미지
  this.load.image('person_hammer_stand', '/assets/images/person_hammer_stand.png');
  this.load.image('person_hammer_hit', '/assets/images/person_hammer_hit.png');
  this.load.image('person_water_stand', '/assets/images/person_water_stand.png');
  this.load.image('person_water_splash', '/assets/images/person_water_splash.png');
  
  // 절구와 떡 이미지
  this.load.image('mortar', '/assets/images/mortar.png');
  this.load.image('tteok_in_mortar', '/assets/images/tteok_in_mortar.png');
  this.load.image('tteok_hit_in_mortar', '/assets/images/tteok_hit_in_mortar.png');

  // 사운드
  this.load.audio('drum', '/assets/sounds/drum.mp3');
  this.load.audio('hammer_hit', '/assets/sounds/hammer_hit.mp3');
  this.load.audio('water_splash', '/assets/sounds/water_splash.mp3');
  this.load.audio('one', '/assets/sounds/one.mp3');
  this.load.audio('two', '/assets/sounds/two.mp3');
  this.load.audio('three', '/assets/sounds/three.mp3');
  this.load.audio('four', '/assets/sounds/four.mp3');
}
```

## 임시 리소스 없이 테스트

리소스 파일이 없어도 게임은 작동합니다. 현재는:
- 사람 캐릭터가 색상 박스와 텍스트로 표시됩니다
- 절구와 떡이 색상 박스로 표시됩니다
- 사운드는 Web Audio API로 생성된 간단한 효과음이 재생됩니다

리소스를 추가하면 더 풍부한 게임 경험을 제공할 수 있습니다.
