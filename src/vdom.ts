const exampleButton = {
  tag: "button",
  properties: { class: "primary", disabled: true, onClick: doSomething },
  children: [], // an array of virtual nodes
};

const exampleText = {
  text: "Hello World",
};

function h(tag, properties, children) {
  return { tag, properties, children };
}

function text(content) {
  return { text: content };
}

const pausedScreen = h("div", {}, [
  h("h2", {}, text("Game Paused")),
  h("button", { onClick: resumeGame }, [text("Resume")]),
  h("button", { onClick: quitGame }, [text("Quit")]),
]);

function diffOne(l, r) {
  // text changed
  const isText = l.text !== undefined;
  if (isText) {
    return l.text !== r.text ? { replace: r } : { noop: true };
  }

  // tag changed
  if (l.tag !== r.tag) {
    return { replace: r };
  }

  const remove = [];
  for (const prop in l.properties) {
    if (r.properties[prop] === undefined) remove.push(prop);
  }

  const set = {};
  for (const prop in r.properties) {
    if (r.properties[prop] !== l.properties[prop]) {
      set[prop] = r.properties[prop];
    }
  }

  const children = diffList(l.children, r.children);

  return { modify: { remove, set, children } };
}

function diffList(ls, rs) {
  const length = Math.max(ls.length, rs.length);
  return Array.from({ length }).map((_, i) => {
    if (ls[i] === undefined) return { create: rs[i] };
    if (rs[i] === undefined) return { remove: ls[i] };
    return diffOne(ls[i], rs[i]);
  });
}
