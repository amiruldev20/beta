/*
 * MywaJS 2023
 * re-developed wwebjs
 * using with playwright & wajs
 * contact:
 * wa: 085157489446
 * ig: amirul.dev
 */

'use strict';

import Chat from './Chat.js';

/**
 * Group participant information
 * @typedef {Object} GroupParticipant
 * @property {ContactId} id
 * @property {boolean} isAdmin
 * @property {boolean} isSuperAdmin
 */

/**
 * Represents a Group Chat on WhatsApp
 * @extends {Chat}
 */
class GroupChat extends Chat {
    _patch(data) {
        this.groupMetadata = data.groupMetadata;

        return super._patch(data);
    }

    /**
     * Gets the group owner
     * @type {ContactId}
     */
    get owner() {
        return this.groupMetadata.owner;
    }

    /**
     * Gets the date at which the group was created
     * @type {date}
     */
    get createdAt() {
        return new Date(this.groupMetadata.creation * 1000);
    }

    /** 
     * Gets the group description
     * @type {string}
     */
    get description() {
        return this.groupMetadata.desc;
    }

    /**
     * Gets the group participants
     * @type {Array<GroupParticipant>}
     */
    get participants() {
        return this.groupMetadata.participants;
    }

    /**
     * Adds a list of participants by ID to the group
     * @param {Array<string>} participantIds 
     * @returns {Promise<Object>}
     */
    async addParticipants(participantIds, options = {}) {
        const data = await this.client.mPage.evaluate(async ({ groupId, participantIds, options }) => {
            const { sleep = 500, autoSendInviteV4 = true, comment = '' } = options;
            const groupWid = window.Store.WidFactory.createWid(groupId);
            const group = await window.Store.Chat.find(groupWid);
            !Array.isArray(participantIds) && (participantIds = [participantIds]);

            let participantsToAdd = await Promise.all(participantIds.map(async p => {
                const wid = window.Store.WidFactory.createWid(p);
                return await window.Store.Contact.find(wid);
            }));

            const data = {};

            const resultCodes = {
                default: 'AddParticipantsError: An unknown error occupied while adding a participant',
                isGroupEmpty: 'AddParticipantsError: You can\'t add a participant to an empty group',
                iAmNotAdmin: 'AddParticipantsError: You have no admin rights to add a participant to a group',
                200: 'The participant was added successfully',
                403: 'The participant can be added by sending private invitation only',
                408: 'You cannot add this participant because they recently left the group',
                409: 'The participant is already a group member',
                417: 'The participant can\'t be added to the community. You can invite them privately to join this group through its invite link',
                419: 'The participant can\'t be added because the group is full'
            };

            const groupMetadata = group.groupMetadata;
            const groupParticipants = groupMetadata?.participants;

            if (!groupParticipants) {
                return resultCodes.isGroupEmpty;
            }

            if (!groupParticipants.canAdd()) {
                return resultCodes.iAmNotAdmin;
            }

            for (const participant of participantsToAdd) {
                const participantId = participant.id._serialized;

                data[participantId] = {
                    code: undefined,
                    message: undefined,
                    isInviteV4Sent: false
                };

                if (groupParticipants.some(p => p.id._serialized === participantId)) {
                    data[participantId].code = 409;
                    data[participantId].message = resultCodes[409];
                    continue;
                }

                const result =
                    await window.WWebJS.getAddParticipantsRpcResult(groupMetadata, groupWid, participant.id);
                const code = result.code;

                if (code === 403) {
                    window.Store.ContactCollection.gadd(participant.id, { silent: true });
                }

                data[participantId].code = code;
                data[participantId].message = code === -1
                    ? result.message
                    : resultCodes[code] || resultCodes.default;

                if (autoSendInviteV4 && [403, 417].includes(code)) {
                    let userChat, isInviteV4Sent = false;

                    if (result.name === 'ParticipantRequestCodeCanBeSent' &&
                        (userChat = await window.Store.Chat.find(participant.id))) {
                        const groupName = group.formattedTitle || group.name;
                        const res = await window.Store.GroupUtils.sendGroupInviteMessage(
                            userChat,
                            group.id._serialized,
                            groupName,
                            result.inviteV4Code,
                            result.inviteV4CodeExp,
                            comment,
                            await window.WWebJS.getProfilePicThumbBase64(groupWid)
                        );
                        isInviteV4Sent = res === 'OK';
                    }

                    data[participantId].isInviteV4Sent = isInviteV4Sent;
                }

                sleep && participantsToAdd.length > 1 &&
                    await new Promise(resolve => setTimeout(resolve, sleep));
            }

            return JSON.stringify(data);
        }, { groupId: this.id._serialized, participantIds, options });

        return JSON.parse(data);
    }

    /**
     * Removes a list of participants by ID to the group
     * @param {Array<string>} participantIds 
     * @returns {Promise<Object>}
     */
    async removeParticipants(participantIds) {
        if (!Array.isArray(participantIds)) {
            participantIds = [participantIds]
        } else {
            participantIds = participantIds
        }

        return await this.client.mPage.evaluate(async ({ chatId, participantIds }) => {
            return await window.WWebJS.group.removeParticipants(chatId, participantIds)
        }, { chatId: this.id._serialized, participantIds });
    }

    /**
     * Promotes participants by IDs to admins
     * @param {Array<string>} participantIds 
     * @returns {Promise<{ status: number }>} Object with status code indicating if the operation was successful
     */
    async promoteParticipants(participantIds) {
        if (!Array.isArray(participantIds)) {
            participantIds = [participantIds]
        } else {
            participantIds = participantIds
        }

        return await this.client.mPage.evaluate(async ({ chatId, participantIds }) => {
            return await window.WWebJS.group.promoteParticipants(chatId, participantIds)
        }, { chatId: this.id._serialized, participantIds });
    }

    /**
     * Demotes participants by IDs to regular users
     * @param {Array<string>} participantIds 
     * @returns {Promise<{ status: number }>} Object with status code indicating if the operation was successful
     */
    async demoteParticipants(participantIds) {
        if (!Array.isArray(participantIds)) {
            participantIds = [participantIds]
        } else {
            participantIds = participantIds
        }

        return await this.client.mPage.evaluate(async ({ chatId, participantIds }) => {
            return await window.WWebJS.group.demoteParticipants(chatId, participantIds)
        }, { chatId: this.id._serialized, participantIds });
    }

    /**
     * Updates the group subject
     * @param {string} subject 
     * @returns {Promise<boolean>} Returns true if the subject was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setSubject(subject) {
        const success = await this.client.mPage.evaluate(async ({ chatId, subject }) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                await window.Store.GroupUtils.setGroupSubject(chatWid, subject);
                return true;
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, { chatId: this.id._serialized, subject });

        if (!success) return false;
        this.name = subject;
        return true;
    }

    /**
     * Updates the group description
     * @param {string} description 
     * @returns {Promise<boolean>} Returns true if the description was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setDescription(description) {
        const success = await this.client.mPage.evaluate(async ({ chatId, description }) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            let descId = window.Store.GroupMetadata.get(chatWid).descId;
            try {
                await window.Store.GroupUtils.setGroupDescription(chatWid, description, window.Store.MsgKey.newId(), descId);
                return true;
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, { chatId: this.id._serialized, description });

        if (!success) return false;
        this.groupMetadata.desc = description;
        return true;
    }

    /**
     * Updates the group settings to only allow admins to send messages.
     * @param {boolean} [adminsOnly=true] Enable or disable this option 
     * @returns {Promise<boolean>} Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setMessagesAdminsOnly(adminsOnly = true) {
        const success = await this.client.mPage.evaluate(async ({ chatId, adminsOnly }) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                await window.Store.GroupUtils.setGroupProperty(chatWid, 'announcement', adminsOnly ? 1 : 0);
                return true;
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, { chatId: this.id._serialized, adminsOnly });

        if (!success) return false;

        this.groupMetadata.announce = adminsOnly;
        return true;
    }

    /**
     * set the group settings to enable or disable approval mode
     * @param {boolean} [adminsOnly=true] Enable or disable this option 
     * @returns {Promise<boolean>} Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setMemberApprovalMode(adminsOnly = true) {
        const succes = await this.client.mPage.evaluate(async ({ chatId, adminsOnly }) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                await window.Store.GroupUtils.setGroupProperty(chatWid, 'membership_approval_mode', adminsOnly ? 1 : 0);
                return true;
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, { chatId: this.id._serialized, adminsOnly })

        if (!success) return false;

        this.groupMetadata.membershipApprovalMode = adminsOnly;
        return true;
    }

    /**
     * Updates the group settings to only allow admins to edit group info (title, description, photo).
     * @param {boolean} [adminsOnly=true] Enable or disable this option 
     * @returns {Promise<boolean>} Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setInfoAdminsOnly(adminsOnly = true) {
        const success = await this.client.mPage.evaluate(async ({ chatId, adminsOnly }) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                await window.Store.GroupUtils.setGroupProperty(chatWid, 'restrict', adminsOnly ? 1 : 0);
                return true;
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, { chatId: this.id._serialized, adminsOnly });

        if (!success) return false;

        this.groupMetadata.restrict = adminsOnly;
        return true;
    }

    /**
     * Gets the invite code for a specific group
     * @returns {Promise<string>} Group's invite code
     */
    async getInviteCode() {
        const codeRes = await this.client.mPage.evaluate(async chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            return window.Store.Invite.queryGroupInviteCode(chatWid);
        }, this.id._serialized);

        return codeRes.code;
    }

    /**
     * Invalidates the current group invite code and generates a new one
     * @returns {Promise<string>} New invite code
     */
    async revokeInvite() {
        const codeRes = await this.client.mPage.evaluate(chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            return window.Store.Invite.resetGroupInviteCode(chatWid);
        }, this.id._serialized);

        return codeRes.code;
    }

    /**
     * Deletes the group's picture.
     * @returns {Promise<boolean>} Returns true if the picture was properly deleted. This can return false if the user does not have the necessary permissions.
     */
    async deletePicture() {
        const success = await this.client.mPage.evaluate((chatid) => {
            return window.WWebJS.deletePicture(chatid);
        }, this.id._serialized);

        return success;
    }

    /**
     * Sets the group's picture.
     * @param {MessageMedia} media
     * @returns {Promise<boolean>} Returns true if the picture was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setPicture(media, type = 'normal') {
        const success = await this.client.mPage.evaluate(({ chatid, media, type }) => {
            return window.WWebJS.setPicture(chatid, media, type);
        }, { chatId: this.id._serialized, media, type });

        return success;
    }

    /**
     * Makes the bot leave the group
     * @returns {Promise}
     */
    async leave() {
        await this.client.mPage.evaluate(async chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = await window.Store.Chat.find(chatWid);
            return window.Store.GroupUtils.sendExitGroup(chat);
        }, this.id._serialized);
    }

    /**
     * 
     * @param {String} type
     * @returns {Promise<void>} 
     */
    async reportExitClear(type = 'AccountInfoReport') {
        await this.client.mPage.evaluate(async ({ chatId, type }) => {
            const Wid = window.Store.WidFactory.createWid(chatId)
            const chat = window.Store.Chat.get(Wid)

            const SpamFlow = window.Store.SpamFlow
            if (!(type in SpamFlow)) throw `Type Not Found\n\n${Object.keys(SpamFlow).join('\n')}`

            return await window.Store.GroupUtils.sendSpamExitClear(chat, SpamFlow[type])
        }, { chatId: this.id._serialized, type })
    }

    /**
     * 
     * @param {String} participant 
     * @returns {Promise<void>}
     */
    async rejectRequest(participant) {
        await this.client.mPage.evaluate(({ chatId, participant }) => {
            return window.WWebJS.group.reject(chatId, participant)
        }, { chatId: this.id._serialized, participant })
    }

    /**
     * 
     * @param {String} participant 
     * @returns {Promise<void>}
     */
    async approveRequest(participant) {
        await this.client.mPage.evaluate(({ chatId, participant }) => {
            return window.WWebJS.group.approve(chatId, participant)
        }, { chatId: this.id._serialized, participant })
    }

    /**
     * 
     * @returns {Promise<Array>}
     */
    async getMemberRequest() {
        return await this.client.mPage.evaluate((chatId) => {
            return window.WWebJS.group.getMembershipRequests(chatId)
        }, this.id._serialized)
    }
}

export default GroupChat