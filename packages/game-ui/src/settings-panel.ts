import { UINode } from '@lucid-2d/core';
import { Modal, Toggle, Button, Label, UIColors } from '@lucid-2d/ui';

export interface SettingsPanelProps {
  toggles: Array<{ id: string; label: string; value: boolean }>;
  links?: Array<{ id: string; label: string }>;
  version?: string;
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * SettingsPanel — 设置面板
 *
 * ## Node IDs (stable, for testing)
 * - `settings` — 面板根节点
 * - `version` — 版本号标签
 * - `toggle-{id}` — 开关控件（id 来自 props.toggles[].id）
 * - `link-{id}` — 链接按钮（id 来自 props.links[].id）
 *
 * ## Events
 * - `toggle(id, value)` — 切换开关，id 为开关标识，value 为新布尔值
 * - `link(id)` — 点击链接按钮，id 为链接标识
 *
 * ## Testing
 * ```ts
 * tap(app, 'toggle-sound');  // 切换音效 → toggle('sound', newValue)
 * tap(app, 'link-privacy');  // 点击隐私链接 → link('privacy')
 * ```
 */
export class SettingsPanel extends Modal {
  private _version?: string;

  constructor(props: SettingsPanelProps) {
    const pw = 280;
    super({ title: '设置', id: 'settings', width: pw, height: 200, screenWidth: props.screenWidth ?? 390, screenHeight: props.screenHeight ?? 844 });
    this._version = props.version;

    const toggleW = 220;
    const toggleX = (pw - toggleW) / 2;
    let y = 0;

    for (const t of props.toggles) {
      const toggle = new Toggle({ id: `toggle-${t.id}`, label: t.label, value: t.value, width: toggleW, height: 32 });
      toggle.x = toggleX;
      toggle.y = y;
      toggle.$on('change', (val: boolean) => this.$emit('toggle', t.id, val));
      this.content.addChild(toggle);
      y += 44;
    }

    if (props.links) {
      y += 8;
      const linkW = 200;
      const linkX = (pw - linkW) / 2;
      for (const link of props.links) {
        const btn = new Button({ id: `link-${link.id}`, text: link.label, variant: 'ghost', width: linkW, height: 36 });
        btn.x = linkX;
        btn.y = y;
        btn.$on('tap', () => this.$emit('link', link.id));
        this.content.addChild(btn);
        y += 42;
      }
    }

    if (props.version) {
      const vLabelW = 240;
      const vLabel = new Label({ id: 'version', text: props.version, fontSize: 11, color: UIColors.textHint, align: 'center', width: vLabelW, height: 20 });
      vLabel.x = (pw - vLabelW) / 2;
      vLabel.y = y + 10;
      this.content.addChild(vLabel);
    }

    this.fitContent();
    this.open();
  }

  protected $inspectInfo(): string {
    return this._version ?? '';
  }
}
