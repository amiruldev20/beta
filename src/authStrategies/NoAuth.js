/*
 * MywaJS 2023
 * re-developed wwebjs
 * using with playwright & wajs
 * contact:
 * wa: 085157489446
 * ig: amirul.dev
 */

'use strict';

const BaseAuthStrategy = require('./BaseAuthStrategy');

/**
 * No session restoring functionality
 * Will need to authenticate via QR code every time
*/
class NoAuth extends BaseAuthStrategy { }


module.exports = NoAuth;