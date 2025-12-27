import { Account, Client, Databases, Functions, Storage, Teams } from 'appwrite'
import { env } from './env'

export const client = new Client().setEndpoint(env.endpoint).setProject(env.projectId)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const teams = new Teams(client)
export const functions = new Functions(client)
