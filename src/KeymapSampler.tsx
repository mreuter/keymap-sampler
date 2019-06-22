import * as React from 'react';
import locale2 from 'locale2';
import { UAParser } from 'ua-parser-js';
import ReactJson from 'react-json-view';

const ua = new UAParser(navigator.userAgent);

interface Key {
  unmodified: string;
  keyCode: number;
  withShift?: string;
  withAltGraph?: string;
  withShiftAltGraph?: string;
}
interface Keymap {
  [code:string]: Key;
}
interface KeyboardLayout {
  name: string;
  keymap: Keymap;
}

let layout: KeyboardLayout = {
  name: `${locale2}-${ua.getBrowser().name}-${ua.getOS().name}`.toLocaleLowerCase(),
  keymap: {},
};

const init = (eventSource: EventTarget, handler: (event: Event) => void) => {
  eventSource.addEventListener('keydown', handler);

  return () => {
    eventSource.removeEventListener('keydown', handler);
  }
};

const keyState = (event: KeyboardEvent, shift: boolean, alt: boolean) => (
  !event.ctrlKey && !event.metaKey && (event.shiftKey === shift) && (event.altKey === alt)
);

const optimizeKey = (key: Key) => {
  const result = key;
  if (result.withShift === result.unmodified) delete result.withShift;
  if (result.withAltGraph === result.unmodified) delete result.withAltGraph;
  if (result.withShiftAltGraph === result.unmodified) delete result.withShiftAltGraph;
  return result;
};

export const KeymapSampler = () => {
  const [state, setState] = React.useState(layout);

  const handler = React.useCallback((event: Event) => {
    event.preventDefault();

    if (!(event instanceof KeyboardEvent)) return;
    if (event.repeat) return;

    setState(prevState => ({
      ...prevState,
      keymap: {
        ...prevState.keymap,
        [event.code]: optimizeKey({
          keyCode: event.keyCode,
          ...(prevState.keymap[event.code] || { unmodified: event.key }),
          ...(keyState(event, false, false) ? { unmodified: event.key } : {}),
          ...(keyState(event, true, false) ? { withShift: event.key } : {}),
          ...(keyState(event, false, true) ? { withAltGraph: event.key } : {}),
          ...(keyState(event, true, true) ? { withShiftAltGraph: event.key } : {}),
        })
      }
    }))
  }, []);

  React.useEffect(() => init(window, handler), [handler]);

  return (
    <ReactJson src={state} />
  )
};
