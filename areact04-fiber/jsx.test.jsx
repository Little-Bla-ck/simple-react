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
    await AReact.act(() => {
      root.render(element);
      expect(container.innerHTML).toBe('');
    });
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

describe('AReact async', () => {
  it('it should render function component', async () => {
    const container = document.createElement('div');
    function App() {
      return (
        <div id='foo'>
          <div id='bar'>Hello</div>
          <button>Add</button>
        </div>
      )
    } 
  
    const root = AReact.createRoot(container);
    await AReact.act(() => {
      root.render(<App />);
      expect(container.innerHTML).toBe('');
    })
    expect(container.innerHTML).toBe(`<div id="foo"><div id="bar">Hello</div><button>Add</button></div>`);
  });
})

describe('AReact async', () => {
  it('it should render nested function component', async () => {
    const container = document.createElement('div');
    function App(props) {
      return (
        <div id='foo'>
          <div id='bar'>{props.title}</div>
          <button>Add</button>
          {props.children}
        </div>
      )
    }
  
    const root = AReact.createRoot(container);
    await AReact.act(() => {
      root.render(
        <App title="main title">
          <App title="sub title" />
        </App>  
      );
      expect(container.innerHTML).toBe('');
    })
    expect(container.innerHTML).toBe(`<div id="foo"><div id="bar">main title</div><button>Add</button><div id="foo"><div id="bar">sub title</div><button>Add</button></div></div>`);
  });
})