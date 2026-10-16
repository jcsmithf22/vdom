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

type Props = Record<string, number | string | boolean>;

function h(type: string, props: Props, ...children: VNode[]) {
  return { type, props: props || {}, children };
}

declare namespace h.JSX {
  type Element = VNode;
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

function setBooleanProp(target: HTMLElement, name: string, value: boolean) {
  target.toggleAttribute(name, value);

  // @ts-expect-error
  target[name] = value;
}

function isCustomProp(name: string) {
  return false;
}

function setProp(target: HTMLElement, name: string, value: number | string | boolean) {
  if (isCustomProp(name)) {
    return;
  } else if (typeof value === "boolean") {
    setBooleanProp(target, name, value);
  } else {
    target.setAttribute(name, String(value));
  }
}

function setProps(target: HTMLElement, props: Props) {
  Object.entries(props).forEach(([key, value]) => {
    setProp(target, key, value);
  });
}

function changed(a: VNode, b: VNode) {
  if (typeof a === "string") {
    return typeof b !== "string" || a !== b;
  }

  if (typeof b === "string") return true;

  return a.type !== b.type;
}

function updateElement(
  parent: HTMLElement | Text,
  newNode: VNode | undefined,
  oldNode: VNode | undefined,
  tree: TNode | undefined,
) {
  // check if new node exists, if it doesn't, remove from dom
  if (newNode == null) {
    if (tree) tree.dom.remove();
    return null;
  }

  // time to add a node
  if (oldNode == null || tree == null) {
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
  if (typeof newNode === "string" || typeof oldNode === "string") {
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

function print(value: VNode, n: number) {
  if (typeof value === "string") {
    console.log("·".repeat(n) + value);
  } else {
    if (value.children) {
      console.log("·".repeat(n) + "<" + value.type + ">");
      value.children.forEach((child) => print(child, n + 2));
      console.log("·".repeat(n) + "</" + value.type + ">");
    } else {
      console.log("·".repeat(n) + "<" + value.type + "/>");
    }
  }
}

let oldNode = (
  <ul class="french-fries">
    <li>First</li>
    <li>Second</li>
  </ul>
);

const root = document.getElementById("root")!;
const reload = document.getElementById("reload")!;

let tree: TNode | null = createTree(oldNode);
root.appendChild(tree.dom);

const newNode = (
  <ul>
    <li data-list-item="1">Updated</li>
		<input type="checkbox" checked={true} />
  </ul>
);

reload.addEventListener("click", () => {
  tree = updateElement(root, newNode, oldNode, tree ?? undefined);
  oldNode = newNode;
});
