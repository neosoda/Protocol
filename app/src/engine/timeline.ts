import type { ProtocolScenario } from '../protocols/model.ts';

export type Speed = 0.5 | 1 | 1.5 | 2;
export interface TimelineState { protocolId: string; index: number; playing: boolean; speed: Speed }
export type TimelineAction =
  | { type: 'NEXT' } | { type: 'PREVIOUS' } | { type: 'RESET' } | { type: 'TOGGLE' }
  | { type: 'PAUSE' } | { type: 'SELECT'; index: number }
  | { type: 'SPEED'; speed: Speed };

export function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index) || !Number.isInteger(index) || length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index));
}

export function transition(state: TimelineState, action: TimelineAction, count: number): TimelineState {
  const last = Math.max(0, count - 1);
  switch (action.type) {
    case 'NEXT': return { ...state, index: Math.min(last, state.index + 1), playing: false };
    case 'PREVIOUS': return { ...state, index: Math.max(0, state.index - 1), playing: false };
    case 'RESET': return { ...state, index: 0, playing: false };
    case 'PAUSE': return { ...state, playing: false };
    case 'SELECT': return { ...state, index: clampIndex(action.index, count), playing: false };
    case 'SPEED': return { ...state, speed: action.speed };
    case 'TOGGLE': return { ...state, index: state.index >= last ? 0 : state.index, playing: !state.playing && count > 1 };
  }
}

export interface Timeline {
  getState(): TimelineState;
  dispatch(action: TimelineAction): void;
  setProtocol(protocol: ProtocolScenario, startIndex?: number): void;
  dispose(): void;
}

export function createTimeline(
  initial: ProtocolScenario,
  notify: (state: TimelineState) => void,
  periodMs = 1800
): Timeline {
  let protocol = initial;
  let state: TimelineState = { protocolId: initial.id, index: 0, playing: false, speed: 1 };
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => { if (timer !== undefined) clearInterval(timer); timer = undefined; };
  const publish = () => notify({ ...state });
  const tick = () => {
    if (state.index >= protocol.events.length - 1) {
      state = { ...state, playing: false }; stop(); publish(); return;
    }
    state = { ...state, index: state.index + 1 };
    if (state.index >= protocol.events.length - 1) { state = { ...state, playing: false }; stop(); }
    publish();
  };
  const schedule = () => {
    stop();
    if (state.playing) timer = setInterval(tick, Math.max(100, periodMs / state.speed));
  };
  return {
    getState: () => ({ ...state }),
    dispatch(action) {
      state = transition(state, action, protocol.events.length);
      schedule(); publish();
    },
    setProtocol(next, startIndex = 0) {
      protocol = next;
      state = { ...state, protocolId: next.id, index: clampIndex(startIndex, next.events.length), playing: false };
      schedule(); publish();
    },
    dispose: stop
  };
}
