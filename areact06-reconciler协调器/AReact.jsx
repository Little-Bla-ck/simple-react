import { resolve } from 'upath';
import '../requestIdleCallback';

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.flat().map(child => {
        return typeof child !== 'object' ? createTextElement(child) : child;
      })
    }
  }
}

function createTextElement(text) {
  return {
    type: 'HostText',
    props: {
      nodeValue: text,
      children: []
    }
  }
}

let workInProgress = null;
let workInProgressRoot = null;
let currentHookFiber = null;
let currentHookIndex = 0;

function performUnitOfWork(fiber) {
  // 处理当前fiber: 创建DOM， 设置props, 插入当前dom到parent

  const ifIsFunctionComponent = fiber.type instanceof Function;
  if (ifIsFunctionComponent) {
    currentHookFiber = fiber;
    currentHookFiber.memoriedState = [];
    currentHookIndex = 0;
    fiber.props.children = [fiber.type(fiber.props)];
  } else {
    if (!fiber.stateNode) {
      fiber.stateNode = fiber.type === 'HostText' ? document.createTextNode(fiber.props.nodeValue) : document.createElement(fiber.type);
      Object.keys(fiber.props).forEach(key => {
        if (key !== 'children') {
          if (fiber.stateNode.setAttribute) {
            if (key === 'className') {
              fiber.stateNode.setAttribute('class', fiber.props[key]);
            } else {
              fiber.stateNode.setAttribute(key, fiber.props[key]);
            }
          }
        }
      });

      Object.keys(fiber.props).forEach(key => {
        if (key.startsWith('on')) {
          const eventName = key.toLowerCase().substring(2);
          fiber.stateNode.addEventListener(eventName, fiber.props[key]);
        }
      });
    }
  
    if (fiber.return) {
      // 往上查找，直到有一个节点存在stateNode
      let domParentFiber = fiber.return;
      while (!domParentFiber.stateNode) {
        domParentFiber = domParentFiber.return;
      }
      domParentFiber.stateNode.appendChild(fiber.stateNode);
    }
  }

  // 初始化children的fiber

  let prevSibling = null;

  // mount阶段oldFiber为空
  // update阶段oldFiber不为空
  let oldFiber = fiber.alternate?.child;
  fiber.props.children.forEach((child, index) => {
    let newFiber = null;

    if (!oldFiber) {
      // mount
      newFiber = {
        type: child.type,
        stateNode: null,
        props: child.props,
        return: fiber,
        child: null,
        sibling: null,
      };
    } else {
      // update
      newFiber = {
        type: child.type,
        stateNode: oldFiber.stateNode,
        props: child.props,
        return: fiber,
        child: null,
        sibling: null,
        alternate: oldFiber
      };
    }
  
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
  })

  // 返回下一个要处理的fiber
  return getNextFiber(fiber);

}

function getNextFiber(fiber) {
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    } else {
      nextFiber = nextFiber.return;
    }
  }
  return null;
}

function workLoop() {
  while(workInProgress) {
    workInProgress = performUnitOfWork(workInProgress);
  }

  if (!workInProgress && workInProgressRoot.current.alternate) {
    workInProgressRoot.current = workInProgressRoot.current.alternate;
    workInProgressRoot.current.alternate = null;
  }
}

class AReactDomRoot {
  _internalRoot = null;
  constructor(container) {
    this._internalRoot = {
      current: null,
      containerInfo: container
    }
  }

  render(element) {
    this._internalRoot.current = {
      alternate: {
        stateNode: this._internalRoot.containerInfo,
        props: {
          children: [element]
        }
      }
    }
    workInProgressRoot = this._internalRoot;
    workInProgress = workInProgressRoot.current.alternate;
    window.requestIdleCallback(workLoop);
  }
}


function createRoot(container) {
  return new AReactDomRoot(container);
}

function act(callback) {
  callback();
  return new Promise(resolve => {
    function loop() {
      if (workInProgress) {
        window.requestIdleCallback(loop);
      } else {
        resolve(); 
      }
    }
    loop();
  })
}

function useState(initialState) {
  const oldHook = currentHookFiber.alternate?.memoriedState?.[currentHookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initialState,
    queue: [],
    dispatch: oldHook ? oldHook.dispatch : null
  }
  const actions = oldHook ? oldHook.queue : [];

  actions.forEach(action => {
    hook.state = typeof action === 'function' ? action(hook.state) : action;
  })

  const setState = hook.dispatch ? hook.dispatch : (action) => {
    hook.queue.push(action);

    // rerender
    workInProgressRoot.current.alternate =
      {
      stateNode: workInProgressRoot.current.containerInfo,
      props: workInProgressRoot.current.props,
      // 交换alternate
      alternate: workInProgressRoot.current
    }
  
    workInProgress = workInProgressRoot.current.alternate;
    window.requestIdleCallback(workLoop);
  }

  currentHookFiber.memoriedState.push(hook);
  currentHookIndex++;
  return [hook.state, setState];
}

function useReducer(reducer, initialState) {
  const [state, setState] = useState(initialState);
  const dispatch = (action) => {
    setState((state) => reducer(state, action));
  }
  return [state, dispatch]
}

export default { createElement, createRoot, act, useState, useReducer };
