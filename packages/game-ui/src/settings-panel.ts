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
    super({ title: '设置', id: 'settings', width: 300, height: 400 });
    this._version = props.version;

    // Toggles
    for (const t of props.toggles) {
      const toggle = new Toggle({ id: `toggle-${t.id}`, label: t.label, value: t.value, width: 200, height: 32 });
      toggle.$on('change', (val: boolean) => {
        this.$emit('toggle', t.id, val);
      });
      this.content.addChild(toggle);
    }

    // Links
    if (props.links) {
      for (const link of props.links) {
        const btn = new Button({ id: `link-${link.id}`, text: link.label, variant: 'ghost', width: 200, height: 36 });
        btn.$on('tap', () => {
          this.$emit('link', link.id);
        });
        this.content.addChild(btn);
      }
    }

    // Version
    if (props.version) {
      const vLabel = new Label({ id: 'version', text: props.version, fontSize: 12, color: 'rgba(255,255,255,0.3)', align: 'center' });
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
