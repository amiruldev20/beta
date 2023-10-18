/*
 * MywaJS 2023
 * re-developed wwebjs
 * using with playwright & wajs
 * contact:
 * wa: 085157489446
 * ig: amirul.dev
 */
"use strict";

// Exposes the internal Store to the WhatsApp Web client
export const ExposeStore = (moduleRaidStr) => {
    eval("var moduleRaid = " + moduleRaidStr);
    // eslint-disable-next-line no-undef
    window.mR = moduleRaid();
    window.Store = Object.assign({},
        window.mR.findModule((m) => m.default && m.default.Chat)[0].default
    );
    window.Store.AppState = window.mR.findModule("Socket")[0].Socket;
    window.Store.Conn = window.mR.findModule("Conn")[0].Conn;
    window.Store.BlockContact = window.mR.findModule("blockContact")[0];
    window.Store.Call = window.mR.findModule((module) => module.default && module.default.Call)[0].default.Call;
    window.Store.Cmd = window.mR.findModule("Cmd")[0].Cmd;
    window.Store.CryptoLib = window.mR.findModule("decryptE2EMedia")[0];
    window.Store.DownloadManager =
        window.mR.findModule("downloadManager")[0].downloadManager;
    window.Store.GroupMetadata =
        window.mR.findModule("GroupMetadata")[0].default.GroupMetadata;
    window.Store.Invite = window.mR.findModule("resetGroupInviteCode")[0];
    window.Store.InviteInfo = window.mR.findModule("queryGroupInvite")[0];
    window.Store.Label =
        window.mR.findModule("LabelCollection")[0].LabelCollection;
    window.Store.ContactCollection = window.mR.findModule('ContactCollection')[0].ContactCollection;
    window.Store.MediaPrep = window.mR.findModule("prepRawMedia")[0];
    window.Store.MediaObject = window.mR.findModule("getOrCreateMediaObject")[0];
    window.Store.NumberInfo = window.mR.findModule("formattedPhoneNumber")[0];
    window.Store.MediaTypes = window.mR.findModule("msgToMediaType")[0];
    window.Store.MediaUpload = window.mR.findModule("uploadMedia")[0];
    window.Store.UploadLimits = window.mR.findModule('getUploadLimit')[0].getUploadLimit;
    window.Store.MsgKey = window.mR.findModule(
        (module) => module.default && module.default.fromString
    )[0].default;
    window.Store.MessageInfo = window.mR.findModule("sendQueryMsgInfo")[0];
    window.Store.OpaqueData = window.mR.findModule(
        (module) => module.default && module.default.createFromData
    )[0].default;
    window.Store.QueryExist = window.mR.findModule("queryExists")[0] ?
        window.mR.findModule("queryExists")[0].queryExists :
        window.mR.findModule("queryExist")[0].queryWidExists;
    window.Store.QueryProduct = window.mR.findModule("queryProduct")[0];
    window.Store.QueryOrder = window.mR.findModule("queryOrder")[0];
    window.Store.SendClear = window.mR.findModule("sendClear")[0];
    window.Store.SendDelete = window.mR.findModule("sendDelete")[0];
    window.Store.SendMessage = window.mR.findModule("addAndSendMsgToChat")[0];
    window.Store.SendSeen = window.mR.findModule("sendSeen")[0];
    window.Store.SendVote = window.mR.findModule("sendVote")[0];
    window.Store.SpamFlow = window.mR.findModule("SpamFlow")[0].SpamFlow;
    window.Store.User = window.mR.findModule("getMaybeMeUser")[0];
    window.Store.Theme = window.mR.findModule((module) =>
        module.getTheme && module.setTheme ? module : null
    )[0];
    window.Store.UploadUtils = window.mR.findModule((module) =>
        module.default && module.default.encryptAndUpload ? module.default : null
    )[0].default;
    window.Store.UserConstructor = window.mR.findModule((module) =>
        module.default &&
        module.default.prototype &&
        module.default.prototype.isServer &&
        module.default.prototype.isUser ?
        module.default :
        null
    )[0].default;
    window.Store.Validators = window.mR.findModule("findLinks")[0];
    window.Store.VCard = window.mR.findModule("vcardFromContactModel")[0];
    window.Store.VCardParse = window.mR.findModule("WA_BIZ_NAME")[0];
    window.Store.WidFactory = window.mR.findModule("createWid")[0];
    window.Store.ProfilePic = window.mR.findModule("profilePicResync")[0];
    window.Store.PresenceUtils = window.mR.findModule("sendPresenceAvailable")[0];
    window.Store.ChatState = window.mR.findModule("sendChatStateComposing")[0];
    window.Store.GroupParticipants = window.mR.findModule(
        "promoteParticipants"
    )[0];
    window.Store.JoinInviteV4 = window.mR.findModule(
        "queryGroupInviteV4"
    )[0];
    window.Store.findCommonGroups =
        window.mR.findModule("findCommonGroups")[0].findCommonGroups;
    window.Store.findMessage = window.mR.findModule("msgFindQuery")[1];
    window.Store.StatusUtils = window.mR.findModule("setMyStatus")[0];
    window.Store.ConversationMsgs = window.mR.findModule("loadEarlierMsgs")[0];
    window.Store.sendReactionToMsg =
        window.mR.findModule("sendReactionToMsg")[0].sendReactionToMsg;
    window.Store.ChangeEphemeralDuration = window.mR.findModule(
        "changeEphemeralDuration"
    )[0].changeEphemeralDuration;
    window.Store.createOrUpdateReactionsModule = window.mR.findModule(
        "createOrUpdateReactions"
    )[0];
    window.Store.EphemeralFields = window.mR.findModule("getEphemeralFields")[0];
    window.Store.ReplyUtils =
        window.mR.findModule("canReplyMsg").length > 0 &&
        window.mR.findModule("canReplyMsg")[0];
    window.Store.MsgActionChecks = window.mR.findModule("canSenderRevokeMsg")[0];
    window.Store.QuotedMsg = window.mR.findModule("getQuotedMsgObj")[0];
    window.Store.Socket = window.mR.findModule("deprecatedSendIq")[0];
    window.Store.SocketWap = window.mR.findModule("wap")[0];
    window.Store.SearchContext =
        window.mR.findModule("getSearchContext")[0].getSearchContext;
    window.Store.DrawerManager =
        window.mR.findModule("DrawerManager")[0].DrawerManager;
    window.Store.Functions = {
        ...window.mR.findModule("randomHex")[0],
    };
    window.Store.WebSocket = {
        ...window.mR.findModule("smax")[0],
        ...window.mR.findModule("getFanOutList")[0],
        ...window.mR.findModule("ensureE2ESessions")[0],
        ...window.mR.findModule("encryptMsgProtobuf")[0],
        ...window.mR.findModule("sendSmaxStanza")[0],
    };
    window.Store.MultiDevice = {
        ...window.mR.findModule("getADVEncodedIdentity")[0],
        ...window.mR.findModule("waNoiseInfo")[0],
        ...window.mR.findModule("waSignalStore")[0].waSignalStore,
    };
    window.Store.LidManipulations = window.mR.findModule('getCurrentLid')[0];
    window.Store.WidToJid = window.mR.findModule('widToUserJid')[0];
    window.Store.JidToWid = window.mR.findModule('userJidToUserWid')[0];
    window.Store.StickerTools = {
        ...window.mR.findModule("toWebpSticker")[0],
        ...window.mR.findModule("addWebpMetadata")[0],
    };

    window.Store.GroupUtils = {
        ...window.mR.findModule("createGroup")[0],
        ...window.mR.findModule("setGroupDescription")[0],
        ...window.mR.findModule("sendExitGroup")[0],
        ...window.mR.findModule("sendSetPicture")[0],
        ...window.mR.findModule("sendMessageReport")[0],
        sendAddParticipantsRPC: window.mR.findModule('sendAddParticipantsRPC')[0].sendAddParticipantsRPC,
        sendGroupInviteMessage: window.mR.findModule('sendGroupInviteMessage')[0].sendGroupInviteMessage
    };

    if (!window.Store.Chat._find) {
        window.Store.Chat._find = (e) => {
            const target = window.Store.Chat.get(e);
            return target ?
                Promise.resolve(target) :
                Promise.resolve({
                    id: e,
                });
        };
    }

    // The following was implemented and inspired from wppconnect/wa-js at
    // https://github.com/wppconnect-team/wa-js/tree/main/src/chat/functions/prepareMessageButtons.ts

    if (window.mR.findModule('ChatCollection')[0] && window.mR.findModule('ChatCollection')[0].ChatCollection) {
        if (typeof window.mR.findModule('ChatCollection')[0].ChatCollection.findImpl === 'undefined' && typeof window.mR.findModule('ChatCollection')[0].ChatCollection._find != 'undefined') {
            window.mR.findModule('ChatCollection')[0].ChatCollection.findImpl = window.mR.findModule('ChatCollection')[0].ChatCollection._find;
        }
    }

    // Find proxy modules
    window.findProxyModel = (name) => {
        const baseName = name.replace(/Model$/, "");

        const names = [baseName];

        // ChatModel => "chat"
        names.push(baseName.replace(/^(\w)/, (l) => l.toLowerCase()));

        // CartItemModel => "cart-item"
        // ProductListModel => "product_list"
        const parts = baseName.split(/(?=[A-Z])/);

        names.push(parts.join("-").toLowerCase());
        names.push(parts.join("_").toLowerCase());

        const results = window.mR.findModule((m) =>
            names.includes(
                m.default?.prototype?.proxyName ||
                m[name]?.prototype?.proxyName ||
                m[baseName]?.prototype?.proxyName
            )
        )[0];

        return results.default || results[name] || results[baseName];
    };

    // Function to modify functions.
    // This function simply just runs the callback you provide with the original code in the first argument and all the arguments passed to that function.
    window.injectToFunction = (selector, callback) => {
        const oldFunct = window.mR.findModule(selector.name)[selector.index][
            selector.property
        ];
        window.mR.findModule(selector.name)[selector.index][selector.property] = (
            ...args
        ) => callback(oldFunct, args);
    };

    window.injectToFunction({
        name: 'typeAttributeFromProtobuf',
        index: 0,
        property: 'typeAttributeFromProtobuf'
    }, (func, args) => {
        const [proto] = args;
        return proto.groupInviteMessage ? 'text' : func(...args);
    });

    // Find Template models
    window.Store.TemplateButtonModel = window.findProxyModel(
        "TemplateButtonModel"
    );
    window.Store.TemplateButtonCollection = window.mR.findModule(
        "TemplateButtonCollection"
    )[0].TemplateButtonCollection;

    // Find quick reply models
    window.Store.ReplyButtonModel = window.findProxyModel("ReplyButtonModel");
    window.Store.ButtonCollection =
        window.mR.findModule("ButtonCollection")[0].ButtonCollection;

    // Modify functions
    window.injectToFunction({
            index: 0,
            name: "createMsgProtobuf",
            property: "createMsgProtobuf",
        },
        (func, args) => {
            const [message] = args;
            const proto = func(...args);
            if (message.hydratedButtons) {
                const hydratedTemplate = {
                    hydratedButtons: message.hydratedButtons,
                };

                if (message.footer) {
                    hydratedTemplate.hydratedFooterText = message.footer;
                }

                if (message.caption) {
                    hydratedTemplate.hydratedContentText = message.caption;
                }

                if (message.title) {
                    hydratedTemplate.hydratedTitleText = message.title;
                }

                if (proto.conversation) {
                    hydratedTemplate.hydratedContentText = proto.conversation;
                    delete proto.conversation;
                } else if (proto.extendedTextMessage?.text) {
                    hydratedTemplate.hydratedContentText = proto.extendedTextMessage.text;
                    delete proto.extendedTextMessage;
                } else {
                    // Search media part in message
                    let found;
                    const mediaPart = [
                        "documentMessage",
                        "imageMessage",
                        "locationMessage",
                        "videoMessage",
                    ];
                    for (const part of mediaPart) {
                        if (part in proto) {
                            found = part;
                            break;
                        }
                    }

                    if (!found) {
                        return proto;
                    }

                    // Media message doesn't allow title
                    hydratedTemplate[found] = proto[found];

                    // Copy title to caption if not setted
                    if (
                        hydratedTemplate.hydratedTitleText &&
                        !hydratedTemplate.hydratedContentText
                    ) {
                        hydratedTemplate.hydratedContentText =
                            hydratedTemplate.hydratedTitleText;
                    }

                    // Remove title for media messages
                    delete hydratedTemplate.hydratedTitleText;

                    if (found === "locationMessage") {
                        if (
                            !hydratedTemplate.hydratedContentText &&
                            (message[found].name || message[found].address)
                        ) {
                            hydratedTemplate.hydratedContentText =
                                message[found].name && message[found].address ?
                                `${message[found].name}\n${message[found].address}` :
                                message[found].name || message[found].address || "";
                        }
                    }

                    // Ensure a content text;
                    hydratedTemplate.hydratedContentText =
                        hydratedTemplate.hydratedContentText || " ";

                    delete proto[found];
                }

                proto.templateMessage = {
                    hydratedTemplate,
                };
            }

            return proto;
        }
    );

    setTimeout(() => {
        window.injectToFunction({
                index: 0,
                name: "createMsgProtobuf",
                property: "createMsgProtobuf",
            },
            (func, args) => {
                const proto = func(...args);
                if (proto.templateMessage) {
                    /*
                    proto.viewOnceMessage = {
                    message: {
                    templateMessage: proto.templateMessage,
                    },
                    };
                    delete proto.templateMessage;
                    */
                }
                /*
                if (proto.buttonsMessage) {
                proto.viewOnceMessage = {
                message: {
                buttonsMessage: proto.buttonsMessage,
                },
                };
                delete proto.buttonsMessage;
                }
                if (proto.listMessage) {
                proto.viewOnceMessage = {
                message: {
                listMessage: proto.listMessage,
                },
                };
                delete proto.listMessage;
                }
                */
                return proto;
            }
        );
    }, 100);

    window.injectToFunction({
            index: 0,
            name: "typeAttributeFromProtobuf",
            property: "typeAttributeFromProtobuf",
        },
        function callback(func, args) {
            const [proto] = args;

            if (proto.ephemeralMessage) {
                const {
                    message
                } = proto.ephemeralMessage;
                return message ? callback(func, [message]) : "text";
            }
            if (proto.deviceSentMessage) {
                const {
                    message
                } = proto.deviceSentMessage;
                return message ? callback(func, [message]) : "text";
            }
            if (proto.viewOnceMessage) {
                const {
                    message
                } = proto.viewOnceMessage;
                return message ? callback(func, [message]) : "text";
            }

            if (
                proto.buttonsMessage?.headerType === 1 ||
                proto.buttonsMessage?.headerType === 2
            ) {
                return "text";
            }

            if (proto.listMessage) {
                return "text";
            }

            if (proto.templateMessage?.hydratedTemplate) {
                const keys = Object.keys(proto.templateMessage?.hydratedTemplate);
                const messagePart = [
                    "documentMessage",
                    "imageMessage",
                    "locationMessage",
                    "videoMessage",
                ];
                if (messagePart.some((part) => keys.includes(part))) {
                    return "media";
                }
                return "text";
            }

            return func(...args);
        }
    );

    window.injectToFunction({
            index: 0,
            name: "mediaTypeFromProtobuf",
            property: "mediaTypeFromProtobuf",
        },
        (func, args) => {
            const [proto] = args;
            if (proto.templateMessage?.hydratedTemplate) {
                return func(proto.templateMessage.hydratedTemplate);
            }
            return func(...args);
        }
    );

    window.injectToFunction({
            index: 0,
            name: "encodeMaybeMediaType",
            property: "encodeMaybeMediaType",
        },
        (func, args) => {
            const [type] = args;
            if (type === "button") {
                return window.mR.findModule("DROP_ATTR")[0].DROP_ATTR;
            }
            return func(...args);
        }
    );

    window.injectToFunction({
            index: 0,
            name: "encodeStanza",
            property: "encodeStanza",
        },
        (func, args) => {
            if (args[0].tag == "message") {
                if (window.WWebJS.pendingBypass.find((a) => a.id == args[0].attrs.id)) {
                    const {
                        id,
                        type,
                        mediaType
                    } = window.WWebJS.pendingBypass.find(
                        (a) => a.id == args[0].attrs.id
                    );
                    let attrs = {};
                    if (type == "list") {
                        attrs = {
                            v: "2",
                            type: "single_select"
                        };
                    }
                    const node = window.Store.SocketWap.wap("biz", [
                        window.Store.SocketWap.wap(type, null, attrs),
                    ]);
                    if (mediaType) {
                        const messageBodyEnc = args[0].content.find((a) => a.tag == "enc");
                        messageBodyEnc.attrs = {
                            ...messageBodyEnc.attrs,
                            mediatype: mediaType,
                        };
                    } // add media type to body of encrypted message

                    args[0].content.push(node); // patch the message
                    delete window.WWebJS.pendingBypass[
                        window.WWebJS.pendingBypass.findIndex(
                            (a) => a.id == args[0].attrs.id
                        )
                    ];
                }
            }
            return func(...args);
        }
    );

    window.injectToFunction({
            index: 0,
            name: "createFanoutMsgStanza",
            property: "createFanoutMsgStanza",
        },
        async (func, args) => {
            const [, proto] = args;

            let buttonNode = null;

            if (proto.buttonsMessage) {
                buttonNode = window.Store.WebSocket.smax("buttons");
            } else if (proto.listMessage) {
                const listType = proto.listMessage.listType || 0;

                const types = ["unknown", "single_select", "product_list"];

                buttonNode = window.Store.WebSocket.smax("list", {
                    v: "2",
                    type: types[listType],
                });
            }

            const node = await func(...args);

            if (!buttonNode) return node;

            const content = node.content || [];

            let bizNode = content.find((c) => c.tag === "biz");

            if (!bizNode) {
                bizNode = window.Store.WebSocket.smax(
                    "biz", {
                        native_flow_name: "wa_payment_learn_more"
                    },
                    null
                );
                content.push(bizNode);
            }

            let hasButtonNode = false;

            if (Array.isArray(bizNode.content)) {
                hasButtonNode = !!bizNode.content.find(
                    (c) => c.tag === buttonNode?.tag
                );
            } else {
                bizNode.content = [];
            }

            if (!hasButtonNode) {
                bizNode.content.push(buttonNode);
            }

            return node;
        }
    );

    const _getLinkPreview = window.mR.findModule('getLinkPreview');
    if (_getLinkPreview && _getLinkPreview[0].getLinkPreview && _getLinkPreview[0].getLinkPreview.length === 0) {
        window.Store.getLinkPreview = _getLinkPreview[0].getLinkPreview;
    } else {
        window.Store.getLinkPreview = () => null;
    }

    // TODO remove these once everybody has been updated to WWebJS with legacy sessions removed
    const _linkPreview = window.mR.findModule("queryLinkPreview");
    if (_linkPreview && _linkPreview[0] && _linkPreview[0].default) {
        window.Store.Wap = _linkPreview[0].default;
    }

    const _isMDBackend = window.mR.findModule("isMDBackend");
    if (_isMDBackend && _isMDBackend[0] && _isMDBackend[0].isMDBackend) {
        window.Store.MDBackend = _isMDBackend[0].isMDBackend();
    } else {
        window.Store.MDBackend = true;
    }

    const _features = window.mR.findModule("FEATURE_CHANGE_EVENT")[0];
    if (_features) {
        window.Store.Features = _features.LegacyPhoneFeatures;
    }
};

export const LoadUtils = () => {
    window.WWebJS = {
        ...WPP
    };

    window.WWebJS.pendingBypass = [];

    window.WWebJS.sendSeen = async (chatId) => {
        let chat = window.Store.Chat.get(chatId);
        if (chat !== undefined) {
            await window.Store.SendSeen.sendSeen(chat, false);
            return true;
        }
        return false;
    };

    window.WWebJS.prepareRawMessage = async (chatId, message, options = {}) => {
        const chatWid = window.Store.WidFactory.createWid(chatId);
        const chat = await window.Store.Chat.find(chatWid);

        const meUser = window.Store.User.getMaybeMeUser();
        const isMD = window.Store.MDBackend;

        const newMsgId = await window.WWebJS.chat.generateMessageID(chat);

        message = {
            t: parseInt(new Date().getTime() / 1000),
            id: newMsgId,
            from: meUser,
            to: chat.id,
            self: "out",
            isNewMsg: true,
            local: true,
            ack: 0,
            ...message,
        };

        if (options.messageId) {
            message.id = new window.Store.MsgKey({
                from: meUser,
                to: chat.id,
                id: options.messageId,
                participant: (isMD && chat.id.isGroup()) || chat.id.isStatusV3() ?
                    meUser :
                    undefined,
                selfDir: "out",
            });

            delete options.messageId;
        }

        if (options.mentions) {
            message.mentionedJidList = options.mentions.map(
                (cId) => window.Store.Contact.get(cId).id
            );

            delete options.mentions;
        }

        let quotedMsg = {};
        if (options.quoted) {
            if (typeof options.quoted === "string")
                quotedMsg = window.Store.Msg.get(options.quoted);
            if (typeof options.quoted === "object")
                quotedMsg = window.Store.Msg.get(
                    options.quoted.id ?
                    options.quoted.id._serialized :
                    options.quoted._serialized
                );

            quotedMsg = quotedMsg.msgContextInfo(chat.id);

            delete options.quoted;
        }

        let extraOptions = {};
        if (options.extra) {
            extraOptions = options.extra;

            delete options.extra;
        }

        message = {
            ...message,
            ...quotedMsg,
            ...extraOptions,
        };

        return message;
    };

    window.WWebJS.sendRawMessage = async (chatId, rawMessage, options = {}) => {
        const chatWid = window.Store.WidFactory.createWid(chatId);
        const chat = await window.Store.Chat.find(chatWid);

        rawMessage = window.WWebJS.prepareRawMessage(chatId, rawMessage, options);

        if (options.sendSeen) {
            window.WWebJS.sendSeen(chatId);
        }

        await window.Store.SendMessage.addAndSendMsgToChat(chat, rawMessage);
        return rawMessage;
    };

    window.WWebJS.prepareMessageButtons = (buttonsOptions) => {
        const returnObject = {};
        if (!buttonsOptions.buttons) {
            return returnObject;
        }

        returnObject.title = buttonsOptions.title;
        returnObject.footer = buttonsOptions.footer;

        /**if (buttonsOptions.useTemplateButtons) {
        returnObject.isFromTemplate = true;
        returnObject.hydratedButtons = buttonsOptions.buttons;
        returnObject.buttons = new window.Store.TemplateButtonCollection();
        
        returnObject.buttons.add(
        returnObject.hydratedButtons.map((button, index) => {
        const i = `${null != button.index ? button.index : index}`;
        
        if (button.urlButton) {
        return new window.Store.TemplateButtonModel({
        id: i,
        displayText: button.urlButton?.displayText,
        url: button.urlButton?.url,
        subtype: 'url',
        });
        }
        
        if (button.callButton) {
        return new window.Store.TemplateButtonModel({
        id: i,
        displayText: button.callButton.displayText,
        phoneNumber: button.callButton.phoneNumber,
        subtype: 'call',
        });
        }
        
        return new window.Store.TemplateButtonModel({
        id: i,
        displayText: button.quickReplyButton?.displayText,
        selectionId: button.quickReplyButton?.id,
        subtype: 'quick_reply',
        });
        })
        );
        }
        else {*/
        returnObject.isDynamicReplyButtonsMsg = true;

        returnObject.dynamicReplyButtons = buttonsOptions.buttons.map(
            (button, index) => ({
                buttonId: button.quickReplyButton?.id?.toString() || `${index}`,
                buttonText: {
                    displayText: button.quickReplyButton?.displayText
                },
                type: 1,
            })
        );

        // For UI only

        returnObject.replyButtons = new window.Store.ButtonCollection();
        returnObject.replyButtons.add(
            returnObject.dynamicReplyButtons.map(
                (button) =>
                new window.Store.ReplyButtonModel({
                    id: button.buttonId,
                    displayText: button.buttonText?.displayText || undefined,
                })
            )
        );

        //}
        return returnObject;
    };

    window.WWebJS.sendMessage = async (chat, content, options = {}) => {
        let attOptions = {};
        if (options.attachment) {
            attOptions = options.sendMediaAsSticker ?
                await window.WWebJS.processStickerData(options.attachment) :
                await window.WWebJS.processMediaData(options.attachment, {
                    forceVoice: options.sendAudioAsVoice,
                    forceDocument: options.sendMediaAsDocument,
                    forceGif: options.sendVideoAsGif,
                    isViewOnce: options.isViewOnce
                });

            attOptions.caption = options.caption ? options.caption : "";
            content = options.sendMediaAsSticker ? undefined : attOptions.preview;

            delete options.attachment;
            delete options.sendMediaAsSticker;
        }
        let quotedMsgOptions = {};
        if (options.quotedMessageId) {
            let quotedMessage = window.Store.Msg.get(options.quotedMessageId);

            // TODO remove .canReply() once all clients are updated to >= v2.2241.6
            const canReply = window.Store.ReplyUtils ?
                window.Store.ReplyUtils.canReplyMsg(quotedMessage.unsafe()) :
                quotedMessage.canReply();

            if (canReply) {
                quotedMsgOptions = quotedMessage.msgContextInfo(chat);
            }
            delete options.quotedMessageId;
        }

        if (options.mentionedJidList) {
            options.mentionedJidList = options.mentionedJidList.map(
                (cId) => window.Store.Contact.get(cId).id
            );
        }

        let locationOptions = {};
        if (options.location) {
            locationOptions = {
                type: "location",
                loc: options.location.description,
                lat: options.location.latitude,
                lng: options.location.longitude,
            };
            delete options.location;
        }

        let vcardOptions = {};
        if (options.contactCard) {
            let contact = window.Store.Contact.get(options.contactCard);
            vcardOptions = {
                body: window.Store.VCard.vcardFromContactModel(contact).vcard,
                type: "vcard",
                vcardFormattedName: contact.formattedName,
            };
            delete options.contactCard;
        } else if (options.contactCardList) {
            let contacts = options.contactCardList.map((c) =>
                window.Store.Contact.get(c)
            );
            let vcards = contacts.map((c) =>
                window.Store.VCard.vcardFromContactModel(c)
            );
            vcardOptions = {
                type: "multi_vcard",
                vcardList: vcards,
                body: undefined,
            };
            delete options.contactCardList;
        } else if (
            options.parseVCards &&
            typeof content === "string" &&
            content.startsWith("BEGIN:VCARD")
        ) {
            delete options.parseVCards;
            try {
                const parsed = window.Store.VCardParse.parseVcard(content);
                if (parsed) {
                    vcardOptions = {
                        type: "vcard",
                        vcardFormattedName: window.Store.VCardParse.vcardGetNameFromParsed(parsed),
                    };
                }
            } catch (_) {
                // not a vcard
            }
        }

        if (options.linkPreview) {
            const ovverride =
                typeof options.linkPreview === "object" ? options.linkPreview : {};

            const link = window.Store.Validators.findLink(content);
            if (link) {
                const preview = await window.WWebJS.whatsapp.functions.fetchLinkPreview(
                    link.url
                );
                preview.preview = true;
                preview.subtype = "url";
                options = {
                    ...options,
                    ...preview.data,
                    ...ovverride
                };
            }

            if (typeof options.linkPreview === "object") {
                options.subtype = "url";
                options = {
                    ...options,
                    ...options.linkPreview,
                };
            }

            delete options.linkPreview;
        }

        let buttonOptions = {};
        if (options.buttons) {
            let caption;
            if (options.buttons.type === "chat") {
                content = options.buttons.body;
                caption = content;
            } else {
                caption = options.caption ? options.caption : " "; //Caption can't be empty
            }

            buttonOptions = window.WWebJS.prepareMessageButtons(options.buttons);
            buttonOptions = {
                ...buttonOptions,
                caption: caption,
            };
            delete options.buttons;
        }

        let listOptions = {};
        if (options.list) {
            listOptions = {
                type: "list",
                footer: options.list.footer,
                list: {
                    ...options.list,
                    listType: 1,
                },
                body: options.list.description,
            };
            delete options.list;
            delete listOptions.list.footer;
        }

        const meUser = window.Store.User.getMaybeMeUser();
        const newMsgId = await window.WWebJS.chat.generateMessageID(chat);

        const extraOptions = options.extraOptions || {};
        delete options.extraOptions;

        const ephemeralFields =
            window.Store.EphemeralFields.getEphemeralFields(chat);

        const message = {
            ...options,
            id: newMsgId,
            ack: 0,
            body: content,
            from: meUser,
            to: chat.id,
            local: true,
            self: "out",
            t: parseInt(new Date().getTime() / 1000),
            isNewMsg: true,
            type: "chat",
            createChat: true,
            ...ephemeralFields,
            ...locationOptions,
            ...attOptions,
            ...quotedMsgOptions,
            ...vcardOptions,
            ...buttonOptions,
            ...listOptions,
            ...extraOptions,
        };

        await window.Store.SendMessage.addAndSendMsgToChat(chat, message);
        return window.Store.Msg.get(newMsgId._serialized);
    };

    window.WWebJS.toStickerData = async (mediaInfo) => {
        if (mediaInfo.mimetype == "image/webp") return mediaInfo;

        const file = window.WWebJS.mediaInfoToFile(mediaInfo);
        const webpSticker = await window.Store.StickerTools.toWebpSticker(file);
        const webpBuffer = await webpSticker.arrayBuffer();
        const data = window.WWebJS.arrayBufferToBase64(webpBuffer);

        return {
            mimetype: "image/webp",
            data,
        };
    };

    window.WWebJS.processStickerData = async (mediaInfo) => {
        if (mediaInfo.mimetype !== "image/webp")
            throw new Error("Invalid media type");

        const file = window.WWebJS.mediaInfoToFile(mediaInfo);
        let filehash = await window.WWebJS.getFileHash(file);
        let mediaKey = await window.WWebJS.generateHash(32);

        const controller = new AbortController();
        const uploadedInfo = await window.Store.UploadUtils.encryptAndUpload({
            blob: file,
            type: "sticker",
            signal: controller.signal,
            mediaKey,
        });

        const stickerInfo = {
            ...uploadedInfo,
            clientUrl: uploadedInfo.url,
            deprecatedMms3Url: uploadedInfo.url,
            uploadhash: uploadedInfo.encFilehash,
            size: file.size,
            type: "sticker",
            filehash,
        };

        return stickerInfo;
    };

    window.WWebJS.processMediaData = async (
        mediaInfo, {
            forceVoice,
            forceDocument,
            forceGif,
            isViewOnce
        }
    ) => {
        const file = window.WWebJS.mediaInfoToFile(mediaInfo);
        const mData = await window.Store.OpaqueData.createFromData(file, file.type);
        const mediaPrep = window.Store.MediaPrep.prepRawMedia(mData, {
            asDocument: forceDocument,
        });
        const mediaData = await mediaPrep.waitForPrep();
        const mediaObject = window.Store.MediaObject.getOrCreateMediaObject(mediaData.filehash);
        const uploadOrigin = 2;
        const forwardedFromWeb = false;
        const maxFileSize = window.Store.UploadLimits(mediaData.type);


        const mediaType = window.Store.MediaTypes.msgToMediaType({
            type: mediaData.type,
            isGif: mediaData.isGif,
        });

        if (forceVoice && mediaData.type === "audio") {
            mediaData.type = "ptt";
            const waveform = mediaObject.contentInfo.waveform;
            mediaData.waveform =
                waveform ?? await window.WWebJS.generateWaveform(file);
        }

        if (forceGif && mediaData.type === "video") {
            mediaData.isGif = true;
        }

        if (forceDocument) {
            mediaData.type = "document";
        }

        if (mediaInfo.filesize && maxFileSize > mediaInfo.file) {
            throw new Error('Media size (' + mediaInfo.filesize + ') exceeds current upload limit (' + maxFileSize + ')');
        }

        if (!(mediaData.mediaBlob instanceof window.Store.OpaqueData)) {
            mediaData.mediaBlob = await window.Store.OpaqueData.createFromData(
                mediaData.mediaBlob,
                mediaData.mediaBlob.type
            );
        }

        mediaData.renderableUrl = mediaData.mediaBlob.url();
        mediaObject.consolidate(mediaData.toJSON());
        mediaData.mediaBlob.autorelease();

        const uploadedMedia = await window.Store.MediaUpload.uploadMedia({
            mimetype: mediaData.mimetype,
            mediaObject,
            mediaType,
            isViewOnce,
            uploadOrigin,
            forwardedFromWeb
        });

        const mediaEntry = uploadedMedia.mediaEntry;
        if (!mediaEntry) {
            throw new Error("upload failed: media entry was not created");
        }

        mediaData.set({
            clientUrl: mediaEntry.mmsUrl,
            deprecatedMms3Url: mediaEntry.deprecatedMms3Url,
            directPath: mediaEntry.directPath,
            mediaKey: mediaEntry.mediaKey,
            mediaKeyTimestamp: mediaEntry.mediaKeyTimestamp,
            filehash: mediaObject.filehash,
            encFilehash: mediaEntry.encFilehash,
            uploadhash: mediaEntry.uploadHash,
            size: mediaObject.size,
            streamingSidecar: mediaEntry.sidecar,
            firstFrameSidecar: mediaEntry.firstFrameSidecar,
        });

        return mediaData;
    };

    window.WWebJS.generateWaveform = async (audioFile) => {
        try {
            const audioData = await audioFile.arrayBuffer();
            const audioContext = new AudioContext();
            const audioBuffer = await audioContext.decodeAudioData(audioData);

            const rawData = audioBuffer.getChannelData(0);
            const samples = 64;
            const blockSize = Math.floor(rawData.length / samples);
            const filteredData = [];
            for (let i = 0; i < samples; i++) {
                const blockStart = blockSize * i;
                let sum = 0;
                for (let j = 0; j < blockSize; j++) {
                    sum = sum + Math.abs(rawData[blockStart + j]);
                }
                filteredData.push(sum / blockSize);
            }

            const multiplier = Math.pow(Math.max(...filteredData), -1);
            const normalizedData = filteredData.map((n) => n * multiplier);

            const waveform = new Uint8Array(
                normalizedData.map((n) => Math.floor(100 * n))
            );

            return waveform;
        } catch (e) {
            return undefined;
        }
    };

    window.WWebJS.getMessageModel = (message) => {
        const msg = message.serialize();

        msg.isEphemeral = message.isEphemeral;
        msg.isStatusV3 = message.isStatusV3;
        msg.links = message.getRawLinks().map((link) => ({
            link: link.href,
            isSuspicious: Boolean(
                link.suspiciousCharacters && link.suspiciousCharacters.size
            ),
        }));

        if (msg.buttons) {
            msg.buttons = msg.buttons.serialize();
        }
        if (msg.dynamicReplyButtons) {
            msg.dynamicReplyButtons = JSON.parse(
                JSON.stringify(msg.dynamicReplyButtons)
            );
        }
        if (msg.replyButtons) {
            msg.replyButtons = JSON.parse(JSON.stringify(msg.replyButtons));
        }

        if (typeof msg.id.remote === "object") {
            msg.id = Object.assign({}, msg.id, {
                remote: msg.id.remote._serialized
            });
        }

        if (msg.type == "poll_creation") {
            msg.pollVotes = window.Store.PollVote.getForParent([
                msg.id._serialized,
            ]).map((a) => a.serialize())[0];
        }

        delete msg.pendingAckUpdate;

        return msg;
    };

    window.WWebJS.getChatModel = async (chat) => {
        let res = chat.serialize();
        res.isGroup = chat.isGroup;
        res.formattedTitle = chat.formattedTitle;
        res.isMuted = chat.mute && chat.mute.isMuted;

        if (chat.groupMetadata) {
            const chatWid = window.Store.WidFactory.createWid(chat.id._serialized);
            await window.Store.GroupMetadata.update(chatWid);
            res.groupMetadata = chat.groupMetadata.serialize();
        }

        delete res.msgs;
        delete res.msgUnsyncedButtonReplyMsgs;
        delete res.unsyncedButtonReplies;

        return res;
    };

    window.WWebJS.getChat = async (chatId) => {
        const chatWid = window.Store.WidFactory.createWid(chatId);
        const chat = await window.Store.Chat.find(chatWid);
        return await window.WWebJS.getChatModel(chat);
    };

    window.WWebJS.getChats = async () => {
        const chats = window.Store.Chat.getModelsArray();

        const chatPromises = chats.map((chat) => window.WWebJS.getChatModel(chat));
        return await Promise.all(chatPromises);
    };

    window.WWebJS.getContactModel = (contact) => {
        let res = contact.serialize();
        res.isBusiness = contact.isBusiness;

        if (contact.businessProfile) {
            res.businessProfile = contact.businessProfile.serialize();
        }

        res.isMe = contact.isMe;
        res.isUser = contact.isUser;
        res.isGroup = contact.isGroup;
        res.isWAContact = contact.isWAContact;
        res.isMyContact = contact.isMyContact;
        res.isBlocked = contact.isContactBlocked;
        res.userid = contact.userid;

        return res;
    };

    window.WWebJS.getContact = async (contactId) => {
        const wid = window.Store.WidFactory.createWid(contactId);
        const contact = await window.Store.Contact.find(wid);
        return window.WWebJS.getContactModel(contact);
    };

    window.WWebJS.getContacts = () => {
        const contacts = window.Store.Contact.getModelsArray();
        return contacts.map((contact) => window.WWebJS.getContactModel(contact));
    };

    window.WWebJS.mediaInfoToFile = ({
        data,
        mimetype,
        filename
    }) => {
        const binaryData = window.atob(data);

        const buffer = new ArrayBuffer(binaryData.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binaryData.length; i++) {
            view[i] = binaryData.charCodeAt(i);
        }

        const blob = new Blob([buffer], {
            type: mimetype
        });
        return new File([blob], filename, {
            type: mimetype,
            lastModified: Date.now(),
        });
    };

    window.WWebJS.arrayBufferToBase64 = (arrayBuffer) => {
        let binary = "";
        const bytes = new Uint8Array(arrayBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    window.WWebJS.arrayBufferToBase64Async = (arrayBuffer) =>
        new Promise((resolve, reject) => {
            const blob = new Blob([arrayBuffer], {
                type: "application/octet-stream",
            });
            const fileReader = new FileReader();
            fileReader.onload = () => {
                const [, data] = fileReader.result.split(",");
                resolve(data);
            };
            fileReader.onerror = (e) => reject(e);
            fileReader.readAsDataURL(blob);
        });

    window.WWebJS.getFileHash = async (data) => {
        let buffer = await data.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    };

    window.WWebJS.generateHash = async (length) => {
        var result = "";
        var characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    };

    window.WWebJS.sendClearChat = async (chatId) => {
        let chat = window.Store.Chat.get(chatId);
        if (chat !== undefined) {
            await window.Store.SendClear.sendClear(chat, false);
            return true;
        }
        return false;
    };

    window.WWebJS.sendDeleteChat = async (chatId) => {
        let chat = window.Store.Chat.get(chatId);
        if (chat !== undefined) {
            await window.Store.SendDelete.sendDelete(chat);
            return true;
        }
        return false;
    };

    window.WWebJS.sendChatstate = async (chatId, state) => {
        if (window.Store.MDBackend) {
            chatId = window.Store.WidFactory.createWid(chatId);
        }
        switch (state) {
            case "typing":
                await window.Store.ChatState.sendChatStateComposing(chatId);
                break;
            case "recording":
                await window.Store.ChatState.sendChatStateRecording(chatId);
                break;
            case "stop":
                await window.Store.ChatState.sendChatStatePaused(chatId);
                break;
            default:
                throw "Invalid chatstate";
        }

        return true;
    };

    window.WWebJS.getLabelModel = (label) => {
        let res = label.serialize();
        res.hexColor = label.hexColor;

        return res;
    };

    window.WWebJS.getLabels = () => {
        const labels = window.Store.Label.getModelsArray();
        return labels.map((label) => window.WWebJS.getLabelModel(label));
    };

    window.WWebJS.getLabel = (labelId) => {
        const label = window.Store.Label.get(labelId);
        return window.WWebJS.getLabelModel(label);
    };

    window.WWebJS.getChatLabels = async (chatId) => {
        const chat = await window.WWebJS.getChat(chatId);
        return (chat.labels || []).map((id) => window.WWebJS.getLabel(id));
    };

    window.WWebJS.getOrderDetail = async (orderId, token, chatId) => {
        const chatWid = window.Store.WidFactory.createWid(chatId);
        return window.Store.QueryOrder.queryOrder(chatWid, orderId, 80, 80, token);
    };

    window.WWebJS.getProductMetadata = async (productId) => {
        let sellerId = window.Store.Conn.wid;
        let product = await window.Store.QueryProduct.queryProduct(
            sellerId,
            productId
        );
        if (product && product.data) {
            return product.data;
        }

        return undefined;
    };

    window.WWebJS.rejectCall = async (peerJid, id) => {
        peerJid = peerJid.split("@")[0] + "@s.whatsapp.net";
        let userId = window.Store.User.getMaybeMeUser().user + "@s.whatsapp.net";
        const stanza = window.Store.SocketWap.wap(
            "call", {
                id: window.Store.SocketWap.generateId(),
                from: window.Store.SocketWap.USER_JID(userId),
                to: window.Store.SocketWap.USER_JID(peerJid),
            },
            [
                window.Store.SocketWap.wap("reject", {
                    "call-id": id,
                    "call-creator": window.Store.SocketWap.USER_JID(peerJid),
                    count: "0",
                }),
            ]
        );
        await window.Store.Socket.deprecatedCastStanza(stanza);
    };

    window.WWebJS.votePoll = async (pollCreationMessageId, selectedOptions) => {
        const msg = window.Store.Msg.get(pollCreationMessageId);
        if (msg.type !== 'poll_creation') throw 'Quoted message is not a poll creation message!';
        let localIdSet = new Set();
        msg.pollOptions.map(a => {
            for (const option of selectedOptions) {
                if (a.name == option) localIdSet.add(a.localId);
            }
        });
        await window.Store.SendVote.sendVote(msg, localIdSet);
    };

    window.WWebJS.cropAndResizeImage = async (media, options = {}) => {
        if (!media.mimetype.includes("image"))
            throw new Error("Media is not an image");

        if (options.mimetype && !options.mimetype.includes("image"))
            delete options.mimetype;

        options = Object.assign({
                size: 720,
                mimetype: media.mimetype,
                quality: 0.75,
                asDataUrl: false
            },
            options
        );

        const img = await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = `data:${media.mimetype};base64,${media.data}`;
        });

        const sl = Math.min(img.width, img.height);
        const sx = Math.floor((img.width - sl) / 2);
        const sy = Math.floor((img.height - sl) / 2);

        const canvas = document.createElement("canvas");
        canvas.width = options.size;
        canvas.height = options.size;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, sl, sl, 0, 0, options.size, options.size);

        const dataUrl = canvas.toDataURL(options.mimetype, options.quality);

        if (options.asDataUrl) return dataUrl;

        return Object.assign(media, {
            mimetype: options.mimeType,
            data: dataUrl.replace(`data:${options.mimeType};base64,`, ""),
        });
    };

    window.WWebJS.setPicture = async (chatid, media, type = "normal") => {
        const thumbnail =
            type === "long" ?
            await window.WWebJS.cropAndResizeImage(media, {
                asDataUrl: true,
                mimetype: "image/jpeg",
                size: 120,
            }) :
            await window.WWebJS.cropAndResizeImage(media, {
                asDataUrl: true,
                mimetype: "image/jpeg",
                size: 96,
            });
        const profilePic =
            type === "long" ?
            await window.WWebJS.cropAndResizeImage(media, {
                asDataUrl: true,
                mimetype: "image/jpeg",
                size: 720,
            }) :
            await window.WWebJS.cropAndResizeImage(media, {
                asDataUrl: true,
                mimetype: "image/jpeg",
                size: 640,
            });

        const chatWid = window.Store.WidFactory.createWid(chatid);
        try {
            const collection = window.Store.ProfilePicThumb.get(chatid);
            if (!collection.canSet()) return;

            const res = await window.Store.GroupUtils.sendSetPicture(
                chatWid,
                profilePic,
                thumbnail
            );
            return res ? res.status === 200 : false;
        } catch (err) {
            if (err.name === "ServerStatusCodeError") return false;
            throw err;
        }
    };

    window.extra = {
        group: {
            memberRequest: async (jid) => {
                return WPP.group.getMembershipRequests(jid);
            },
            approve: async (jid, participant) => {
                return WPP.group.approve(jid, participant);
            },
            reject: async (jid, memb) => {
                return WPP.group.reject(jid, memb);
            },
        },
        joinBeta: async (act) => {
            return WPP.conn.joinWebBeta(act);
        },
        theme: window.mR.findModule((module) =>
            module.setTheme && module.getTheme ? module : null
        ),
        status: {
            text: async (capt, opt) => {
                return WPP.status.sendTextStatus(capt, opt);
            },
            // masih belum dapat bekerja
            image: async (base64) => {
                return WPP.status.sendImageStatus(base64);
            },
            video: async (buffer) => {
                return "soon";
            },
            vn: async (buffer) => {
                return "soon";
            },
        },
    };

    window.WWebJS.deletePicture = async (chatid) => {
        const chatWid = window.Store.WidFactory.createWid(chatid);
        try {
            const collection = window.Store.ProfilePicThumb.get(chatid);
            if (!collection.canDelete()) return;

            const res = await window.Store.GroupUtils.requestDeletePicture(chatWid);
            return res ? res.status === 200 : false;
        } catch (err) {
            if (err.name === "ServerStatusCodeError") return false;
            throw err;
        }
    };

    window.WWebJS.downloadFile = async (url) => {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.onload = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        let reader = new FileReader();
                        reader.readAsDataURL(xhr.response);
                        reader.onload = function(e) {
                            resolve(reader.result.substr(reader.result.indexOf(",") + 1));
                        };
                    } else {
                        console.error(xhr.statusText);
                    }
                } else {
                    resolve(false);
                }
            };
            xhr.open("GET", url, true);
            xhr.responseType = "blob";
            xhr.send(null);
        });
    };

    window.WWebJS.getChatOnline = async (chatId) => {
        const chat = window.Store.Chat.get(chatId);
        if (!chat) {
            return false;
        }
        await chat.presence.subscribe();
        return chat.presence.attributes.isOnline;
    };

    window.WWebJS.getProfilePicThumbBase64 = async (chatWid) => {
        const profilePicCollection = window.Store.ProfilePicThumb.get(chatWid);

        const _readImageAsBase64 = (imageBlob) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = function() {
                    const base64Image = reader.result;
                    if (base64Image == null) {
                        resolve(undefined);
                    } else {
                        const base64Data = base64Image.toString().split(',')[1];
                        resolve(base64Data);
                    }
                };
                reader.readAsDataURL(imageBlob);
            });
        };

        if (profilePicCollection?.img) {
            try {
                const response = await fetch(profilePicCollection.img);
                if (response.ok) {
                    const imageBlob = await response.blob();
                    if (imageBlob) {
                        const base64Image = await _readImageAsBase64(imageBlob);
                        return base64Image;
                    }
                }
            } catch (error) {
                /* empty */ }
        }
        return undefined;
    };

    window.WWebJS.getAddParticipantsRpcResult = async (chatMetadata, chatWid, participantWid) => {
        const participantLidArgs = chatMetadata?.isLidAddressingMode ?
            {
                phoneNumber: participantWid,
                lid: window.Store.LidManipulations.getCurrentLid(participantWid)
            } :
            {
                phoneNumber: participantWid
            };

        const iqTo = window.Store.WidToJid.widToGroupJid(chatWid);

        const participantArgs =
            participantLidArgs.lid ?
            [{
                participantJid: window.Store.WidToJid.widToUserJid(participantLidArgs.lid),
                phoneNumberMixinArgs: {
                    anyPhoneNumber: window.Store.WidToJid.widToUserJid(participantLidArgs.phoneNumber)
                }
            }] :
            [{
                participantJid: window.Store.WidToJid.widToUserJid(participantLidArgs.phoneNumber)
            }];

        let result, participant;
        const data = {
            name: undefined,
            code: undefined,
            message: undefined,
            inviteV4Code: undefined,
            inviteV4CodeExp: undefined
        };

        try {
            result = await window.Store.GroupUtils.sendAddParticipantsRPC({
                participantArgs,
                iqTo
            });
            [participant] = result.value.addParticipant;
        } catch (err) {
            data.code = -1;
            data.message = 'SmaxParsingFailure: failed to parse the response of <AddParticipants>';
            return data;
        }

        if (result.name === 'AddParticipantsResponseSuccess') {
            const participantMixins = participant.addParticipantsParticipantMixins;
            const code = participantMixins?.value.error ?? '200';
            data.name = participantMixins?.name;
            data.code = +code;
            data.inviteV4Code = participantMixins?.value.addRequestCode;
            data.inviteV4CodeExp = participantMixins?.value.addRequestExpiration?.toString();
        } else if (result.name === 'AddParticipantsResponseClientError') {
            const {
                code: code,
                text: message
            } = result.value.errorAddParticipantsClientErrors.value;
            data.code = +code;
            data.message = message;
        } else if (result.name === 'AddParticipantsResponseServerError') {
            const {
                code: code,
                text: message
            } = result.value.errorServerErrors.value;
            data.code = +code;
            data.message = message;
        }

        return data;
    };

    window.WWebJS.getUploadLimits = async (messageType) => {
        const uploadLimit = window.Store.UploadLimits(messageType);
        return uploadLimit;
    };
    // end
};