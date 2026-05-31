import { StreamerbotClient } from '@streamerbot/client';
import readline from 'readline';

// This keeps the terminal window open if a fatal crash occurs
process.on('unhandledRejection', (reason) => {
  console.error('\n💥 UNHANDLED CRASH:', reason);
  keepTerminalOpen();
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 UNHANDLED CRITICAL EXCEPTION:', error);
  keepTerminalOpen();
});

function keepTerminalOpen() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log('\nPress ENTER to close this window...');
  rl.question('', () => {
    rl.close();
    process.exit(1);
  });
}

async function main() {
  const client = new StreamerbotClient({
    immediate: false,
    autoReconnect: true,
  });

  client.on('Twitch.ChatMessage', async ({ data }) => {
    const role = data?.message?.role ?? 0;
    const message = data?.message?.message || '';

    if (!message || !message.trim().toLowerCase().startsWith('!say')) {
      return;
    }

    // Only allow mods and broadcasters to use the !say command (role 3 = mod, 4 = streamer)
    if (role !== 3 && role !== 4) {
      console.error('Unauthorized user attempted !say command, skipping...');
      await client.doAction(
        { name: 'Dictionary Definition' },
        { dictDefinition: 'Sorry, only mods can use this command.' },
      );
      return;
    }

    const cleanWord = message.replace(/^!say\s*/i, '').trim();
    if (!cleanWord) {
      await client.doAction(
        { name: 'Dictionary Definition' },
        { dictDefinition: 'Ya gotta give me a word, dumbass.' },
      );
      return;
    }
    try {
      const entries = await getDefinition(cleanWord);
      if (!entries.length) {
        throw new Error('No definitions found');
      }

      const terminalLogString = entries
        .map((entry) => `(${entry.partOfSpeech}) - ${entry.definition}`)
        .join('\n');

      console.log(
        `Found requested definitions for ${cleanWord}:\n${terminalLogString}`,
      );

      // Send multiple smaller messages if response is greater than Twitch's limit (~500 characters, but we'll be safe)
      const MAX_CHARS = 480;
      let currentMessage = '';

      for (const entry of entries) {
        const textSegment = `(${entry.partOfSpeech}) - ${entry.definition} | `;

        // If adding this entry pushes the current chunk over the limit, send it now
        if ((currentMessage + textSegment).length > MAX_CHARS) {
          await client.doAction(
            { name: 'Dictionary Definition' },
            { dictDefinition: currentMessage.trim().replace(/\|$/, '').trim() },
          );
          currentMessage = '';
          await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay to prevent Twitch rate-limits
        }

        currentMessage += textSegment;
      }

      // Send any remaining text left over
      if (currentMessage.trim().length > 0) {
        await client.doAction(
          { name: 'Dictionary Definition' },
          { dictDefinition: currentMessage.trim().replace(/\|$/, '').trim() },
        );
      }
    } catch (error) {
      await client.doAction(
        { name: 'Dictionary Definition' },
        { dictDefinition: "Erm...sorry, we couldn't find that word." },
      );
      console.error(error);
    }
  });

  // Loop until Streamer.bot is ready to accept the connection
  while (true) {
    try {
      console.log('Connecting to StreamerBot...');
      await client.connect();
      console.log('Connected to StreamerBot!');
      break;
    } catch (err) {
      console.log(
        '⏳ Streamer.bot server is not ready yet. Retrying in 3 seconds...',
      );
      try {
        await client.disconnect();
      } catch (e) {}
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

main();

async function getDefinition(word) {
  const dictoryAPI = `https://freedictionaryapi.com/api/v1/entries/en/${word}`;
  const response = await fetch(dictoryAPI);
  if (!response.ok) {
    throw new Error('API Error');
  }
  const data = await response.json();
  if (!data.entries || data.entries.length === 0) {
    throw new Error('Word not found');
  }

  const entries = data.entries.slice(0, 3);
  const arrayOfEntries = entries
    .map((entry) => {
      if (entry.senses) {
        return {
          partOfSpeech: entry.partOfSpeech,
          definition: entry.senses?.[0]?.definition,
        };
      }
    })
    .filter(Boolean);

  if (arrayOfEntries.length === 0) {
    throw new Error('No definitions found');
  }
  return arrayOfEntries;
}
