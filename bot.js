import { publicGroupId, privateChatId, token, username } from "./config.js";

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const { publicGroupId, privateChatId, token, username } = config;
const bot = new TelegramBot(token, { polling: true });

function readUrlsFromFile() {
  try {
    if (fs.existsSync("urls.json")) {
      const data = fs.readFileSync("urls.json", "utf8");
      return JSON.parse(data);
    } else {
      return { latestTweetUrl: "", latestBlogUrl: "", latestThreadsUrl: "" };
    }
  } catch (err) {
    console.error(err);
    return { latestTweetUrl: "", latestBlogUrl: "", latestThreadsUrl: "" };
  }
}

function writeUrlsToFile(urls) {
  try {
    const data = JSON.stringify(urls);
    fs.writeFileSync("urls.json", data, "utf8");
  } catch (err) {
    console.error(err);
  }
}

function readUsersFromFile() {
  try {
    if (fs.existsSync("users.json")) {
      const data = fs.readFileSync("users.json", "utf8");
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (err) {
    console.error(err);
    return [];
  }
}

function writeUsersToFile(users) {
  try {
    const data = JSON.stringify(users);
    fs.writeFileSync("users.json", data, "utf8");
  } catch (err) {
    console.error(err);
  }
}

// Store ids of users who have started the bot in their DMs
let users = readUsersFromFile();

// Store the user's alert preferences
let userPreferences = {};

let { latestTweetUrl, latestBlogUrl, latestThreadsUrl } = readUrlsFromFile();

// Retrieve the latest tweet, blog post, and threads post URLs
bot.onText(/\/latesttweet/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, latestTweetUrl);
});

bot.onText(/\/latestblog/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, latestBlogUrl);
});

bot.onText(/\/latestthread/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, latestThreadsUrl);
});

// Retrieve static links
bot.onText(/\/telegram/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "https://t.me/helloWorldNft");
});

// Event handler for the /preferences command
bot.onText(/\/preferences/, (msg) => {
  const chatId = msg.chat.id;

  // Find the user's preferences
  const user = users.find((user) => user.chatId === chatId);
  if (!user) return;

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `Tweets ${user.preferences.tweets ? "✅" : ""}`,
            callback_data: "preference_tweets",
          },
        ],
        [
          {
            text: `Blog Posts ${user.preferences.blogposts ? "✅" : ""}`,
            callback_data: "preference_blogposts",
          },
        ],
        [
          {
            text: `Threads Posts ${user.preferences.threadsposts ? "✅" : ""}`,
            callback_data: "preference_threadsposts",
          },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, "Choose which messages you want to receive:", opts);
});

// Event handler for the /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!users.some((user) => user.chatId === chatId)) {
    users.push({
      chatId,
      preferences: { tweets: true, blogposts: true, threadsposts: true },
    });
    writeUsersToFile(users);
  }

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Latest Tweet", callback_data: "latesttweet" }],
        [{ text: "Latest Blog Post", callback_data: "latestblog" }],
        [{ text: "Latest Threads Post", callback_data: "latestthreads" }],
        [{ text: "Telegram", callback_data: "telegram" }],
        [{ text: "Preferences", callback_data: "preferences" }],
      ],
    },
  };

  bot.sendMessage(chatId, "Choose a command:", opts).then((sentMessage) => {
    lastStartMenuMessageId = sentMessage.message_id;
  });
});

const deletedMessages = new Set(); // Create a new Set to keep track of deleted messages

let lastStartMenuMessageId;

bot.on("callback_query", (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  let opts;

  switch (data) {
    case "latesttweet":
      opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Latest Tweet", url: latestTweetUrl }],
            [{ text: "Back to menu", callback_data: "back_to_menu" }],
          ],
        },
      };
      bot.sendMessage(
        chatId,
        "Click the button below to view the latest tweet:",
        opts
      );
      break;
    case "latestblog":
      opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Latest Blog Post", url: latestBlogUrl }],
            [{ text: "Back to menu", callback_data: "back_to_menu" }],
          ],
        },
      };
      bot.sendMessage(
        chatId,
        "Click the button below to view the latest blog post:",
        opts
      );
      break;
    case "latestthreads":
      opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Latest Threads Post", url: latestThreadsUrl }],
            [{ text: "Back to menu", callback_data: "back_to_menu" }],
          ],
        },
      };
      bot.sendMessage(
        chatId,
        "Click the button below to view the latest threads post:",
        opts
      );
      break;
    case "telegram":
      opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Telegram", url: "https://t.me/helloWorldNft" }],
            [{ text: "Back to menu", callback_data: "back_to_menu" }],
          ],
        },
      };
      bot.sendMessage(
        chatId,
        "Click the button below to visit our Telegram page:",
        opts
      );
      break;
    case "preferences":
      // Find the user's preferences
      const user = users.find((user) => user.chatId === chatId);
      if (!user) return;

      opts = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Tweets ${user.preferences.tweets ? "✅" : ""}`,
                callback_data: "preference_tweets",
              },
            ],
            [
              {
                text: `Blog Posts ${user.preferences.blogposts ? "✅" : ""}`,
                callback_data: "preference_blogposts",
              },
            ],
            [
              {
                text: `Threads Posts ${
                  user.preferences.threadsposts ? "✅" : ""
                }`,
                callback_data: "preference_threadsposts",
              },
            ],
            [{ text: "Back to menu", callback_data: "back_to_menu" }],
          ],
        },
      };

      bot.sendMessage(
        chatId,
        "Choose which messages you want to receive:",
        opts
      );
      break;
    case "back_to_menu":
      // Delete the old message with the preferences options
      if (!deletedMessages.has(messageId)) {
        // Check if the message has already been deleted
        bot.deleteMessage(chatId, messageId);
        deletedMessages.add(messageId); // Add the messageId to the Set of deleted messages
      }

      opts = {
        // Assign a new value to the opts variable using the = operator
        reply_markup: {
          inline_keyboard: [
            [{ text: "Latest Tweet", callback_data: "latesttweet" }],
            [{ text: "Latest Blog Post", callback_data: "latestblog" }],
            [{ text: "Latest Threads Post", callback_data: "latestthreads" }],
            [{ text: "Telegram", callback_data: "telegram" }],
            [{ text: "DM Alert Preferences", callback_data: "preferences" }],
          ],
        },
      };

      // Delete the previous start menu message
      if (
        lastStartMenuMessageId &&
        !deletedMessages.has(lastStartMenuMessageId)
      ) {
        // Check if the message has already been deleted
        bot.deleteMessage(chatId, lastStartMenuMessageId);
        deletedMessages.add(lastStartMenuMessageId); // Add the messageId to the Set of deleted messages
      }

      bot.sendMessage(chatId, "Choose a command:", opts).then((sentMessage) => {
        lastStartMenuMessageId = sentMessage.message_id;
      });
      break;
  }

  // Handle taps on the preference buttons
  if (data.startsWith("preference_")) {
    // Find the user's preferences
    const user = users.find((user) => user.chatId === chatId);
    if (!user) return;

    // Update the user's preferences based on the button that was tapped
    switch (data) {
      case "preference_tweets":
        user.preferences.tweets = !user.preferences.tweets;
        break;
      case "preference_blogposts":
        user.preferences.blogposts = !user.preferences.blogposts;
        break;
      case "preference_threadsposts":
        user.preferences.threadsposts = !user.preferences.threadsposts;
        break;
    }

    // Save the updated preferences
    writeUsersToFile(users);

    // Send a confirmation message
    bot.answerCallbackQuery(callbackQuery.id, { text: "Preferences updated!" });

    // Delete the old message with the old preferences options
    if (!deletedMessages.has(messageId)) {
      // Check if the message has already been deleted
      bot.deleteMessage(chatId, messageId);
      deletedMessages.add(messageId); // Add the messageId to the Set of deleted messages
    }

    opts = {
      // Assign a new value to the opts variable using the = operator
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `Tweets ${user.preferences.tweets ? "✅" : ""}`,
              callback_data: "preference_tweets",
            },
          ],
          [
            {
              text: `Blog Posts ${user.preferences.blogposts ? "✅" : ""}`,
              callback_data: "preference_blogposts",
            },
          ],
          [
            {
              text: `Threads Posts ${
                user.preferences.threadsposts ? "✅" : ""
              }`,
              callback_data: "preference_threadsposts",
            },
          ],
          [{ text: "Back to menu", callback_data: "back_to_menu" }],
        ],
      },
    };

    bot.sendMessage(chatId, "Choose which messages you want to receive:", opts);
  }
});

// Event handler for relaying messages from the private chat to the public group and users
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  if (
    chatId === privateChatId &&
    msg.text &&
    msg.text.startsWith(`@${username}`)
  ) {
    // Remove the bot's username from the message
    const text = msg.text.replace(`@${username}`, "").trim();
  }

  // Check if the message is a tweet URL
  if (text.startsWith("https://twitter.com/")) {
    latestTweetUrl = text;
    writeUrlsToFile({ latestTweetUrl, latestBlogUrl, latestThreadsUrl });
  }

  // Check if the message is a blog URL
  if (text.startsWith("https://mirror.xyz/")) {
    latestBlogUrl = text;
    writeUrlsToFile({ latestTweetUrl, latestBlogUrl, latestThreadsUrl });
  }

  // Check if the message is a threads URL
  if (text.startsWith("https://www.threads.net/")) {
    latestThreadsUrl = text;
    writeUrlsToFile({ latestTweetUrl, latestBlogUrl, latestThreadsUrl });
  }

  // Relay the message to the public group
  bot.sendMessage(publicGroupId, text);

  // Relay the message to all users who have started a DM with the bot and have opted in to receive this type of message
  users.forEach((user) => {
    if (
      (!user.preferences && text.startsWith("https://twitter.com/")) ||
      (user.preferences &&
        user.preferences.tweets &&
        text.startsWith("https://twitter.com/"))
    ) {
      bot.sendMessage(user.chatId, text);
    } else if (
      (!user.preferences && text.startsWith("https://mirror.xyz/")) ||
      (user.preferences &&
        user.preferences.blogposts &&
        text.startsWith("https://mirror.xyz/"))
    ) {
      bot.sendMessage(user.chatId, text);
    } else if (
      (!user.preferences && text.startsWith("https://www.threads.net/")) ||
      (user.preferences &&
        user.preferences.threadsposts &&
        text.startsWith("https://www.threads.net/"))
    ) {
      bot.sendMessage(user.chatId, text);
    }
  });
});
