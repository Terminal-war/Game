import { Howl } from 'howler';

import clickSfx from '../Sfx/Sounds/Click.wav';
import glitchSfx from '../Sfx/Sounds/Glitch_2.wav';

const hover = new Howl({ src: [clickSfx], volume: 0.28 });
const open = new Howl({ src: [glitchSfx], volume: 0.2 });

export const playHover = () => hover.play();
export const playOpen = () => open.play();
