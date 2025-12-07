/**
 * Network Configuration
 * 
 * Configure your IOTA networks and package IDs here
 */

import { getFullnodeUrl } from "@iota/iota-sdk/client"
import { createNetworkConfig } from "@iota/dapp-kit"

// Package IDs - These will be automatically filled when you run `npm run iota-deploy`
export const DEVNET_PACKAGE_ID = "0x7c7bb7973908ae00e848621947aa36ab02e227c1fdebaf187c0d3935e70d2615"
export const TESTNET_PACKAGE_ID = "0x3e714df16456da7adb8cb8a2dbfae12271bc4af08a948ef029589f66168b3654"
export const MAINNET_PACKAGE_ID = ""

// Game State ID - Shared object created when contract was deployed
export const GAME_STATE_ID = "0x2e2978a90444bacf71f0e1c1265c425dd665163424462b73d7f9d4411f31d882"

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
