import { config } from 'dotenv';

import { MyClient } from './structures/Client';
config();

export const client = new MyClient();
client.start();
