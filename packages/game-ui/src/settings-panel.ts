import { UINode } from '@lucid/core';
import { Modal, Toggle, Button, Label } from '@lucid/ui';

export interface SettingsPanelProps {
  toggles: Array<{ id: string; label: string; value: boolean }>;
  links?: Array<{ id: string; label: string }>;
  version?: string;
}

export class SettingsPanel extends Modal {
  private _version?: string;

  constructor(props: SettingsPanelProps) {
    super({ title: '设置', id: 'settings', width: 280, height: 320, screenWidth: 390, screenHeight: 844 });
    this._version = props.version;

    let y = 0;

    for (const t of props.toggles) {
      const toggle = new Toggle({ id: `toggle-${t.id}`, label: t.label, value: t.value, width: 220, height: 32 });
      toggle.x = 15;
      toggle.y = y;
      toggle.$on('change', (val: boolean) => this.$emit('toggle', t.id, val));
      this.content.addChild(toggle);
      y += 44;
    }

    if (props.links) {
      y += 8;
      for (const link of props.links) {
        const btn = new Button({ id: `link-${link.id}`, text: link.label, variant: 'ghost', width: 200, height: 36 });
        btn.x = 25;
        btn.y = y;
        btn.$on('tap', () => this.$emit('link', link.id));
        this.content.addChild(btn);
        y += 42;
      }
    }

    if (props.version) {
      const vLabel = new Label({ id: 'version', text: props.version, fontSize: 11, color: 'rgba(255,255,255,0.25)', align: 'center', width: 240, height: 20 });
      vLabel.x = 5;
      vLabel.y = y + 10;
      this.content.addChild(vLabel);
    }

    this.open();
  }

  $inspect(depth?: number): string {
    let out = super.$inspect(depth);
    if (this._version) {
      const lines = out.split('\n');
      lines[0] += ` ${this._version}`;
      out = lines.join('\n');
    }
    return out;
  }
}
