/*
 * MywaJS 2023
 * re-developed wwebjs
 * using with playwright & wajs
 * contact:
 * wa: 085157489446
 * ig: amirul.dev
 */

'use strict';

/**
 * Interface Controller
 */
class InterfaceController {

    constructor(props) {
        this.mPage = props.mPage;
    }

    /**
     * Opens the Chat Window
     * @param {string} chatId ID of the chat window that will be opened
     */
    async openChatWindow(chatId) {
        await this.mPage.evaluate(async chatId => {
            let chatWid = window.Store.WidFactory.createWid(chatId);
            let chat = await window.Store.Chat.find(chatWid);
            await window.Store.Cmd.openChatAt(chat);
        }, chatId);
    }

    /**
     * Opens the Chat Drawer
     * @param {string} chatId ID of the chat drawer that will be opened
     */
    async openChatDrawer(chatId) {
        await this.mPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.openDrawerMid(chat);
        }, chatId);
    }

    /**
     * Opens the Chat Search
     * @param {string} chatId ID of the chat search that will be opened
     */
    async openChatSearch(chatId) {
        await this.mPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.chatSearch(chat);
        }, chatId);
    }

    /**
     * Opens or Scrolls the Chat Window to the position of the message
     * @param {string} msgId ID of the message that will be scrolled to
     */
    async openChatWindowAt(msgId) {
        await this.mPage.evaluate(async msgId => {
            let msg = await window.Store.Msg.get(msgId);
            let chat = await window.Store.Chat.find(msg.id.remote);
            let searchContext = await window.Store.SearchContext(chat,msg);
            await window.Store.Cmd.openChatAt(chat, searchContext);
        }, msgId);
    }

    /**
     * Opens the Message Drawer
     * @param {string} msgId ID of the message drawer that will be opened
     */
    async openMessageDrawer(msgId) {
        await this.mPage.evaluate(async msgId => {
            let msg = await window.Store.Msg.get(msgId);
            await window.Store.Cmd.msgInfoDrawer(msg);
        }, msgId);
    }

    /**
     * Closes the Right Drawer
     */
    async closeRightDrawer() {
        await this.mPage.evaluate(async () => {
            await window.Store.DrawerManager.closeDrawerRight();
        });
    }

    /**
     * Get all Features
     */
    async getFeatures() {
        return await this.mPage.evaluate(() => {
            if(!window.Store.Features) throw new Error('This version of Whatsapp Web does not support features');
            return window.Store.Features.F;
        });
    }

    /**
     * Check if Feature is enabled
     * @param {string} feature status to check
     */
    async checkFeatureStatus(feature) {
        return await this.mPage.evaluate((feature) => {
            if(!window.Store.Features) throw new Error('This version of Whatsapp Web does not support features');
            return window.Store.Features.supportsFeature(feature);
        }, feature);
    }

    /**
     * Enable Features
     * @param {string[]} features to be enabled
     */
    async enableFeatures(features) {
        await this.mPage.evaluate((features) => {
            if(!window.Store.Features) throw new Error('This version of Whatsapp Web does not support features');
            for (const feature in features) {
                window.Store.Features.setFeature(features[feature], true);
            }
        }, features);
    }

    /**
     * Disable Features
     * @param {string[]} features to be disabled
     */
    async disableFeatures(features) {
        await this.mPage.evaluate((features) => {
            if(!window.Store.Features) throw new Error('This version of Whatsapp Web does not support features');
            for (const feature in features) {
                window.Store.Features.setFeature(features[feature], false);
            }
        }, features);
    }
}

export default InterfaceController
