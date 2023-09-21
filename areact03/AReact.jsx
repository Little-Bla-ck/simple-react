import { resolve } from 'upath';
import '../requestIdleCallback';

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
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

function performUnitOfWork(fiber) {
  // 处理当前fiber: 创建DOM， 设置props, 插入当前dom到parent
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
  }

  if (fiber.return) {
    fiber.return.stateNode.appendChild(fiber.stateNode);
  }

  // 初始化children的fiber

  let prevSibling = null;
  fiber.props.children.forEach((child, index) => {
    const newFiber = {
      type: child.type,
      stateNode: null,
      props: child.props,
      return: fiber
    };

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

export default { createElement, createRoot, act };
