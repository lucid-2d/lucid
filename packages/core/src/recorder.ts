/**
 * 交互录制器 — debug 模式下记录用户操作轨迹
 *
 * 环形缓冲区，固定容量，超出丢弃最旧的记录。
 * debug=false 时零开销（record 方法直接 return）。
 */

export interface InteractionRecord {
  /** 毫秒时间戳（相对于录制开始） */
  t: number;
  /** 事件类型 */
  type: 'touchstart' | 'touchend' | 'touchmove';
  /** 世界坐标 */
  x: number;
  y: number;
  /** hitTest 命中的节点路径 */
  path: string;
  /** 命中节点触发的语义事件 */
  action?: string;
  /** 命中节点的 $inspect(0) 快照 */
  snapshot?: string;
}

export interface RecorderOptions {
  enabled: boolean;
  /** 环形缓冲区容量，默认 500 */
  capacity?: number;
}

export class InteractionRecorder {
  enabled: boolean;
  private _buffer: InteractionRecord[];
  private _capacity: number;
  private _head = 0;   // 下一个写入位置
  private _size = 0;   // 当前记录数

  constructor(opts: RecorderOptions) {
    this.enabled = opts.enabled;
    this._capacity = opts.capacity ?? 500;
    this._buffer = new Array(this._capacity);
  }

  /** 记录一条交互。debug=false 时直接跳过。 */
  record(rec: InteractionRecord): void {
    if (!this.enabled) return;

    this._buffer[this._head] = rec;
    this._head = (this._head + 1) % this._capacity;
    if (this._size < this._capacity) this._size++;
  }

  /** 导出所有记录（按时间顺序） */
  dump(): InteractionRecord[] {
    if (this._size === 0) return [];

    const result: InteractionRecord[] = [];
    // 环形缓冲区：从最旧的开始读
    const start = this._size < this._capacity ? 0 : this._head;
    for (let i = 0; i < this._size; i++) {
      const idx = (start + i) % this._capacity;
      result.push(this._buffer[idx]);
    }
    return result;
  }

  /** 清空缓冲区 */
  clear(): void {
    this._head = 0;
    this._size = 0;
  }
}
