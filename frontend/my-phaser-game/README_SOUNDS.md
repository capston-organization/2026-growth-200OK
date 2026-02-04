# 떡 만들기 게임 사운드 파일 가이드

## 사운드 파일이 필요한 이유

원투쓰리포 소리가 나지 않는 이유는 사운드 파일이 아직 로드되지 않았기 때문입니다.

현재 코드에서는 사운드 파일이 없으면 Web Audio API로 간단한 드럼 소리만 생성하지만, "원", "투", "쓰리", "포" 음성은 사운드 파일이 필요합니다.

## 필요한 사운드 파일

다음 사운드 파일들을 `public/assets/sounds/` 폴더에 추가하세요:

1. **drum.mp3** - 드럼 소리 (1초마다 재생)
2. **hammer_hit.mp3** - 망치로 떡을 찟는 소리
3. **water_splash.mp3** - 물을 뿌리는 소리
4. **one.mp3** - "원" 음성
5. **two.mp3** - "투" 음성
6. **three.mp3** - "쓰리" 음성
7. **four.mp3** - "포" 음성

## 사운드 파일 추가 방법

1. `public/assets/sounds/` 폴더를 생성하세요 (없는 경우)
2. 위의 사운드 파일들을 해당 폴더에 추가하세요
3. `src/scenes/TteokGameScene.js` 파일의 `preload()` 메서드에서 주석을 해제하세요:

```javascript
preload() {
  // ... 이미지 로드 코드 ...
  
  // 사운드 로드 - 아래 주석을 해제하세요
  this.load.audio('drum', '/assets/sounds/drum.mp3');
  this.load.audio('hammer_hit', '/assets/sounds/hammer_hit.mp3');
  this.load.audio('water_splash', '/assets/sounds/water_splash.mp3');
  this.load.audio('one', '/assets/sounds/one.mp3');
  this.load.audio('two', '/assets/sounds/two.mp3');
  this.load.audio('three', '/assets/sounds/three.mp3');
  this.load.audio('four', '/assets/sounds/four.mp3');
}
```

## 사운드 파일 없이 테스트

사운드 파일이 없어도 게임은 작동합니다:
- 드럼 소리는 Web Audio API로 생성된 간단한 소리가 재생됩니다
- 망치/물 효과음도 Web Audio API로 생성됩니다
- 하지만 "원투쓰리포" 음성은 사운드 파일이 없으면 재생되지 않습니다

## 사운드 파일 형식

- **권장 형식**: MP3 또는 OGG
- **권장 길이**: 
  - 드럼/효과음: 0.1~0.5초
  - 원투쓰리포 음성: 0.5~1초
- **권장 품질**: 128kbps 이상
