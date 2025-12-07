/**
 * Network Configuration
 * 
 * Configure your IOTA networks and package IDs here
 */

import { getFullnodeUrl } from "@iota/iota-sdk/client"
import { createNetworkConfig } from "@iota/dapp-kit"

// Package IDs - These will be automatically filled when you run `npm run iota-deploy`
export const DEVNET_PACKAGE_ID = "0x7503e5a5c0c864f24af9a30fa2d7b7f270a230ad451099f7d4ee3a2b22dd2bc5"
export const TESTNET_PACKAGE_ID = ""
export const MAINNET_PACKAGE_ID = ""

// Game State ID - Shared object created when contract was deployed
export const GAME_STATE_ID = "0x9fad23cd3df0a226656c36d42fe966d8a88f7e8872663aaf9c860b807c939dc3"

// Network configuration
const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl("devnet"),
    variables: {
      packageId: DEVNET_PACKAGE_ID,
    },
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
    variables: {
      packageId: TESTNET_PACKAGE_ID,
    },
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    variables: {
      packageId: MAINNET_PACKAGE_ID,
    },
  },
})

export { useNetworkVariable, useNetworkVariables, networkConfig }
