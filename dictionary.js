import { StreamerbotClient } from '@streamerbot/client';
import readline from 'readline';

// This keeps the terminal window open if a fatal crash occurs
process.on('unhandledRejection', (reason) => {
  console.error('\n💥 UNHANDLED CRASH:', reason);
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
  const client = new StreamerbotClient({ immediate: false });

  client.on('Twitch.ChatMessage', async (data) => {
    const message = data.data.message.message;
    if (message.trim().toLowerCase().includes('!say')) {
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
        const definitions = entries
          .map((entry) => {
            const { partOfSpeech, definition } = entry;
            return `(${partOfSpeech}) - ${definition}`;
          })
          .join('\n');

        if (!definitions.length) {
          throw new Error('No definitions found');
        }
        await client.doAction(
          { name: 'Dictionary Definition' },
          { dictDefinition: definitions },
        );
      } catch (error) {
        await client.doAction(
          { name: 'Dictionary Definition' },
          { dictDefinition: "Erm...sorry, we couldn't find that word." },
        );
        console.error(error);
      }
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
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds before trying again
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
