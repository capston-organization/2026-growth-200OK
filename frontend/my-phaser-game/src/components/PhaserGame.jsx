import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MenuScene from '../scenes/MenuScene';
import TteokGameScene from '../scenes/TteokGameScene';
import ShortAnswerScene from '../scenes/ShortAnswerScene';
import MultipleChoiceScene from '../scenes/MultipleChoiceScene';

const PhaserGame = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'phaser-game',
      backgroundColor: '#1a1a1a',
      scene: [MenuScene, TteokGameScene, ShortAnswerScene, MultipleChoiceScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameRef.current = new Phaser.Game(config);

    // 윈도우 리사이즈 시 게임 크기 조정
    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  return <div id="phaser-game" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }} />;
};

export default PhaserGame;
