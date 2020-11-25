import Bot from './Bot'
import * as dotenv from 'dotenv'
dotenv.config()

const bot = new Bot(
    process.env.TOKEN, 
    process.env.SIGNING_SECRET, 
    `${__dirname}/../data/counts.json`
)

;(async () => {
    await bot.start(3000)
    console.log(`The Slack app has started!`)
})()