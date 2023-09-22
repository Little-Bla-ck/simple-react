import { describe, it, expect } from 'vitest';
import AReact from './AReact';

describe('AReact JSX', () => {
  it('it should render jsx', () => {
    const container = document.createElement('div');
    const element = <div id='foo'>
      <div id='bar'>Hello</div>
      <button>Add</button>
    </div>
  
    const root = AReact.createRoot(container);
    root.render(element);
    
    expect(container.innerHTML).toBe(`<div id="foo"><div id="bar">Hello</div><button>Add</button></div>`);
  });

  it('it should jsx with different props', () => {
    const container = document.createElement('div');
    const element = <div id='foo' className="bar">
      <div id="bar">Hello</div>
      <button>Add</button>
    </div>
  
    const root = AReact.createRoot(container);
    root.render(element);
    
    expect(container.innerHTML).toBe(`<div id="foo" class="bar"><div id="bar">Hello</div><button>Add</button></div>`);
  })
});
