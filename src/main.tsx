type VNode =
  | {
      type: string;
      props: Props;
      children: VNode[];
    }
  | string;

type TNode = {
  dom: HTMLElement | Text;
  children: TNode[];
};

type Props = Record<string, string>

function h(type: string, props: Props, ...children: VNode[]) {
  return { type, props: props || {}, children };
}

declare namespace h.JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

function createTree(node: VNode): TNode {
  if (typeof node === "string") {
    return {
      dom: document.createTextNode(node),
      children: [],
    };
  }

  const dom = document.createElement(node.type);
  setProps(dom, node.props);
  const children = node.children.map(createTree);
  children.forEach((child) => dom.appendChild(child.dom));

  return { dom, children };
}

function setProp(target: HTMLElement, name: string, value: string) {
  target.setAttribute(name, value);
}

function setProps(target: HTMLElement, props: Props) {
  Object.keys(props).forEach((name) => {
    setProp(target, name, props[name]);
  });
}

function changed(a, b) {
  return typeof a !== typeof b || (typeof a === "string" && a !== b) || a.type !== b.type;
}

function updateElement(parent, newNode, oldNode, tree) {
  // check if new node exists, if it doesn't, remove from dom
  if (newNode == null) {
    if (tree) tree.dom.remove();
    return null;
  }

  // time to add a node
  if (oldNode == null) {
    const nextTree = createTree(newNode);
    parent.appendChild(nextTree.dom);
    return nextTree;
  }

  // node changed
  if (changed(newNode, oldNode)) {
    const nextTree = createTree(newNode);
    tree.dom.replaceWith(nextTree.dom);
    return nextTree;
  }

  // string hasn't changed since we checked before
  if (typeof newNode === "string") {
    return tree;
  }

  // make sure children haven't changed
  const nextChildren = [];
  const count = Math.max(newNode.children.length, oldNode.children.length);
  for (let i = 0; i < count; i++) {
    const childTree = updateElement(
      tree.dom,
      newNode.children[i],
      oldNode.children[i],
      tree.children[i],
    );

    if (childTree !== null) {
      nextChildren.push(childTree);
    }
  }

  tree.children = nextChildren;
  return tree;
}

function print(value, n) {
  if (value.children) {
    console.log("·".repeat(n) + "<" + value.type + ">");
    value.children.forEach((child) => print(child, n + 2));
    console.log("·".repeat(n) + "</" + value.type + ">");
  } else {
    console.log("·".repeat(n) + "<" + value.type + "/>");
  }
}

let oldNode = (
  <ul class="name">
    <li>First</li>
    <li>Second</li>
  </ul>
);

const root = document.getElementById("root");
let tree = createTree(oldNode);
root.appendChild(tree.dom);

const reload = document.getElementById("reload");

const newNode = (
  <ul>
    <li>Updated</li>
  </ul>
);

reload.addEventListener("click", () => {
  tree = updateElement(root, newNode, oldNode, tree);
});
