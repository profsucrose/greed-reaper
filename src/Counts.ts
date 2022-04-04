import { Client } from '@replit/database'

// Repl.it DB adapter class
class Counts {
    private client = new Client()

    clear() {
        this.client.empty()
    }

    size(): number {
        return Object.keys(this.client.getAll()).length
    }

    async has(uid: string): Promise<boolean> {
        return this.client.get(uid) != undefined
    }

    async get(uid: string): Promise<number> {
        return Number(await this.client.get(uid))
    }

    set(uid: string, num: number) {
        this.client.set(uid, num)
    }

    getEntries(): [string, number][] {
        return Object.entries(this.client.getAll())
    }

    getCountOfUsersWithNum(num: number) {
        return Object.values(this.client.getAll())
            .reduce((acc, el) => 
                acc + (el === num ? 1 : 0), 
                0
            )
    }
}

export default Counts