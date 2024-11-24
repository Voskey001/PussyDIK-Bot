//base by Voskey
//re-upload? recode? copy code? give credit ya :)
//YouTube: @Voskey
//Telegram: https://t.me/Voskey
//GitHub: @Voskey
//WhatsApp: https://whatsapp.com/channel/0029VaFSC1RGE56irWiKvw32
//want more free bot scripts? subscribe to my youtube channel: https://youtube.com/@Voskey
require('./settings')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const { default: GlobalTechIncConnect, delay, makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto, Browsers} = require("@whiskeysockets/baileys")
const PHONENUMBER_MCC = require('./lib/PairingPatch');
const NodeCache = require("node-cache")
const Pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const makeWASocket = require("@whiskeysockets/baileys").default
const store = makeInMemoryStore({
    logger: pino().child({
        level: 'silent',
        stream: 'store'
    })
})
let phoneNumber = "254769079323"
let owner = JSON.parse(fs.readFileSync('./database/owner.json'))
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))
async function startGlobalTechInc() {
//------------------------------------------------------
let { version, isLatest } = await fetchLatestBaileysVersion()
const {  state, saveCreds } =await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache() // for retry message, "waiting message"
    const GlobalTechInc = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode, // popping up QR in terminal log
      browser: Browsers.windows('Firefox'), // for this issues https://github.com/WhiskeySockets/Baileys/issues/328
     auth: {
         creds: state.creds,
         keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
      },
      markOnlineOnConnect: true, // set false for offline
      generateHighQualityLinkPreview: true, // make high preview link
      getMessage: async (key) => {
         let jid = jidNormalizedUser(key.remoteJid)
         let msg = await store.loadMessage(jid, key.id)
         return msg?.message || ""
      },
      msgRetryCounterCache, // Resolve waiting messages
      defaultQueryTimeoutMs: undefined, // for this issues https://github.com/WhiskeySockets/Baileys/issues/276
   })
   store.bind(GlobalTechInc.ev)
    // login use pairing code
   // source code https://github.com/WhiskeySockets/Baileys/blob/master/Example/example.ts#L61
   if (pairingCode && !GlobalTechInc.authState.creds.registered) {
      if (useMobile) throw new Error('Cannot use pairing code with mobile api')
      let phoneNumber
      if (!!phoneNumber) {
         phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
         if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
            console.log(chalk.bgBlack(chalk.redBright("Start with country code of your WhatsApp Number, Example : 254769079323")))
            process.exit(0)
         }
      } else {
         phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFor example: 254769079323 : `)))
         phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
         // Ask again when entering the wrong number
         if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
            console.log(chalk.bgBlack(chalk.redBright("Start with country code of your WhatsApp Number, Example : 254769079323")))
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFor example: 254769079323 : `)))
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
            rl.close()
         }
      }
      setTimeout(async () => {
         let code = await GlobalTechInc.requestPairingCode(phoneNumber)
         code = code?.match(/.{1,4}/g)?.join("-") || code
         console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
      }, 3000)
   }
    GlobalTechInc.ev.on('messages.upsert', async chatUpdate => {
        //console.log(JSON.stringify(chatUpdate, undefined, 2))
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast' ) { // Added closing bracket
              if (!GlobalTechInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
              if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
              const m = smsg(GlobalTechInc, mek, store)
              require("./XeonBug8")(GlobalTechInc, m, chatUpdate, store)
            }
        } catch (err) {
            console.log(err)
        }
    })
    //autostatus view
        GlobalTechInc.ev.on('messages.upsert', async chatUpdate => {
          if (global.autoswview){
            mek = chatUpdate.messages[0]
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
              await GlobalTechInc.readMessages([mek.key]) }
            }
    })
    GlobalTechInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }
    GlobalTechInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = GlobalTechInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = {
                id,
                name: contact.notify
            }
        }
    })
    GlobalTechInc.getName = (jid, withoutContact = false) => {
        id = GlobalTechInc.decodeJid(jid)
        withoutContact = GlobalTechInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = GlobalTechInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
                id,
                name: 'WhatsApp'
            } : id === GlobalTechInc.decodeJid(GlobalTechInc.user.id) ?
            GlobalTechInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }
    GlobalTechInc.public = true
    GlobalTechInc.serializeM = (m) => smsg(GlobalTechInc, m, store)
GlobalTechInc.ev.on("connection.update",async  (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
          console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`🌿Connected to => ` + JSON.stringify(GlobalTechInc.user, null, 2)))
      await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${botname} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
          console.log(chalk.magenta(`\n${themeemoji} YT CHANNEL: Voskey`))
            console.log(chalk.magenta(`${themeemoji} GITHUB: Voskey `))
            console.log(chalk.magenta(`${themeemoji} WA NUMBER: ${owner}`))
            console.log(chalk.magenta(`${themeemoji} CREDIT: ${wm}\n`))
        }
        if (
            connection === "close" &&
            lastDisconnect &&
            lastDisconnect.error &&
            lastDisconnect.error.output.statusCode != 401
        ) {
            startGlobalTechInc()
        }
        if (
            connection === "close" &&
            lastDisconnect &&
            lastDisconnect.error &&
            lastDisconnect.error.output.statusCode === 401
        ) {
            console.log(chalk.bgBlack(chalk.redBright("Error: 401 Unauthorized")))
            console.log(chalk.bgBlack(chalk.redBright("Please check your internet connection or restart the bot")))
            process.exit(0)
        }
    })
    GlobalTechInc.ev.on('creds.update', saveCreds)
   GlobalTechInc.ev.on('group-participants.update', async (anu) => {
      console.log(anu)
    })
    GlobalTechInc.ev.on('group-update', async (anu) => {
      console.log(anu)
    })
    GlobalTechInc.ev.on("chats.update", async (chatsUpdate) => {
      // console.log(JSON.stringify(chatsUpdate, undefined, 2))
    })
    GlobalTechInc.ev.on("message-delete", async (m) => {
      // console.log(JSON.stringify(m, undefined, 2))
      // if (m.key.remoteJid == "status@broadcast") return // ignore status
      // if (!m.key.fromMe) return
      // if (m.key.id.startsWith("BAE5") && m.key.id.length === 16) return // ignore message ID like "BAE5..."
      // m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message
      // try {
      //   const chat = await GlobalTechInc.chatModify({ markAsRead: true, lastRead: m.key.id }, { remoteJid: m.key.remoteJid })
      //   const mtd = m.message.extendedTextMessage?.contextInfo?.quotedMessage.extendedTextMessage?.contextInfo?.participant || null
      //   const mmtd = m.message.extendedTextMessage?.contextInfo?.mentionedJid || []
      //   let msg = '```\n'
      //   msg += `• ${GlobalTechInc.getName(m.key.remoteJid)} \n`
      //   msg += `• ${m.key.id.slice(0, 10)}\n`
      //   msg += `• ${chat.read.length}\n`
      //   msg += `• ${chat.unread}\n`
      //   msg += `• ${chat.read.length + chat.unread}\n`
      //   msg += '\n```'
      //   // console.log(mtd, mmtd)
      //   // await GlobalTechInc.sendMessage(m.key.remoteJid, { text: msg }, { quoted: m.message })
      //   // await sleep(1999)
      //   // await GlobalTechInc.sendMessage(m.key.remoteJid, { text: '```\n' + '• ' + GlobalTechInc.getName(m.key.remoteJid) + '\n' + '• ' + m.key.id.slice(0, 10) + '\n' + '• ' + chat.read.length + '\n' + '• ' + chat.unread + '\n' + '• ' + chat.read.length + chat.unread + '\n' + '```' }, { quoted: m.message })
      // } catch (error) {
      //   // console.log(error)
      // }
    })
  //  GlobalTechInc.ev.on('call', async (phone) => {
  //  	console.log(phone);
  //  	if (phone.isGroup === false && phone.status === "ringing") {
  //  		console.log("Incoming Call from: " + phone.peerJid);
  //  		await GlobalTechInc.sendPresenceUpdate('unavailable', phone.peerJid);
  //  	}
  //  })
    GlobalTechInc.ev.on('call', async (phone) => {
        // console.log(phone);
        if (phone.isGroup === false && phone.status === "ringing") {
            // console.log("Incoming Call from: " + phone.peerJid);
            await GlobalTechInc.sendPresenceUpdate('unavailable', phone.peerJid);
        }
    })
    await GlobalTechInc.connect()
    .then((res) => {
        console.log(chalk.bgBlack(chalk.greenBright("🚀 Bot Started!")))
        console.log(chalk.bgBlack(chalk.greenBright("🚀 Waiting for incoming messages...")))
    })
    .catch((err) => {
        console.log(chalk.bgBlack(chalk.redBright(err)))
    })
}
startGlobalTechInc()
