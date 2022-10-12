import { MyClient } from './structures/Client';
import { config } from 'dotenv';
config();

export const client = new MyClient();
client.start();
