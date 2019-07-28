// DO NOT REMOVE ANY OF THE BELOW
let config = require('./config.json')
const token = config.token
const fs = require('fs')
const Eris = require('eris')
const client = new Eris(token)
const axios = require('axios')
const math = require('mathjs')

function formatter(name, server){
    let fields = []
    for(const s of server){
        const {result} = s
        if(!result) fields.push({name: `❗ Cluster ${server.indexOf(s)} (0/0)`,value:'**__Cluster offline__**',inline:true})
        else{
            const {clusterId} = result
            const connected = `${result.connectedCount}/${result.shardCount}`
            const {guildCount} = result
            const {unavailableCount} = result
            const {voiceConnections} = result
            const shards = result.shards.join()
            const {uptime} = result
            let status;
            if(connected.startsWith('6')) status = '✅'
            else if(connected.startsWith('5') || connected.startsWith('4')) status = '⚠'
            else status = '❗' // Includes any errors the cluster may have
            const formatted = {name: `${status} Cluster ${clusterId} (${connected})`,value:`${shards}\nGuilds: ${guildCount}\nUnavailable: ${unavailableCount}\nVoice: ${voiceConnections}\nUp: ${uptime}`,inline:true}
            fields.push(formatted)
        }
    }
    let shardsConnected = server.filter(s => s.result).map(a => a.result.connectedCount).reduce((a,b) => a+b,0)
    const clusterOutage = server.filter(a => !a.result || (a.result && a.result.shardCount !== a.result.connectedCount))
    const clusterOutageCount = clusterOutage.length
    const clusterProblems = `${clusterOutageCount}/24 clusters with an outage`
    const partialOutage = `${clusterOutage.filter(b => b.result.connectedCount > 3).length}/${clusterOutageCount} Partial Outage`
    const majorOutage = `${clusterOutage.filter(b => !b.result || b.result.connectedCount < 4).length}/${clusterOutageCount} Major Outage`
    const percentage = ((shardsConnected / 144)*100).toFixed(5)*1
    shardsConnected = shardsConnected+'/144 shards connected'
    const serverGuildCount = server.filter(s => s.result).map(a => a.result.guildCount).reduce((a,b) => a+b,0)
    const serverUnavailableCount = server.filter(s => s.result).map(a => a.result.unavailableCount).reduce((a,b) => a+b,0)
    const serverGuildPerc = ((1 - serverUnavailableCount/serverGuildCount)*100).toFixed(5) * 1 //fix unnecessary decimal places
    let color;
    if(percentage >= 90) color = 124622
    else if(percentage >= 75) color = 16751360
    else if(percentage < 75) color = 16728395
    else color = undefined //if something happens that's unknown
    return {
        description: `${shardsConnected}\n${clusterProblems}\n${partialOutage}\n${majorOutage}\n${percentage}% connected\n\n${serverGuildCount} guilds\n${serverUnavailableCount} unavailable\n${serverGuildPerc}% connected`,
        fields: fields,
        footer:{text:'Last updated'},
        timestamp: new Date(),
        color:color,
        title:name
    } // Full embed constructed
}

async function req(){
    const servers = []
    const messages = []
    try{
        const {data} = await axios.get('https://dyno.gg/api/status')
        const info = Object.values(data)
        const name = Object.keys(data)
        for(const a of info){
            servers.push({server: name[info.indexOf(a)], status:a})
        }
    }
    catch(error){
        for(const lol of config.messages){
            messages.push(error.message)
        }
    }
    if(!messages[0]){
        function info(){
            try {
                let shardsConnected = servers.map(a => a.status.filter(s => s.result).map(b => b.result.connectedCount).reduce((a,b) => a+b,0)).reduce((a,b) => a+b,0)
                const clusterProblems = `${servers.map(a => a.status.filter(s => s.result).filter(b => b.result.shardCount !== b.result.connectedCount).length).reduce((a,b) => a+b,0)}/144 clusters with problems`
                const overallPercentage = ((shardsConnected/864)*100).toFixed(5)*1
                shardsConnected = shardsConnected+'/864 shards connected'
                const totalGuilds = servers.map(s => s.status.filter(g => g.result).map(a => a.result.guildCount).reduce((a,b) => a+b,0)).reduce((a,b) => a+b,0)
                const unavailableGuilds = servers.map(s => s.status.filter(g => g.result).map(a => a.result.unavailableCount).reduce((a,b) => a+b,0)).reduce((a,b) => a+b,0)
                const guildPerc = ((1 - unavailableGuilds / totalGuilds)*100).toFixed(5)*1
                let color;
                if(overallPercentage >= 80) color = 124622
                else if(overallPercentage >= 50) color = 16751360
                else if(overallPercentage < 50) color = 16728395
                else color = undefined
                return messages.push({
                    content:'',
                    embed: {
                        title:'Overview',
                        description:`${shardsConnected}\n${clusterProblems}\n${overallPercentage}% online\n\n${totalGuilds} guilds\n${unavailableGuilds} unavailable\n${guildPerc}% available`,
                        footer:{text:'Last updated'},
                        timestamp: new Date(),
                        color:color
                    }
                })
            }catch(error){
                messages.push({content:`**Error!**\n${error.message}`,embed:null})
            }
        }
        function serverInfo(){
            for(const hi of servers){
                try{
                    const haha = formatter(hi.server,hi.status)
                    messages.push(haha)
                }
                catch(error){
                    messages.push({content:`**Error!**\n${error.message}`,embed:null})
                }
            }
        }
        info()
        serverInfo()
    }
    try{
        for(const id of config.messages){
            information = messages[config.messages.indexOf(id)]
            //console.log(information)
            client.requestHandler.request('PATCH',`/channels/${config.channel}/messages/${id}`,true, information)
        }
    }
    catch(error){
        return console.error(error)
    }
}

function run(){
    req()
    setInterval(()=>{
        req()
    },20000)
}

client.on('ready',async ()=>{
    client.editStatus('online',{type:3,name:'dyno.gg/status'})
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator} at ${new Date().toString()}`)
    if(!config.channel) throw new Error('Channel ID is invalid')
    else if(!config.messages){
        async function setup(){
            //Configures the messages
            try {
                let overview = await client.createMessage(config.channel,'Overview')
                let titan = await client.createMessage(config.channel,'Titan')
                let atlas = await client.createMessage(config.channel,'Atlas')
                let pandora = await client.createMessage(config.channel,'Pandora')
                let hyperion = await client.createMessage(config.channel,'Hyperion')
                let enceladus = await client.createMessage(config.channel,'Enceladus')
                let janus = await client.createMessage(config.channel,'Janus')
                overview = overview.id
                titan = titan.id
                atlas = atlas.id
                pandora = pandora.id
                hyperion = hyperion.id
                enceladus = enceladus.id
                janus = janus.id
                config.messages = [overview,titan,atlas,pandora,hyperion,enceladus,janus]
                await fs.writeFileSync(__dirname+'/config.json',JSON.stringify(config)) //Saves it in case bot restarts
            } catch (error) {
                throw new Error(error.stack)
            }
        }
        setup()
        run()
    }
    else if(typeof config.messages === 'object'){
        config.messages = Object.values(config.messages)
        await fs.writeFileSync(__dirname+'/config.json',JSON.stringify(config))
        run()
    }
    else run()
})

// You can do other stuff here

client.connect()
