# Veronica Corningstone Telegram $NEWS Bot

This is a Telegram bot that relays messages from an admin broadcast chat to a public group and to the DMs of individual users who add the bot to their DMs. The bot allows users to configure which types of alerts they receive. You'll need to create a bot by messaging `@BotFather` on Telegram. You'll need your bot's API token, the chat id of your private admin chat, and the chat id of the public group you want to relay posts to.  

## Setup

1. Clone this repository to your local machine.
2. Install the dependencies by running `npm install`.
3. Create a `config.js` file in the root directory of the project with the following contents:

```
export const publicGroupId = YOUR_PUBLIC_CHAT_ID_HERE;
export const privateChatId = YOUR_PRIVATE_CHAT_ID_HERE;
export const token = 'YOUR_BOT_TOKEN_HERE';
export const username = 'YOUR_BOT_USERNAME_HERE';

```

Make sure to replace the placeholder values with your own values.

4. Run the bot by running `node bot.js`.

## Usage

To use the bot, start a private chat with it and send it a message starting with its username (e.g., `@VeronicaCorningstoneBot Hello`). The bot will relay the message to the public group and users who have started a DM with the bot and have opted in to receive this type of message.

