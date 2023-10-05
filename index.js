let last_cmd = {};

// a trival deal with backspace
function removeBackspaces(str) {
  // console.log(str)
  let stack = [];
  for (let char of str) {
    if (char === "\b" || char === "\x7f") {
      stack.pop();
    } else {
      stack.push(char);
    }
  }
  return stack.join("");
}

function predict(command0) {
  let command = removeBackspaces(command0);
  if (command.startsWith("vi ")) {
    const filename = command.substring(3);
    if (filename.endsWith(".c")) {
      return "gcc " + filename;
    }
    if (filename.endsWith(".cpp")) {
      return "g++ " + filename;
    }
    if (filename.endsWith(".rs")) {
      return "rustc " + filename;
    }
    if (filename.endsWith(".lean")) {
      return "lean " + filename;
    }
  }
  if (command.startsWith("gcc ") || command.startsWith("g++ ")) {
    return "./a.out";
  }
  if (command.startsWith("mkdir ")) {
    const target_dir = command.substring(6);
    return "cd " + target_dir;
  }
  if (command.startsWith("git add ")) {
    return "git commit";
  }
  if (command.startsWith("git clone ")) {
    const z = command.substring(10);
    const url = z.replace("--depth=1", "");
    let x = url.split("/");
    let y = x.pop();
    if (y == "") {
      y = x.pop();
    }
    if (y.endsWith(".git")) {
      y = y.slice(0, -4);
    }
    return "cd " + y;
  }
  if (command.startsWith("touch ")) {
    const filename = command.substring(6);
    return "vi " + filename;
  }
  if (command.startsWith("cargo new ")) {
    const target_dir = command.substring(10);
    return "cd " + target_dir;
  }
  return undefined;
}

exports.middleware =
  ({ getState, dispatch }) =>
  (next) =>
  async (action) => {
    switch (action.type) {
      case "SESSION_USER_DATA": {
        const {
          sessions: { activeUid },
        } = getState();
        if (last_cmd[activeUid] === undefined) {
          last_cmd[activeUid] = "";
        }
        last_cmd[activeUid] += action.data;
        break;
      }
      case "SESSION_SET_XTERM_TITLE": {
        const {
          sessions: { activeUid },
        } = getState();
        const x = last_cmd[activeUid];
        const v = x.split("\r");
        delete last_cmd[activeUid];
        const data = predict(v[0]);
        if (data != null && data != undefined) {
          window.rpc.emit("data", { uid: activeUid, data });
        }
        break;
      }
      default:
        break;
    }
    next(action);
  };
