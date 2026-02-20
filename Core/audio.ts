import { Howl } from 'howler';

const hover = new Howl({ src: ['Sfx/Sounds/Click_Mid.wav'], volume: 0.28 });
const open = new Howl({ src: ['Sfx/Sounds/Glitch_10.wav'], volume: 0.2 });

export const playHover = () => hover.play();
export const playOpen = () => open.play();
