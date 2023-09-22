import { describe, it, expect, vi } from 'vitest';
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

describe('hooks', () => {
  it('should support useState', async () => {
    const container = document.createElement('div');
    
    const globalObj = {};
    function App() {
      const [count, setCount] = AReact.useState(100);
      globalObj.count = count;
      globalObj.setCount = setCount;

      return <div>{count}</div>
    }

    const root = AReact.createRoot(container);
    await AReact.act(() => {
      root.render(<App/>);
    })
    await AReact.act(() => {
      globalObj.setCount((count) => count + 1);
    })
    expect(globalObj.count).toBe(101);
    await AReact.act(() => {
      globalObj.setCount((count) => count + 1);
    })
    expect(globalObj.count).toBe(102);
  });
});

describe('hooks', () => {
  it('should support useReducer', async () => {
    const container = document.createElement('div');
    
    const globalObj = {};

    function reducer(state, action) {
      switch(action.type) {
        case 'add': return state + 1;
        case 'sub': return state - 1;
      }
    }

    function App() {
      const [count, dispatch] = AReact.useReducer(reducer, 100);
      globalObj.count = count;
      globalObj.dispatch = dispatch;

      return <div>{count}</div>
    }

    const root = AReact.createRoot(container);
    await AReact.act(() => {
      root.render(<App/>);
    })
    await AReact.act(() => {
      globalObj.dispatch({type: 'add'});
    })
    expect(globalObj.count).toBe(101);
    await AReact.act(() => {
      globalObj.dispatch({type: 'add'});
    })
    expect(globalObj.count).toBe(102);
  });
});

describe('event binding', () => {
  it('should event', async () => {
    const container = document.createElement('div');
    
    const globalObj = {
      increase: (count) => count + 1
    };

    const increaseSpy = vi.spyOn(globalObj, 'increase');

    function App() {
      const [count, setCount] = AReact.useState(100);
      globalObj.count = count;
      globalObj.setCount = setCount;

      return <div>
        <div>{count}</div>
        <button onClick={() => setCount(globalObj.increase)}></button>
      </div>
    }

    const root = AReact.createRoot(container);
    await AReact.act(() => {
      root.render(<App/>);
    })
    expect(increaseSpy).not.toBeCalled();
    await AReact.act(() => {
      container.querySelectorAll('button')[0].click();
      container.querySelectorAll('button')[0].click();
    })
    expect(increaseSpy).toBeCalledTimes(2);
  })
})

describe('reconciler', () => {
  it('should support DOM CRUD', async () => {
    const container = document.createElement('div');

    function App() {
      const [count, setCount] = AReact.useState(2);
      return <div>
        <div>{count}</div>
        <button onClick={() => setCount((count) => count + 1)}>+</button>
        <button onClick={() => setCount((count) => count - 1)}>-</button>
        <ul>
          {Array(count).fill(1).map((val, index) => (
            <li key={index}>{val}</li>
          ))}
        </ul>
      </div>
    }

    const root = AReact.createRoot(container);
    await AReact.act(() => {
      root.render(<App/>);
    })
    await AReact.act(() => {
      console.log('container.innerHTML', container.innerHTML);
      container.querySelectorAll('button')[0].click();
    })
    expect(container.innerHTML).toBe('<div><div>3</div><button>+</button><button>-</button><ul><li>1</li><li>1</li><li>1</li></ul></div>');
    await AReact.act(() => {
      container.querySelectorAll('button')[0].click();
    })
    expect(container.innerHTML).toBe('<div><div>4</div><button>+</button><button>-</button><ul><li>1</li><li>1</li><li>1</li><li>1</li></ul></div>');
    await AReact.act(() => {
      container.querySelectorAll('button')[1].click();
    })
    expect(container.innerHTML).toBe('<div><div>3</div><button>+</button><button>-</button><ul><li>1</li><li>1</li><li>1</li></ul></div>');
    await AReact.act(() => {
      container.querySelectorAll('button')[1].click();
      container.querySelectorAll('button')[1].click();
    })
    expect(container.innerHTML).toBe('<div><div>1</div><button>+</button><button>-</button><ul><li>1</li></ul></div>');
  })
})