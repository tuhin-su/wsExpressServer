const { getUser } = require("../controllers/userController");

module.exports = async function handleWS(context) {
  try {
    const { ws, type, command, body, parts, clients } = context;
    if (type === 'POST' && parts[0] === 'login') {
      ws.send(JSON.stringify({ msg: "Login request received" }));
      const email = body.email;
      const password = body.password;
      ws.send(JSON.stringify([email, password]));
    }

  } catch (e) {
    console.error(e);
    context.ws.send(JSON.stringify({ error: "Bad request format" }));
  }
};
