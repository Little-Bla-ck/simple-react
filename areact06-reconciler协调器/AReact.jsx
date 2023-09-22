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
    }
  }

  reconcileChildren(fiber, fiber.props.children);

  // 返回下一个要处理的fiber
  return getNextFiber(fiber);
}

function reconcileChildren(fiber, children) {
  // 初始化children的fiber

  let prevSibling = null;

  // mount阶段oldFiber为空
  // update阶段oldFiber不为空
  let oldFiber = fiber.alternate?.child;
  let index = 0;

  while(index < fiber.props.children.length || oldFiber) {
    const child = fiber.props.children[index];

    let newFiber = null;
    let sameType = oldFiber && child && child.type === oldFiber.type;
    // mount placement
    if (child && !sameType) {
      newFiber = {
        type: child.type,
        stateNode: null,
        props: child.props,
        return: fiber,
        child: null,
        sibling: null,
        effectTag: 'PLACEMENT'
      };
    } 
    // update
    else if (sameType) {
      newFiber = {
        type: child.type,
        stateNode: oldFiber.stateNode,
        props: child.props,
        return: fiber,
        child: null,
        sibling: null,
        alternate: oldFiber,
        effectTag: 'UPDATE'
      };
    }
    // delete
    else if (!sameType && oldFiber) {
      oldFiber.effectTag = 'DELETION';
      workInProgressRoot.deletion.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling && (prevSibling.sibling = newFiber);
    }
    prevSibling = newFiber;
    index++;
  }
}


function commitRoot(fiber) {
  workInProgressRoot.deletion.forEach(commitWork);

  commitWork(workInProgressRoot.current.alternate.child);
  workInProgressRoot.current = workInProgressRoot.current.alternate;
  workInProgressRoot.current.alternate = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  let domParentFiber = null;

  if (fiber.return) {
    domParentFiber = fiber.return;
    // 往上查找，直到有一个节点存在stateNode
    while (!domParentFiber.stateNode) {
      domParentFiber = domParentFiber.return;
    }
  }

  if (fiber.effectTag === 'PLACEMENT' && fiber.stateNode) {
    updateDom(fiber.stateNode, {}, fiber.props);
    // 添加dom
    domParentFiber.stateNode.appendChild(fiber.stateNode);
  } else if (fiber.effectTag === 'UPDATE') {
    updateDom(fiber.stateNode, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParentFiber.stateNode);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, parentStateNode) {
  if (fiber.stateNode) {
    parentStateNode.contains(fiber.stateNode) && parentStateNode.removeChild(fiber.stateNode);
  } else {
    commitDeletion(fiber.child, parentStateNode);
  }
}

function updateDom(stateNode, prevProps, nextProps) {
  // 事件解绑
  Object.keys(prevProps)
  .filter(value => value.startsWith('on'))
  .filter(key => isGone(prevProps, nextProps)(key) || isChanged(prevProps, nextProps)(key))
  .forEach(key => {
    const eventName = key.toLocaleLowerCase().substring(2);
    stateNode.removeEventListener(eventName, prevProps[key]);
  })
  // 删除props
  Object.keys(prevProps)
  .filter(isGone(prevProps, nextProps))
  .forEach(key => {
    if (key !== 'children') {
      if (stateNode.setAttribute) {
        if (key === 'className') {
          stateNode.setAttribute('class', undefined);
        } else if (key === 'key' || key.startsWith('on')) {
          return;
        } else {
          stateNode.setAttribute(key, undefined);
        }
      }
    }
  })
  // 处理新增和变化的props
  Object.keys(nextProps)
  .filter(key => isNew(prevProps, nextProps)(key) || isChanged(prevProps, nextProps)(key))
  .forEach(key => {
    if (key !== 'children') {
      // 文本节点特殊处理
      if (stateNode.nodeType === 3) {
        stateNode['nodeValue'] = nextProps[key];
        return;
      }
      if (stateNode.setAttribute) {
        if (key === 'className') {
          stateNode.setAttribute('class', nextProps[key]);
        } else if (key === 'key' || key.startsWith('on')) {
          return;
        } else {
          stateNode.setAttribute(key, nextProps[key]);
        }
      }
    }
  });

  // 添加新的event
  Object.keys(nextProps)
  .filter(key => isNew(prevProps, nextProps)(key) || isChanged(prevProps, nextProps)(key))
  .forEach(key => {
    if (key.startsWith('on')) {
      const eventName = key.toLowerCase().substring(2);
      stateNode.addEventListener(eventName, nextProps[key]);
    }
  });
}

function isGone(prev, next) {
  return (key) => {
    !(key in next);
  }
}

function isChanged(prev, next) {
  return (key) => {
    return key in prev && key in next && prev[key] !== next[key]; 
  }
}

function isNew(prev, next) {
  return (key) => {
    return !(key in prev) && key in next; 
  }
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
    commitRoot();
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
    workInProgressRoot['deletion'] = [];
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
      stateNode: workInProgressRoot.containerInfo,
      props: workInProgressRoot.current.props,
      // 交换alternate
      alternate: workInProgressRoot.current
    }
  
    workInProgress = workInProgressRoot.current.alternate;   
    workInProgressRoot['deletion'] = [];

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
