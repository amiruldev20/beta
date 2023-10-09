/*
 * MywaJS 2023
 * re-developed wwebjs
 * using with playwright & wajs
 * contact:
 * wa: 085157489446
 * ig: amirul.dev
 */

'use strict';

export { default as Client } from './src/Client.js';

// Structures
export {
    Chat,
    PrivateChat,
    GroupChat,
    Message,
    MessageMedia,
    Contact,
    PrivateContact,
    BusinessContact,
    ClientInfo,
    Location,
    ProductMetadata,
    List,
    Buttons,
    PollVote,
    Call,
    LinkingMethod
} from './src/structures/index.js';

// Auth Strategies
export { default as NoAuth } from './src/authStrategies/NoAuth.js'
export { default as LocalAuth } from './src/authStrategies/LocalAuth.js'
export { default as RemoteAuth } from './src/authStrategies/RemoteAuth.js'
export { default as LegacySessionAuth } from './src/authStrategies/LegacySessionAuth.js'

export * from './src/util/Constants.js';