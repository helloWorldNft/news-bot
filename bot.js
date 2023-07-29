import fs from "fs";
import TelegramBot from "node-telegram-bot-api";
import { publicGroupId, privateChatId, token, username } from "./config.js";

const bot = new TelegramBot(token, { polling: true });
const helloWorldGroupId = -1001859270095;

bot.on("polling_error", (error) => {
  console.error(error);
});

function readUrlsFromFile() {
  try {
    if (fs.existsSync("urls.json")) {
      const data = fs.readFileSync("urls.json", "utf8");
      const urls = JSON.parse(data);
      console.log("Read URLs from file:", urls);
      return urls;
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
    console.log("Writing URLs to file:", urls);
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
      const users = JSON.parse(data);
      console.log("Read users from file:", users);
      return users;
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
    console.log("Writing users to file:", users);
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
  console.log("Received /latesttweet command:", msg);
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, latestTweetUrl);
});

bot.onText(/\/latestblog/, (msg) => {
  console.log("Received /latestblog command:", msg);
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, latestBlogUrl);
});

bot.onText(/\/latestthread/, (msg) => {
  console.log("Received /latestthread command:", msg);
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, latestThreadsUrl);
});

// Retrieve static links
bot.onText(/\/telegram/, (msg) => {
  const chatId = msg.chat.id;
  if (chatId === helloWorldGroupId) {
    return;
  }
  bot.sendMessage(chatId, "https://t.me/helloWorldNft");
});

// Update the latest link only, do not forward to group & subs
bot.onText(/\/nofwd (.+)/, (msg, match) => {
  console.log("Received /nofwd command:", msg);
  const chatId = msg.chat.id;
  const url = match[1];

  if (
    url.startsWith("https://twitter.com/") ||
    url.startsWith("https://fxtwitter.com/")
  ) {
    latestTweetUrl = url;
  } else if (
    url.startsWith("https://mirror.xyz/") ||
    url.startsWith("https://fxmirror.xyz/")
  ) {
    latestBlogUrl = url;
  } else if (
    url.startsWith("https://www.threads.net/") ||
    url.startsWith("https://www.fxthreads.net/")
  ) {
    latestThreadsUrl = url;
  }

  writeUrlsToFile({ latestTweetUrl, latestBlogUrl, latestThreadsUrl });
  bot.sendMessage(chatId, "URL updated!");
});

// Event handler for the /preferences command
bot.onText(/\/preferences/, (msg) => {
  const chatId = msg.chat.id;
  // Check if the chat is a group chat
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    // If it is, don't process the command
    return;
  }
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
  // Check if the chat is a group chat
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    // If it is, don't process the command
    return;
  }
  if (!users.some((user) => user.chatId === chatId)) {
    users.push({
      chatId,
      preferences: { tweets: true, blogposts: true, threadsposts: true },
    });
    writeUsersToFile(users);
  }

  const opts = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Latest Tweet", callback_data: "latesttweet" }],
        [{ text: "Latest Blog", callback_data: "latestblog" }],
        [{ text: "Latest Thread", callback_data: "latestthreads" }],
        [{ text: "Telegram", callback_data: "telegram" }],
        [{ text: "DM Alert Preferences", callback_data: "preferences" }],
      ],
    },
  };

  bot
    .sendMessage(
      chatId,
      "_Ok!_ Here's what you can do:\n\n‣ Click *Latest Tweet*, *Blog* or *Thread* to view hello world's latest\n\n‣ Click *Telegram* and I'll teleport you to the hello world chat 🛸\n\n‣ Click *Preferences* to tell me which alerts you want to receive\n\nTo customize notifications click my pfp > _Notifications_ > _Customize_. If it gets cluttered type `/start` for this menu.\n\n_Thanks for stopping by. But mainly, stay classy._",
      opts
    )
    .then((sentMessage) => {
      lastStartMenuMessageId = sentMessage.message_id;
    });
});

const deletedMessages = new Set();

let lastStartMenuMessageId;

bot.on("callback_query", (callbackQuery) => {
  console.log("Received callback query:", callbackQuery);
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  let opts;

  switch (data) {
    case "latesttweet":
      opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Latest hello world Tweet", url: latestTweetUrl }],
            [{ text: "Back to Menu", callback_data: "back_to_menu" }],
          ],
        },
      };
      bot.sendMessage(chatId, "Click below, and like & retweet ffs.", opts);
      break;
    case "latestblog":
      opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Latest Blog Post", url: latestBlogUrl }],
            [{ text: "Back to Menu", callback_data: "back_to_menu" }],
          ],
        },
      };
      bot.sendMessage(
        chatId,
        "Click below to indulge in the soothing prose of the hello world blog...",
        opts
      );
      break;
    case "latestthreads":
      opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Latest Thread", url: latestThreadsUrl }],
            [{ text: "Back to Menu", callback_data: "back_to_menu" }],
          ],
        },
      };
      bot.sendMessage(
        chatId,
        "See us on a bad twitter clone, we're there ¯\\_(ツ)_/¯",
        opts
      );
      break;
    case "telegram":
      opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Telegram", url: "https://t.me/helloWorldNft" }],
            [{ text: "Back to Menu", callback_data: "back_to_menu" }],
          ],
        },
      };
      bot.sendMessage(chatId, "Click below for moonbois and apes:", opts);
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
            [{ text: "Back to Menu", callback_data: "back_to_menu" }],
          ],
        },
      };

      bot.sendMessage(
        chatId,
        "Choose which alerts you want to receive 👇",
        opts
      );
      break;
    case "back_to_menu":
      // Delete the old message with the preferences options
      if (!deletedMessages.has(messageId)) {
        // Check if the message has already been deleted
        bot.deleteMessage(chatId, messageId);
        deletedMessages.add(messageId);
      }

      opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Latest Tweet", callback_data: "latesttweet" }],
            [{ text: "Latest Blog Post", callback_data: "latestblog" }],
            [{ text: "Latest Thread", callback_data: "latestthreads" }],
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
        deletedMessages.add(lastStartMenuMessageId);
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
      deletedMessages.add(messageId);
    }

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
          [{ text: "Back to Menu", callback_data: "back_to_menu" }],
        ],
      },
    };

    bot.sendMessage(chatId, "Choose which messages you want to receive:", opts);
  }
});

// Event handler for relaying messages from the private chat to the public group and users
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  let text; // Declare the text variable at the top of the function
  let messageType; // Declare a new variable to keep track of the type of message

  if (
    chatId === privateChatId &&
    msg.text &&
    msg.text.startsWith(`@${username}`)
  ) {
    console.log("Forwarding message:", msg.text);
    // Remove the bot's username from the message
    text = msg.text.replace(`@${username}`, "").trim(); // Assign a value to the text variable
  }

  // Check if the message is a tweet URL
  if (
    text &&
    (text.startsWith("https://twitter.com/") ||
      text.startsWith("https://fxtwitter.com/"))
  ) {
    if (text !== latestTweetUrl) {
      // Only update the latestTweetUrl if it's different from the current URL
      latestTweetUrl = text;
      writeUrlsToFile({ latestTweetUrl, latestBlogUrl, latestThreadsUrl });
      messageType = "tweet"; // Set the messageType variable to "tweet"
    } else {
      return; // Don't forward the message if it's the same as the latest URL
    }
  }

  // Check if the message is a blog URL
  if (
    text &&
    (text.startsWith("https://mirror.xyz/") ||
      text.startsWith("https://fxmirror.xyz/"))
  ) {
    if (text !== latestBlogUrl) {
      // Only update the latestBlogUrl if it's different from the current URL
      latestBlogUrl = text;
      writeUrlsToFile({ latestTweetUrl, latestBlogUrl, latestThreadsUrl });
      messageType = "blog"; // Set the messageType variable to "blog"
    } else {
      return; // Don't forward the message if it's the same as the latest URL
    }
  }

  // Check if the message is a threads URL
  if (
    text &&
    (text.startsWith("https://www.threads.net/") ||
      text.startsWith("https://www.fxthreads.net/"))
  ) {
    if (text !== latestThreadsUrl) {
      // Only update the latestThreadsUrl if it's different from the current URL
      latestThreadsUrl = text;
      writeUrlsToFile({ latestTweetUrl, latestBlogUrl, latestThreadsUrl });
      messageType = "thread"; // Set the messageType variable to "thread"
    } else {
      return; // Don't forward the message if it's the same as the latest URL
    }
  }

  // Relay the message to the public group
  if (text) {
    let message; // Declare a new variable to hold the message

    switch (messageType) {
      case "tweet":
        message = `*BREAKING: New Tweet from hello world*\n\n${text}`;
        break;
      case "blog":
        message = `*BREAKING: New Blog Post from hello world*\n\n${text}`;
        break;
      case "thread":
        message = `*BREAKING: New Thread from hello world*\n\n${text}`;
        break;
      default:
        message = text;
        break;
    }

    bot.sendMessage(publicGroupId, message, { parse_mode: "Markdown" });
  }

  // Relay the message to all users who have started a DM with the bot and have opted in to receive this type of message
  users.forEach((user) => {
    if (user.chatId === privateChatId || user.chatId === publicGroupId) return; // Skip the private chat and public group

    let message; // Declare a new variable to hold the message

    switch (messageType) {
      case "tweet":
        if (
          (!user.preferences &&
            text &&
            text.startsWith("https://twitter.com/")) ||
          (user.preferences &&
            user.preferences.tweets &&
            text &&
            text.startsWith("https://twitter.com/"))
        ) {
          message = `*BREAKING: New Tweet from hello world*\n\n${text}`;
          bot.sendMessage(user.chatId, message, { parse_mode: "Markdown" });
        }
        break;
      case "blog":
        if (
          (!user.preferences &&
            text &&
            text.startsWith("https://mirror.xyz/")) ||
          (user.preferences &&
            user.preferences.blogposts &&
            text &&
            text.startsWith("https://mirror.xyz/"))
        ) {
          message = `*BREAKING: New Blog Post from hello world*\n\n${text}`;
          bot.sendMessage(user.chatId, message, { parse_mode: "Markdown" });
        }
        break;
      case "thread":
        if (
          (!user.preferences &&
            text &&
            text.startsWith("https://www.threads.net/")) ||
          (user.preferences &&
            user.preferences.threadsposts &&
            text &&
            text.startsWith("https://www.threads.net/"))
        ) {
          message = `*BREAKING: New Thread from hello world*\n\n${text}`;
          bot.sendMessage(user.chatId, message, { parse_mode: "Markdown" });
        }
        break;
      default:
        break;
    }
  });
});
