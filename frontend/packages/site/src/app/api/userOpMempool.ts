import { NextApiRequest,NextApiResponse } from 'next';
import * as dotenv from 'dotenv';

dotenv.config();

export async function POST(req: NextApiRequest,res: NextApiResponse) {
    const sdk = require('api')('@stackup/v0.6#9j72valhd1dd90');

    try {
        const uoHash = await sdk.ethSenduseroperation(
            {
                jsonrpc: '2.0',
                id: req.body.id,
                method: 'eth_sendUserOperation',
                params: [
                    req.body.op,
                    '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
                ]
            }, {
                api_key:  process.env.API_KEY
            }
        )
        return res.status(200).json({ uoHash })
    } catch (e) {
        res.status(403).end();
    }
}