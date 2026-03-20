/**
 * SeededRNG — 可播种的伪随机数生成器
 *
 * 使用 Mulberry32 算法，给定相同 seed 产生完全相同的随机序列。
 * 录制时记录 seed → 回放时恢复 seed → 随机数序列完全一致。
 *
 * 用法：
 *   const rng = new SeededRNG(42);
 *   rng.next();          // 0~1
 *   rng.int(1, 6);       // 1~6 整数
 *   rng.pick(['a','b']); // 随机选一个
 *   rng.shuffle([1,2,3]);// 洗牌
 */

export class SeededRNG {
  readonly seed: number;
  private _state: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647) + 1;
    this._state = this.seed;
  }

  /** 返回 [0, 1) 的伪随机浮点数 */
  next(): number {
    // Mulberry32
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** 返回 [min, max] 的随机整数 */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** 从数组中随机选一个元素 */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Fisher-Yates 洗牌（返回新数组，不修改原数组） */
  shuffle<T>(arr: readonly T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /** 创建子 RNG（确定性派生，用于隔离不同系统的随机序列） */
  fork(): SeededRNG {
    return new SeededRNG(Math.floor(this.next() * 2147483647) + 1);
  }
}
