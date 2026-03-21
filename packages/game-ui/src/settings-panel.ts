import { UINode } from '@lucid/core';
import { Modal, Toggle, Button, Label, UIColors } from '@lucid/ui';

export interface SettingsPanelProps {
  toggles: Array<{ id: string; label: string; value: boolean }>;
  links?: Array<{ id: string; label: string }>;
  version?: string;
}

export class SettingsPanel extends Modal {
  private _version?: string;

  constructor(props: SettingsPanelProps) {
    const pw = 280;
    super({ title: '设置', id: 'settings', width: pw, height: 200, screenWidth: 390, screenHeight: 844 });
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
