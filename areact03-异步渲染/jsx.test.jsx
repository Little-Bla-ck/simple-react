import { describe, it, expect } from 'vitest';
import AReact from './AReact';
import { resolve } from 'upath';

describe('AReact async', () => {
  it('it should render jsx', async () => {
    const container = document.createElement('div');
    const element = <div id='foo'>
      <div id='bar'>Hello</div>
      <button>Add</button>
    </div>
  
    const root = AReact.createRoot(container);
    root.render(element);
    expect(container.innerHTML).toBe('');
    await sleep(1000);
    expect(container.innerHTML).toBe(`<div id="foo"><div id="bar">Hello</div><button>Add</button></div>`);
  });
})

describe('AReact async', () => {
  it('it should render jsx', async () => {
    const container = document.createElement('div');
    const element = <div id='foo'>
      <div id='bar'>Hello</div>
      <button>Add</button>
    </div>
  
    const root = AReact.createRoot(container);
    await AReact.act(() => {
      root.render(element);
      expect(container.innerHTML).toBe('');
    })
    expect(container.innerHTML).toBe(`<div id="foo"><div id="bar">Hello</div><button>Add</button></div>`);
  });
})

function sleep(time) {
  return new Promise(resolve => {
    window.setTimeout(resolve, time)
  })
}