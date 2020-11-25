import fs from 'fs'

// hacky JSON database for storing user-number entry key-value pairs
class Counts {
    private counts: Record<string, number>
    private path: string

    constructor(path: string) {
        this.path = path
        try {
            this.counts = JSON.parse(fs.readFileSync(path).toString())
        } catch (err) {
            throw new Error(`Error when initializing count DB: ${err}`)
        }
    }

    clear() {
        this.counts = {}
        fs.writeFileSync(this.path, '{}')
    }

    size(): number {
        return Object.keys(this.counts).length
    }

    has(uid: string): boolean {
        return this.counts[uid] !== undefined
    }

    get(uid: string): number {
        return this.counts[uid]
    }

    set(uid: string, num: number) {
        this.counts[uid] = num
        fs.writeFileSync(this.path, JSON.stringify(this.counts))
    }

    getEntries(): [string, number][] {
        return Object.entries(this.counts)
    }

    getCountOfUsersWithNum(num: number) {
        return Object.values(this.counts)
            .reduce((acc, el) => 
                acc + (el === num ? 1 : 0), 
                0
            )
    }
}

export default Counts