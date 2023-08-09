import { NextApiRequest,NextApiResponse } from 'next';
import * as dotenv from 'dotenv';

dotenv.config();

export async function POST(req: NextApiRequest,res: NextApiResponse) {
    const sdk = require('api')('@stackup/v0.6#9j72valhd1dd90');


    /**
     * 
     * sender: オペレーションの送信者
     * nonce: ユーザーの nonce
     * initCode: 初期化コード
     * callData: コールデータ
     * callGasLimit: コールのガスリミット
     * verificationGasLimit: 検証のガスリミット
     * preVerificationGas: 事前検証のガス
     * maxFeePerGas: ガスあたりの最大手数料
     * maxPriorityFeePerGas: ガスあたりの最大優先手数料
     * paymasterAndData: Paymaster とデータ
     * signature: 署名
     * 
     */
    interface op {
        sender: string;
        nonce: string;
        initCode: string;
        callData: string;
        callGasLimit: string;
        verificationGasLimit: string;
        preVerificationGas: string;
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
        paymasterAndData: string;
        signature: string;
    }

    const op:op = req.body.op

    try {
        const uoHash = await sdk.ethSenduseroperation(
            {
                jsonrpc: '2.0',
                id: req.body.id,
                method: 'eth_sendUserOperation',
                params: [
                    op,
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