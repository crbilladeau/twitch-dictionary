# Dictionary to Chat

Calls https://freedictionaryapi.com/ and posts to your Twitch chat.

## SETUP

### Requirements

You will need to have [Node.js](https://nodejs.org/en/) installed on your computer. This should also include the `npm` package manager.
You will also need to have [Streamerbot](https://streamer.bot/downloads) installed.
You will need to have a copy of this program + folder contents saved locally somewhere on your computer.

### Setup Node.js Environment

1. Open a terminal window and navigate to the folder where you saved the program + folder contents, e.g. `cd <path to folder>`
2. Run `npm install` to install the required dependencies. If you run into any issues here, message me.

### Setup Websocket Server

1. In Streamerbot, go to Servers/Clients => WebSocket Server
2. Leave the server configured with default settings (8080 port, 127.0.0.1 IP address) assuming you have nothing else running on this port
3. Enable Auto Start so you don't have to manually start the server every time you restart Streamerbot
4. Under "Server Status" click "Start Server" - if you encounter an error, see the Debugging Tips section below

### Setup Dictionary API Chat

1. Create a new action in Streamerbot called "Dictionary Definition". This MUST be the name of the action, otherwise the program will not be able to find the action.
2. Add a subaction to the action, Twitch => Chat => Send Message to Channel.
3. For the message, add this variable exactly: `%dictDefinition%`. You may add any other text if you want but just keep in mind the program will output the message in this format:

```
(part of speech, e.g. noun) - Definition of the word. (second part of speech) - Second definition...
```

4. If you want to run the program yourself, navigate to the directory where the program is saved and run `node dictionary.js`. Otherwise, the next section for how to set up the program to auto-start.

### Test it!

Type `!say {WORD}` in your Twitch chat and see if the program responds with the definition of the word you typed.

### Setup Dictionary Program Auto-Start

If you do not want to have to manually start the program every time you stream, you can set up the program to auto-start.

1. Once you have the Websocket server configured, add a new action in Streamerbot. Call it whatever you want, e.g. "Start Dictionary Program".
2. Add a subaction to the action, Core => System => Run A Program.
3. **!! IMPORTANT !!**
   - For **Target**: Point it to your local version of Node.js, wherever you have it installed. e.g. for me, it's `C:\Program Files\nodejs\node.exe`.
   - For **Working Directory**: Point it to the **folder** where the dictionary.js file is located. e.g. for me, it's `C:\Users\<USERNAME></USERNAME>\Desktop\streamerbot-scripts\dictionary-api-chat`.
   - For **Arguments**: Add the following: `dictionary.js`

## DEBUGGING

1. The program keeps trying to connect to Streamerbot but can't establish a connection:
   - Check that your Websocket server is running with default settings mentioned above in the setup instructions.
   - You may need to restart Streamerbot or kill the program and try again.
2. Streamerbot `Unable to start websocket server, another service might be using the port, or your IP address is invalid!`
   - If the Websocket server is NOT automatically running upon starting up Streamerbot and clicking the "Start Server" button produces this error, you may have a dead ghost process running on the port (or some other process is using the port).
   - To kill a process on the port, run `netstat -ano | findstr :8080` in the command prompt. Find the PID of the process and run `taskkill /F /PID <PID>`. Replace `<PID>` with the actual PID number.
3. If you receive an unexpected error that crashes the program, check the output in your running Node terminal.
   - Send any strange errors to me, there's a chance I missed an edge case.
