/**
 * Quiz Game — entry point
 */
import { createApp } from '@lucid/engine';
import { MenuScene } from './scenes/menu.js';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const app = createApp({ platform: 'web', canvas, debug: true });

app.router.push(new MenuScene(app));
app.start();

(window as any)._app = app;
