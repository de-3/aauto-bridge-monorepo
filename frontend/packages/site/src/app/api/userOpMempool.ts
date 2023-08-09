import { NextApiRequest,NextApiResponse } from 'next';
import { Client, IClientOpts, ISendUserOperationOpts, IUserOperation, UserOperationBuilder } from "userop";

export async function POST(req: NextApiRequest,res: NextApiResponse) {

    const entrypoint:IClientOpts = {
        entryPoint: process.env.STACKUP_ENTRY_POINT,
        overrideBundlerRpc: process.env.STACKUP_RPC_URL,
    }

    const client = await Client.init(process.env.STACKUP_RPC_URL as string,entrypoint);

    const op:IUserOperation = req.body.op;
    const opts:ISendUserOperationOpts = {
        dryRun: true,
        onBuild: (op) => console.log("Signed UserOperation:", op),
    };

    const builder = new UserOperationBuilder().useDefaults(op);

    try {
        const response = await client.sendUserOperation(
            builder,
            opts
        );
        const userOperationEvent = await response.wait();
        return res.status(200).json({ userOperationEvent })
    } catch (e) {
        res.status(403).end();
    }
}