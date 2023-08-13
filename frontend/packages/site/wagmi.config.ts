import { defineConfig } from '@wagmi/cli'
import { Abi } from 'viem'
import abi from '../../../contract/abi/contracts/AccountManager.sol/AccountManager.json'

export default defineConfig({
  out: 'src/utils/abi.ts',
  contracts: [
    {
      name: 'accountManager',
      abi: abi as Abi,
    },
  ],
  plugins: [],
})
