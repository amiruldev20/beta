/*
 * MywaJS 2023
 * re-developed wwebjs
 * using with playwright & wajs
 * contact:
 * wa: 085157489446
 * ig: amirul.dev
 */

'use strict';

const PrivateContact = require('../structures/PrivateContact');
const BusinessContact = require('../structures/BusinessContact');

class ContactFactory {
    static create(client, data) {
        if(data.isBusiness) {
            return new BusinessContact(client, data);
        }

        return new PrivateContact(client, data);
    }
}

module.exports = ContactFactory;