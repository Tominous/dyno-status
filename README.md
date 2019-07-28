# dyno-status
A Discord Bot which will show the real-time status of Dyno

## Installation and Startup

1) Clone the repository
2) Node 10 is required, so head to the [Node.js download page](https://nodejs.org/en/) and download/install the LTS version
3) Run `npm install` to install the dependencies (Eris, Axios and mathjs)
4) Create a new bot application (see [Creating a bot account](#creating-a-bot-account))
5) Open `config.json` and set your desired channel ID for the status to go to
6) Start the bot

### Creating a bot account
1) Head to the [Discord Developer Portal](https://discordapp.com/developers/applications/)
2) Press New Application, call it whatever you want to name your bot
3) Head to the Bot tab, Add Bot
4) Copy the bot token - **__DO NOT SHARE THIS WITH ANYONE__**
5) Put the bot token in between the second `""` on the second line of `config.json`, save
6) Head back to the Developer Portal, open the OAuth2 tab
7) Under `Scopes`, tick only the `bot` option
8) Give the bot `Send Messages` and `Embed Links` **IMPORTANT!**, the rest of the permissions are optional
9) Copy the URL, then invite the bot to your desired server

## About the bot
 - dyno-status serves as an easy way to check the real time status of the public version of Dyno, instead of having to visit their [status page](https://dyno.gg/status)
 - Every 20 seconds, dyno-status will send an API request to the status page, fetching the most recent information available. After the information has been received, dyno-status will translate the information relayed into an embed which looks something like this: ![Status example](https://cdn.discordapp.com/attachments/556405294159101963/601782347594989588/unknown.png)
 - An API request is sent every 20 seconds and the latest information from the API is updated every 15 seconds. So when a status update is fetched, you will see the uptime jump 15 seconds each refresh rather than 20 seconds. This is not something to worry about
 ### Why did I decide to create this?
 - I wanted a way of easily accessing the real time connection status of Dyno with Discord, and the best way is to check the platform you're using, Discord
 - Doing support, if someone reports an offline server, it takes time to grab their server ID, load the status page and verify what cluster/shard the server is on. Having a bot which has the latest information for you makes this so much more easier
 - I wanted to get myself involved in more JavaScript
 - I was bored. No joke. I had nothing to do.

## Disclaimer

 - Although I am a Trusted member of Dyno, Dyno has no affiliation or relation with this project in any way. This was my own personal project, and I may remove this repository at the developer's request.
 - The bot was built on Node.js 10.16.0 LTS. I will support Node versions 10+, however if bugs occur on versions below Node 10, I will not fix them. However, if you wish to fix any bugs relating to this, feel free to make a PR.

## Release History

* 19 Jul 2019
    * `0.0.1` - Initial Release
* 27 Jul 2019
    * `0.0.2` - added API fail catch and fixed undefined bug
    * `0.1.0` - Moved bot token to config for ease of update - SET UP FROM SCRATCH IF YOU HAVE VERSION 0.0.1
    * `0.1.1` - Removed console log
* 28 Jul 2019
    * `0.1.2` - Rewrote functions/requests for better handling
