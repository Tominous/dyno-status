/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable require-atomic-updates */
/* eslint-disable no-inner-declarations */
// DO NOT REMOVE ANY OF THE BELOW


const fs = require('fs');
const Eris = require('eris');
const { get } = require('axios');
const config = require('./config.json');

const { token } = config;
const client = new Eris(token, { requestTimeout: 60000 });

function formatter(name, server) {
    const fields = [];
    for (const s of server) {
        const { result } = s;
        if (!result) fields.push({ name: `❗ Cluster ${server.indexOf(s)} (0/0)`, value: '**__Cluster offline__**', inline: true });
        else {
            const { clusterId } = result;
            const connected = `${result.connectedCount}/${result.shardCount}`;
            const { guildCount } = result;
            const { unavailableCount } = result;
            const { voiceConnections } = result;
            const shards = result.shards.join(', ').length > 32 ? `${result.shards.slice(0, result.shards.length / 2).join()},\n${result.shards.slice(result.shards.length / 2).join()}` : result.shards.join();
            const { uptime } = result;
            let status;
            if (result.connectedCount / result.shardCount > 0.9) status = '✅';
            else if (result.connectedCount / result.shardCount > 0.5) status = '⚠';
            else status = '❗'; // Includes any errors the cluster may have
            const formatted = { name: `${status} Cluster ${clusterId} (${connected})`, value: `${shards}\nGuilds: ${guildCount}\nUnavailable: ${unavailableCount}\nVoice: ${voiceConnections}\nUp: ${uptime}`, inline: true };
            fields.push(formatted);
        }
    }
    let shardsConnected = server.filter((s) => s.result).map((a) => a.result.connectedCount).reduce((a, b) => a + b, 0);
    const clusterOutage = server.filter((a) => !a.result || (a.result && a.result.shardCount !== a.result.connectedCount));
    const clusterOutageCount = clusterOutage.length;
    const clusterProblems = `${clusterOutageCount}/24 clusters with an outage`;
    const partialOutage = `${clusterOutage.filter((s) => s.result).filter((b) => b.result.connectedCount > 3).length}/${clusterOutageCount} Partial Outage`;
    const majorOutage = `${clusterOutage.filter((b) => !b.result || b.result.connectedCount < 4).length}/${clusterOutageCount} Major Outage`;
    const shardCount = server.filter((s) => s.result).map((a) => a.result.shardCount).reduce((a, b) => a + b, 0);
    const percentage = ((shardsConnected / shardCount) * 100).toFixed(5) * 1;
    shardsConnected = `${shardsConnected}/${shardCount} shards connected`;
    const serverGuildCount = server.filter((s) => s.result).map((a) => a.result.guildCount).reduce((a, b) => a + b, 0);
    const serverUnavailableCount = server.filter((s) => s.result).map((a) => a.result.unavailableCount).reduce((a, b) => a + b, 0);
    const serverGuildPerc = ((1 - serverUnavailableCount / serverGuildCount) * 100).toFixed(5) * 1; // fix unnecessary decimal places
    let color;
    if (percentage >= 90) color = 124622;
    else if (percentage >= 75) color = 16751360;
    else if (percentage < 75) color = 16728395;
    else color = undefined; // if something happens that's unknown
    return {
        embed: {
            description: `${shardsConnected}\n${clusterProblems}\n${partialOutage}\n${majorOutage}\n${Number.isNaN(percentage) ? 0 : percentage}% connected\n\n${serverGuildCount} guilds\n${serverUnavailableCount} unavailable\n${Number.isNaN(serverGuildPerc) ? 0 : serverGuildPerc}% connected`,
            fields,
            footer: { text: 'Last updated' },
            timestamp: new Date(),
            color,
            title: name,
        },
        content: '',
    }; // Full embed constructed
}

// eslint-disable-next-line consistent-return
async function req() {
    const servers = [];
    const messages = [];
    let success = true;
    try {
        const { data } = await get('https://dyno.gg/api/status');
        const info = Object.values(data);
        const name = Object.keys(data);
        for (const a of info) {
            servers.push({ server: name[info.indexOf(a)], status: a });
        }
    } catch (error) {
        success = false;
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < config.messages.length; i++) {
            messages.push({ content: `**Error!**\n${error.message}`, embed: null });
        }
    }
    if (success) {
        function info() {
            try {
                let shardsConnected = servers.map((a) => a.status.filter((s) => s.result).map((b) => b.result.connectedCount).reduce((n, i) => n + i, 0)).reduce((a, b) => a + b, 0);
                const totalShards = servers.map((i) => i.status.filter((a) => a.result).map((n) => n.result.shardCount).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
                const clusterProblems = `${servers.map((a) => a.status.filter((s) => s.result).filter((b) => b.result.shardCount !== b.result.connectedCount).length).reduce((a, b) => a + b, 0)}/${servers.map(t => t.status.length).reduce((a, b) => a + b, 0)} clusters with problems`;
                const overallPercentage = ((shardsConnected / totalShards) * 100).toFixed(5) * 1;
                shardsConnected = `${shardsConnected}/${totalShards} shards connected`;
                const totalGuilds = servers.map((s) => s.status.filter((g) => g.result).map((a) => a.result.guildCount).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
                const unavailableGuilds = servers.map((s) => s.status.filter((g) => g.result).map((a) => a.result.unavailableCount).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
                const guildPerc = ((1 - unavailableGuilds / totalGuilds) * 100).toFixed(5) * 1;
                let color;
                if (overallPercentage >= 90) color = 124622;
                else if (overallPercentage >= 65) color = 16751360;
                else if (overallPercentage < 65) color = 16728395;
                else color = undefined;
                const guildID = client.getChannel(config.channel).guild.id;
                const servMsg = config.messages.slice(1, 7);
                const jumpLinks = servMsg.map((l) => {
                    const server = servers.filter((a) => a)[servMsg.indexOf(l)];
                    const shardCount = server.status.filter((s) => s.result).map((a) => a.result.shardCount).reduce((a, b) => a + b, 0);
                    let serverPerc = server.status.filter((s) => s.result).map((a) => a.result.connectedCount).reduce((a, b) => a + b, 0);
                    let serverPercEmoji;
                    if (serverPerc / shardCount >= 0.9) serverPercEmoji = '✅';
                    else if (serverPerc / shardCount >= 0.75) serverPercEmoji = '⚠';
                    else if (serverPerc / shardCount < 0.75) serverPercEmoji = '❗';
                    else serverPercEmoji = '❔';
                    serverPerc = `${serverPerc}/${shardCount} shards`;
                    const serverName = server.server;
                    return `${serverPercEmoji} [${serverName} (${serverPerc})](https://discordapp.com/channels/${guildID}/${config.channel}/${l})`;
                }).join('\n');
                return {
                    content: '',
                    embed: {
                        title: 'Dyno Status',
                        fields: [
                            { name: 'Overview', value: `${shardsConnected}\n${clusterProblems}\n${Number.isNaN(overallPercentage) ? 0 : overallPercentage}% online\n\n${totalGuilds} guilds\n${unavailableGuilds} unavailable\n${Number.isNaN(guildPerc) ? 0 : guildPerc}% available`, inline: true },
                            { name: 'Servers', value: jumpLinks, inline: true }],
                        footer: { text: 'Last updated' },
                        timestamp: new Date(),
                        color,
                    },
                };
            } catch (error) {
                console.error(error);
                return messages.push({ content: `**Error!**\n${error.message}`, embed: null });
            }
        }
        function overview() {
            return messages.push(info());
        }
        function serverInfo() {
            for (const hi of servers) {
                try {
                    const haha = formatter(hi.server, hi.status);
                    messages.push(haha);
                } catch (error) {
                    messages.push({ content: `**Error!**\n${error.message}`, embed: null });
                    console.error(error);
                }
            }
        }
        overview();
        serverInfo();
        overview();
    }
    for (const id of config.messages) {
        try {
            const information = messages.filter((a) => a)[config.messages.indexOf(id)];
            // eslint-disable-next-line no-await-in-loop
            await client.editMessage(config.channel, id, information);
        } catch (error) {
            return console.error(error);
        }
    }
}

function run() {
    req();
    setInterval(() => {
        req();
    }, 45000);
}

client.on('ready', async () => {
    client.editStatus('online', { type: 3, name: 'dyno.gg/status' });
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator} at ${new Date().toString()}`);
    if (!config.channel) throw new Error('Channel ID is invalid');
    else if (!config.messages) {
        async function setup() {
            // Configures the messages
            try {
                let overview1 = await client.createMessage(config.channel, 'Overview');
                let titan = await client.createMessage(config.channel, 'Titan');
                let atlas = await client.createMessage(config.channel, 'Atlas');
                let pandora = await client.createMessage(config.channel, 'Pandora');
                let hyperion = await client.createMessage(config.channel, 'Hyperion');
                let enceladus = await client.createMessage(config.channel, 'Enceladus');
                let janus = await client.createMessage(config.channel, 'Janus');
                let overview2 = await client.createMessage(config.channel, 'Overview');
                overview1 = overview1.id;
                titan = titan.id;
                atlas = atlas.id;
                pandora = pandora.id;
                hyperion = hyperion.id;
                enceladus = enceladus.id;
                janus = janus.id;
                overview2 = overview2.id;
                config.messages = [overview1, titan, atlas, pandora, hyperion, enceladus, janus, overview2];
                await fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify(config)); // Saves it in case bot restarts
            } catch (error) {
                throw new Error(error.stack);
            }
        }
        await setup();
        run();
    } else if (!config.messages[7]) {
        let newOverview = await client.createMessage(config.channel, 'Overview');
        newOverview = newOverview.id;
        config.messages.push(newOverview);
        await fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify(config));
        run();
    } else run();
});

// You can do other stuff here

client.connect();
