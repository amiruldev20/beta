/*
 * MywaJS 2023
 * re-developed wwebjs
 * using with playwright & wajs
 * contact:
 * wa: 085157489446
 * ig: amirul.dev
 */

'use strict';

import Contact from "./Contact.js";

/**
 * Represents a Business Contact on WhatsApp
 * @extends {Contact}
 */
class BusinessContact extends Contact {
    _patch(data) {
        /**
         * The contact's business profile
         */
        this.businessProfile = data.businessProfile;

        return super._patch(data);
    }

}

export default BusinessContact;