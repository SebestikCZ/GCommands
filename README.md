<div align="center">
    <h1>G Commands</h1>
</div>

---

Installation
```
npm install gcommands
```

DEV build
```
npm install github:Garlic-Team/GCommands#dev
```

### Support
 - https://gcommands.js.org
 - https://discord.gg/AjKJSBbGm2

How to use?<br>
index.js
```js
const { GCommands } = require("gcommands");
const Discord = require("discord.js");

const client = new Discord.Client();

client.on("ready", () => {
    new GCommands(client, {
        cmdDir: "commands",
        errorMessage: "Error :(",
        slash: {
           slash: 'both', //true = slash only, false = only normal, both = slash and normal
           prefix: '.' 
        },
        cooldown: {
            message: "Please wait {cooldown} more second(s) before reusing the \`{cmdname}\` command.",
            default: 3
        }
    })
})

client.login("token")
```

Example Commands (put to cmdDir)

ping.js
```js
module.exports = {
	name: "ping",
	description: "Check bot ping",
	cooldown: 3,
	run: async(client, slash, message) => {
		if(message) {
			return message.channel.send("My ping is `" + Math.round(client.ws.ping) + "ms`")
		}

		client.api.interactions(slash.id, slash.token).callback.post({
			data: {
				type: 4,
				data: {
					content: "My ping is " + Math.round(client.ws.ping) + "ms"
				}
			}
		})
	}
};
```

test.js
```js
module.exports = {
	name: "test",
	description: "Test",
	expectedArgs: "<name>",
	minArgs: 1,
	cooldown: 5,
	guildOnly: "id",
	ownerOnly: "id",
	run: async(client, slash, message, args) => {
		if(message) {
			if(args[0]) {
				return message.channel.send("My ping is `" + Math.round(client.ws.ping) + "ms`")
			} else {
				return message.channel.send("Need args")
			}
		}

		client.api.interactions(slash.id, slash.token).callback.post({
			data: {
				type: 4,
				data: {
					content: "My ping is `" + Math.round(client.ws.ping) + "ms`"
				}
			}
		})
	}
};
```