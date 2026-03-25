/**
 * PauseModal — 标准暂停弹窗
 *
 * 按钮撑满宽度、一致的间距和样式。
 * gameplay 模板内部使用此组件，也可独立使用。
 *
 * ## Node IDs
 * - `pause-modal` — 弹窗根节点
 * - `resume` — 继续游戏
 * - `restart` — 重新开始
 * - `home` — 返回主页
 * - `pause-settings` — 设置（可选）
 * - `quit` — 放弃（可选）
 *
 * ## Events
 * - `resume` — 点击继续
 */

import { Modal, Button, UIColors } from '@lucid-2d/ui';
import { SettingsPanel, type SettingsPanelProps } from './settings-panel.js';
import type { UINode } from '@lucid-2d/core';

export interface PauseSettingsConfig {
  toggles: Array<{ id: string; label: string; value: boolean }>;
  links?: Array<{ id: string; label: string }>;
  version?: string;
  onToggle: (id: string, value: boolean) => void;
  onLink?: (id: string) => void;
}

export interface PauseModalProps {
  resume: () => void;
  restart: () => void;
  home: () => void;
  settings?: PauseSettingsConfig;
  quit?: () => void;
  screenWidth?: number;
  screenHeight?: number;
}

export class PauseModal extends Modal {
  private _settingsOwner: UINode | null = null;

  constructor(props: PauseModalProps) {
    const sw = props.screenWidth ?? 390;
    const sh = props.screenHeight ?? 844;
    const pw = Math.min(sw - 40, 280);
    super({
      title: '暂停',
      id: 'pause-modal',
      width: pw,
      height: 300,
      screenWidth: sw,
      screenHeight: sh,
    });

    const btnW = pw - 48;
    const btnX = 24;
    let y = 0;

    // Resume
    const resumeBtn = new Button({
      id: 'resume',
      text: '继续游戏',
      variant: 'primary',
      width: btnW,
      height: 48,
    });
    resumeBtn.x = btnX;
    resumeBtn.y = y;
    resumeBtn.$on('tap', () => {
      props.resume();
      this.$emit('resume');
    });
    this.content.addChild(resumeBtn);
    y += 60;

    // Restart
    const restartBtn = new Button({
      id: 'restart',
      text: '再来一局',
      variant: 'secondary',
      width: btnW,
      height: 48,
    });
    restartBtn.x = btnX;
    restartBtn.y = y;
    restartBtn.$on('tap', () => props.restart());
    this.content.addChild(restartBtn);
    y += 60;

    // Home
    const homeBtn = new Button({
      id: 'home',
      text: '返回主页',
      variant: 'secondary',
      width: btnW,
      height: 48,
    });
    homeBtn.x = btnX;
    homeBtn.y = y;
    homeBtn.$on('tap', () => props.home());
    this.content.addChild(homeBtn);
    y += 60;

    // Settings
    if (props.settings) {
      const settingsBtn = new Button({
        id: 'pause-settings',
        text: '设置',
        variant: 'ghost',
        width: btnW,
        height: 44,
      });
      settingsBtn.x = btnX;
      settingsBtn.y = y;
      settingsBtn.$on('tap', () => this._openSettings(props.settings!));
      this.content.addChild(settingsBtn);
      y += 52;
    }

    // Quit
    if (props.quit) {
      const quitBtn = new Button({
        id: 'quit',
        text: '放弃',
        variant: 'danger',
        width: btnW,
        height: 44,
      });
      quitBtn.x = btnX;
      quitBtn.y = y;
      quitBtn.$on('tap', () => props.quit!());
      this.content.addChild(quitBtn);
    }

    this.fitContent();
  }

  /** Attach to a parent node for settings panel management */
  attachTo(owner: UINode): void {
    this._settingsOwner = owner;
  }

  private _openSettings(config: PauseSettingsConfig): void {
    const owner = this._settingsOwner ?? this.$parent;
    if (!owner) return;
    const existing = owner.findById('settings-modal');
    if (existing) { owner.removeChild(existing); return; }
    const panel = new SettingsPanel({
      toggles: config.toggles,
      links: config.links,
      version: config.version,
      screenWidth: (this as any)._screenW,
      screenHeight: (this as any)._screenH,
    });
    panel.id = 'settings-modal';
    panel.$on('toggle', (id: string, val: boolean) => config.onToggle(id, val));
    if (config.onLink) panel.$on('link', (id: string) => config.onLink!(id));
    panel.$on('close', () => owner.removeChild(panel));
    owner.addChild(panel);
  }
}
