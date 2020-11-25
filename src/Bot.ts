import { 
    AckFn, 
    App, 
    RespondArguments, 
    RespondFn,  
    SlashCommand 
} from '@slack/bolt'
import Counts from './Counts'

// hour of day when game concludes
const TIMER_END_HOUR = 0 // 12:00 AM
const CHANNEL_ID = 'C018F56QC9G'

class Bot {
    // state
    private counts: Counts
    private app: App
    private token: string

    constructor(token: string, signingSecret: string, path: string) {
        this.token = token
        this.app = new App({
            token,
            signingSecret
        })
        this.app.command('/greed', async ({ command, ack, respond }) => 
            this.onCommand(command, ack, respond)
        )
        this.counts = new Counts(path)
        this.counts.clear()
    }

    public async start(port: number) {
        this.startTimer()
        await this.app.start(port)
    }

    public async startTimer() {
        const date = new Date()
        const hour = date.getHours()
        const minutes = date.getMinutes()
        const seconds = date.getSeconds()
        const milliseconds = date.getMilliseconds()

        const hourDiff = this.calcLeftToTime(hour, TIMER_END_HOUR, 24)
        const minuteDiff = this.calcLeftToTime(minutes, 0, 60)
        const secondDiff = this.calcLeftToTime(seconds, 0, 0)
        const millisecondDiff = this.calcLeftToTime(milliseconds, 0, 1000)

        setTimeout(
            () => this.onDayEnd(), 
            hourDiff * 60 * 60 * 1000 
                + minuteDiff * 60 * 1000 
                + secondDiff * 1000
                + millisecondDiff
        )
    }

    private onDayEnd() { 
        // restart timer one second later
        // use closure to inherit scope
        setTimeout(() => this.startTimer(), 1000)

        // return if no entries exist for that day
        if (this.counts.size() === 0) 
            return

        if (this.counts.size() === 1) {
            this.sendMessage(CHANNEL_ID, `Only <@${this.counts.getEntries[0][0]}> entered a number for today!`)
            return
        }

        if (this)

        this.sendMessage(
            CHANNEL_ID,
            `\`\`\`Today's game is now over!
The results are the following:
${
    this.counts
        .getEntries()
        .map(([user, num]) => 
            [user, num / this.counts.getCountOfUsersWithNum(num), num]
        )
        .sort(([_user, num1], [_user1, num2]) => 
            num1 === num2
                ? 0
                : num1 > num2 
                    ? 1 
                    : -1
        )
        .map(([user, num, original]) =>
            `<@${user}> entered ${original} and got ${num}`
        )
        .join('\n')
}\`\`\``
        )
        // reset counts
        this.counts.clear()
    }

    private calcLeftToTime(time: number, target: number, maxUnit: number) {
        return time > target
            ? maxUnit - time + target
            : time
    }

    async onCommand(command: SlashCommand, ack: AckFn<string | RespondArguments>, respond: RespondFn) {
        await ack()
        const { user_id, text } = command
        if (text === '') {
            await respond({ 
                text: this.counts.has(user_id)
                    ? `You currently have ${this.counts.get(user_id)} registered for today (Game ends at ${this.formatHour(TIMER_END_HOUR)}!)`
                    : `You do not have a number registered for today (Game ends at ${this.formatHour(TIMER_END_HOUR)}!)`
            })
            return
        }
        
        if (!/^[0-9]+$/.test(text)) {
            await respond({ text: 'Your entry must be a valid number!' })
            return;
        }

        const num = parseInt(text, 10);
        if (num < 0 || num > 20) {
            await respond({ text: 'Your number must be between 0 and 20' })
            return
        }

        if (this.counts.has(user_id)) {
            await respond({ text: `You already have ${this.counts.get(user_id)} registered for today! (Game ends at ${this.formatHour(TIMER_END_HOUR)}!)` })
            return
        }

        this.counts.set(user_id, num)
        await respond({ text: `Registered ${num} as your number! (Game ends at ${this.formatHour(TIMER_END_HOUR)}!)` })
        if (this.counts.size() === 1) {
            await this.sendMessage(CHANNEL_ID, `<@${user_id}> has made the first entry for today! There will be a winner today if someone else makes an entry!`)
        } else {
            await this.sendMessage(CHANNEL_ID, `<@${user_id}> has made their entry!`)
        }
    }

    private sendMessage(channel: string, text: string) {
        return new Promise(async (resolve, reject) => {
            this.app
                .client
                .chat
                .postMessage({
                    token: this.token,
                    channel,
                    text
                })
                .then(resolve)
                .catch(reject)
        })
    }

    private formatHour(hour: number) {
        return `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour > 12 ? 'PM' : 'AM'} PST`
    }
}

export default Bot