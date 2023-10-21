"use strict";

const fs = require('fs')
const path = require('path')

const EventEmitter = require("events");
const playwright = require("playwright-chromium");
const moduleRaid = require("@pedroslopez/moduleraid/moduleraid");

const Util = require("./util/Util");
const InterfaceController = require("./util/InterfaceController");
const {
  WhatsWebURL,
  DefaultOptions,
  Events,
  WAState,
} = require("./util/Constants");
const { ExposeStore, LoadUtils } = require("./util/Injected");
const ChatFactory = require("./factories/ChatFactory");
const ContactFactory = require("./factories/ContactFactory");
const WebCacheFactory = require("./webCache/WebCacheFactory");
const {
  ClientInfo,
  Message,
  MessageMedia,
  Contact,
  Location,
  Poll,
  GroupNotification,
  Label,
  Call,
  Buttons,
  List,
  Reaction,
} = require("./structures");
const LinkingMethod = require('./authStrategies/LinkingMethod');
const LegacySessionAuth = require("./authStrategies/LegacySessionAuth");
const NoAuth = require("./authStrategies/NoAuth");

/**
 * Starting point for interacting with the WhatsApp Web API
 * @extends {EventEmitter}
 * @param {object} options - Client options
 * @param {AuthStrategy} options.authStrategy - Determines how to save and restore sessions. Will use LegacySessionAuth if options.session is set. Otherwise, NoAuth will be used.
 * @param {string} options.webVersion - The version of WhatsApp Web to use. Use options.webVersionCache to configure how the version is retrieved.
 * @param {object} options.webVersionCache - Determines how to retrieve the WhatsApp Web version. Defaults to a local cache (LocalWebCache) that falls back to latest if the requested version is not found.
 * @param {number} options.authTimeoutMs - Timeout for authentication selector in playwright
 * @param {object} options.playwright - playwright launch options. View docs here: https://github.com/playwright/playwright/
 * @param {number} options.qrMaxRetries - How many times should the qrcode be refreshed before giving up
 * @param {string} options.restartOnAuthFail- @deprecated This option should be set directly on the LegacySessionAuth.
 * @param {object} options.session - @deprecated Only here for backwards-compatibility. You should move to using LocalAuth, or set the authStrategy to LegacySessionAuth explicitly.
 * @param {number} options.takeoverOnConflict - If another whatsapp web session is detected (another browser), take over the session in the current browser
 * @param {number} options.takeoverTimeoutMs - How much time to wait before taking over the session
 * @param {string} options.userAgent - User agent to use in playwright
 * @param {string} options.ffmpegPath - Ffmpeg path to use when formating videos to webp while sending stickers
 * @param {boolean} options.bypassCSP - Sets bypassing of page's Content-Security-Policy.
 * @param {object} options.proxyAuthentication - Proxy Authentication object.
 *
 * @fires Client#qr
 * @fires Client#authenticated
 * @fires Client#auth_failure
 * @fires Client#ready
 * @fires Client#message
 * @fires Client#message_ack
 * @fires Client#message_create
 * @fires Client#message_revoke_me
 * @fires Client#message_revoke_everyone
 * @fires Client#media_uploaded
 * @fires Client#group_join
 * @fires Client#group_leave
 * @fires Client#group_update
 * @fires Client#disconnected
 * @fires Client#change_state
 * @fires Client#contact_changed
 * @fires Client#group_admin_changed
 * @fires Client#group_membership_request
 */
class Client extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = Util.mergeDefault(DefaultOptions, options);

    if (!this.options.authStrategy) {
      if (Object.prototype.hasOwnProperty.call(this.options, "session")) {
        process.emitWarning(
          "options.session is deprecated and will be removed in a future release due to incompatibility with multi-device. " +
          "Use the LocalAuth authStrategy, don't pass in a session as an option, or suppress this warning by using the LegacySessionAuth strategy explicitly (see https://wwebjs.dev/guide/authentication.html#legacysessionauth-strategy).",
          "DeprecationWarning"
        );

        this.authStrategy = new LegacySessionAuth({
          session: this.options.session,
          restartOnAuthFail: this.options.restartOnAuthFail,
        });
      } else {
        this.authStrategy = new NoAuth();
      }
    } else {
      this.authStrategy = this.options.authStrategy;
    }

    this.authStrategy.setup(this);

    this.mBrowser = null;
    this.mPage = null;

    Util.setFfmpegPath(this.options.ffmpegPath);
  }

  /**
   * Sets up events and requirements, kicks off authentication request
   */
  async initialize() {
    let [browser, page] = [null, null];

    await this.authStrategy.beforeBrowserInitialized();

    const playwrightOpts = this.options.playwright;
    if (playwrightOpts && playwrightOpts.wsEndpoint) {
      browser = await playwright.chromium.connect(playwrightOpts.wsEndpoint, {
        timeout: 0,
        ...playwrightOpts,
      });
      page = await context.newPage();
    } else {
      const browserArgs = [...(playwrightOpts.args || [])];
      if (!browserArgs.find((arg) => arg.includes("--user-agent"))) {
        browserArgs.push(`--user-agent=${this.options.userAgent}`);
      }

      browser = await playwright.chromium.launchPersistentContext(
        ".mywa_auth",
        {
          ...playwrightOpts,
          args: browserArgs,
          timeout: 0,
        }
      );
      page = (await browser.pages())[0];
    }

    if (this.options.proxyAuthentication !== undefined) {
      await page.authenticate(this.options.proxyAuthentication);
    }

    if (this.options.userAgent) {
      await page.setExtraHTTPHeaders({
        "User-Agent": this.options.userAgent,
      });
    }
    if (this.options.bypassCSP) await page.setBypassCSP(true);

    this.mBrowser = browser;
    this.mPage = page;

    await this.authStrategy.afterBrowserInitialized();
    await this.initWebVersionCache();

    await page.goto(WhatsWebURL, {
      waitUntil: "load",
      timeout: 0,
      referer: "https://whatsapp.com/",
    });

    await page.addScriptTag({
      path: require.resolve("@amiruldev/wajs"),
    });

    await page.waitForFunction(() => window.WPP?.isReady, {
      timeout: 60000,
    });

    // new
    const getElementByXpath = (path) => {
      return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    };

    let lastPercent = null,
      lastPercentMessage = null;
    let loads = false
    await page.exposeFunction('loadingScreen', async (percent, message) => {
      if (!loads) {
        this.emit(Events.LOADING_SCREEN, 'MywaJS', 'Please wait...')
        loads = true
      }
    });

    await page.exposeFunction('getElementByXpath', getElementByXpath);

    await page.evaluate(async (selectors) => {
      const observer = new MutationObserver(async () => {
        let progressBar = window.getElementByXpath(selectors.PROGRESS);
        let progressMessage = window.getElementByXpath(selectors.PROGRESS_MESSAGE);

        if (progressBar) {
          window.loadingScreen(progressBar.value, progressMessage.innerText);
        }
      });

      observer.observe(document, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true
      });
    }, {
      PROGRESS: 'div.progress > progress',
      PROGRESS_MESSAGE: 'div.secondary'
    });

    const INTRO_IMG_SELECTOR = 'span[data-icon="intro-md-beta-logo-light"]';
    const INTRO_QRCODE_SELECTOR = "div[data-ref] canvas";

    // Checks which selector appears first
    const needAuthentication = await Promise.race([
      new Promise((resolve) => {
        page
          .waitForSelector(INTRO_IMG_SELECTOR, {
            timeout: this.options.authTimeoutMs,
          })
          .then(() => resolve(false))
          .catch((err) => resolve(err));
      }),
      new Promise((resolve) => {
        page
          .waitForSelector(INTRO_QRCODE_SELECTOR, {
            timeout: this.options.authTimeoutMs,
          })
          .then(() => resolve(true))
          .catch((err) => resolve(err));
      }),
    ]);

    // Checks if an error occurred on the first found selector. The second will be discarded and ignored by .race;
    if (needAuthentication instanceof Error) throw needAuthentication;

    // Scan-qrcode selector was found. Needs authentication
    if (needAuthentication) {
      const { failed, failureEventPayload, restart } =
        await this.authStrategy.onAuthenticationNeeded();
      if (failed) {
        /**
         * Emitted when there has been an error while trying to restore an existing session
         * @event Client#auth_failure
         * @param {string} message
         */
        this.emit(Events.AUTHENTICATION_FAILURE, failureEventPayload);
        await this.destroy();
        if (restart) {
          // session restore failed so try again but without session to force new authentication
          return this.initialize();
        }
        return;
      }

      // start login QR
      const loginQR = async () => {
        const QR_CONTAINER = "div[data-ref]";
        const QR_RETRY_BUTTON = "div[data-ref] > span > button";
        let qrRetries = 0;
        await page.exposeFunction("qrChanged", async (qr) => {
          /**
           * Emitted when a QR code is received
           * @event Client#qr
           * @param {string} qr QR Code
           */
          this.emit(Events.QR_RECEIVED, qr);
          if (this.options.qrMaxRetries > 0) {
            qrRetries++;
            if (qrRetries > this.options.qrMaxRetries) {
              this.emit(Events.DISCONNECTED, "Max qrcode retries reached");
              await this.destroy();
            }
          }
        });

        await page.evaluate(
          function (selectors) {
            const qr_container = document.querySelector(selectors.QR_CONTAINER);
            window.qrChanged(qr_container.dataset.ref);

            const obs = new MutationObserver((muts) => {
              muts.forEach((mut) => {
                // Listens to qr token change
                if (
                  mut.type === "attributes" &&
                  mut.attributeName === "data-ref"
                ) {
                  window.qrChanged(mut.target.dataset.ref);
                }
                // Listens to retry button, when found, click it
                else if (mut.type === "childList") {
                  const retry_button = document.querySelector(
                    selectors.QR_RETRY_BUTTON
                  );
                  if (retry_button) retry_button.click();
                }
              });
            });
            obs.observe(qr_container.parentElement, {
              subtree: true,
              childList: true,
              attributes: true,
              attributeFilter: ["data-ref"],
            });
          },
          {
            QR_CONTAINER,
            QR_RETRY_BUTTON,
          }
        );
      };
      // end loginQR

      // start login phone
      const loginPhone = async () => {
        const LINK_WITH_PHONE_BUTTON = "div._3rDmx div._2rQUO span._3iLTh";
        const PHONE_NUMBER_INPUT = "input.selectable-text";
        const NEXT_BUTTON = "div._1M6AF._3QJHf";
        const CODE_CONTAINER =
          '[aria-details="link-device-phone-number-code-screen-instructions"]';
        const GENERATE_NEW_CODE_BUTTON = '[data-testid="popup-controls-ok"]';
        const LINK_WITH_PHONE_VIEW = "div._1x9Rv._3qC8O";

        await page.exposeFunction("codeChanged", async (code) => {
          /**
           * Emitted when a QR code is received
           * @event Client#code
           * @param {string} code Code
           */
          this.emit(Events.CODE_RECEIVED, code);
        });
        const clickOnLinkWithPhoneButton = async () => {
          await page.waitForSelector(LINK_WITH_PHONE_BUTTON, {
            timeout: 0,
          });
          await page.click(LINK_WITH_PHONE_BUTTON);
        };

        const typePhoneNumber = async () => {
          await page.waitForSelector(PHONE_NUMBER_INPUT);
          const inputValue = await page.$eval(
            PHONE_NUMBER_INPUT,
            (el) => el.value
          );
          await page.click(PHONE_NUMBER_INPUT);
          for (let i = 0; i < inputValue.length; i++) {
            await page.keyboard.press("Backspace");
          }
          await page.type(
            PHONE_NUMBER_INPUT,
            this.options.linkingMethod.phone.number
          );
        };

        await clickOnLinkWithPhoneButton();
        await typePhoneNumber();
        await page.click(NEXT_BUTTON);

        await page.evaluate(
          async function (selectors) {
            function waitForElementToExist(selector, timeout = 60000) {
              return new Promise((resolve, reject) => {
                if (document.querySelector(selector)) {
                  return resolve(document.querySelector(selector));
                }

                const observer = new MutationObserver(() => {
                  if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                  }
                });

                observer.observe(document.body, {
                  subtree: true,
                  childList: true,
                });

                if (timeout > 0) {
                  setTimeout(() => {
                    reject(
                      new Error(
                        `waitForElementToExist: ${selector} not found in time`
                      )
                    );
                  }, timeout);
                }
              });
            }

            await waitForElementToExist(selectors.CODE_CONTAINER);

            const getCode = () => {
              const codeContainer = document.querySelector(
                selectors.CODE_CONTAINER
              );
              const code = Array.from(codeContainer.children)[0];

              const cells = Array.from(code.children);
              return cells.map((cell) => cell.textContent).join("");
            };
            let code = getCode();
            window.codeChanged(code);

            const entirePageObserver = new MutationObserver(() => {
              const generateNewCodeButton = document.querySelector(
                selectors.GENERATE_NEW_CODE_BUTTON
              );
              if (generateNewCodeButton) {
                generateNewCodeButton.click();
                return;
              }
            });
            entirePageObserver.observe(document, {
              subtree: true,
              childList: true,
            });

            const linkWithPhoneView = document.querySelector(
              selectors.LINK_WITH_PHONE_VIEW
            );
            const linkWithPhoneViewObserver = new MutationObserver(() => {
              const newCode = getCode();
              if (newCode !== code) {
                window.codeChanged(newCode);
                code = newCode;
              }
            });
            linkWithPhoneViewObserver.observe(linkWithPhoneView, {
              subtree: true,
              childList: true,
            });
          },
          {
            CODE_CONTAINER,
            GENERATE_NEW_CODE_BUTTON,
            LINK_WITH_PHONE_VIEW,
          }
        );
      };
      // end login phone

      // login method
      const { linkingMethod } = this.options;
      if (linkingMethod.isQR()) {
        console.log('[ INFO ] After successfully connecting to the device, wait 30 seconds then restart !!')
        await loginQR();
      } else {
        console.log('[ INFO ] After successfully connecting to the device, wait 30 seconds then restart !!')
        await loginPhone();
      }

      // Wait for code scan
      try {
        await page.waitForSelector(INTRO_IMG_SELECTOR, { timeout: 0 });
      } catch (error) {
        if (
          error.name === "ProtocolError" &&
          error.message &&
          error.message.match(/Target closed/)
        ) {
          // something has called .destroy() while waiting
          return;
        }

        throw error;
      }
    }

    const inject = async () => {
      await page.evaluate(ExposeStore, moduleRaid.toString()).catch(async error => {
        if (error.message.includes('call')) {
          await inject();
        }
      });
    };
    await inject();

    await page.evaluate(() => {
      /**
       * Helper function that compares between two WWeb versions. Its purpose is to help the developer to choose the correct code implementation depending on the comparison value and the WWeb version.
       * @param {string} lOperand The left operand for the WWeb version string to compare with
       * @param {string} operator The comparison operator
       * @param {string} rOperand The right operand for the WWeb version string to compare with
       * @returns {boolean} Boolean value that indicates the result of the comparison
       */
      window.compareWwebVersions = (lOperand, operator, rOperand) => {
        if (![">", ">=", "<", "<=", "="].includes(operator)) {
          throw new (class _ extends Error {
            constructor(m) {
              super(m);
              this.name = "CompareWwebVersionsError";
            }
          })("Invalid comparison operator is provided");
        }
        if (typeof lOperand !== "string" || typeof rOperand !== "string") {
          throw new (class _ extends Error {
            constructor(m) {
              super(m);
              this.name = "CompareWwebVersionsError";
            }
          })("A non-string WWeb version type is provided");
        }

        lOperand = lOperand.replace(/-beta$/, "");
        rOperand = rOperand.replace(/-beta$/, "");

        while (lOperand.length !== rOperand.length) {
          lOperand.length > rOperand.length
            ? (rOperand = rOperand.concat("0"))
            : (lOperand = lOperand.concat("0"));
        }

        lOperand = Number(lOperand.replace(/\./g, ""));
        rOperand = Number(rOperand.replace(/\./g, ""));

        return operator === ">"
          ? lOperand > rOperand
          : operator === ">="
            ? lOperand >= rOperand
            : operator === "<"
              ? lOperand < rOperand
              : operator === "<="
                ? lOperand <= rOperand
                : operator === "="
                  ? lOperand === rOperand
                  : false;
      };
    });

    //await page.evaluate(ExposeStore, moduleRaid.toString());
    const authEventPayload = await this.authStrategy.getAuthEventPayload();

    /**
     * Emitted when authentication is successful
     * @event Client#authenticated
     */
    this.emit(Events.AUTHENTICATED, authEventPayload);

    // Check window.Store Injection
    await page.waitForFunction("window.Store != undefined");

    await page.evaluate(async () => {
      // safely unregister service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        registration.unregister();
      }
    });

    //Load util functions (serializers, helper functions)
    await page.evaluate(LoadUtils);

    // Expose client info
    /**
     * Current connection information
     * @type {ClientInfo}
     */
    this.info = new ClientInfo(
      this,
      await page.evaluate(() => {
        return {
          ...window.Store.Conn.serialize(),
          wid: window.Store.User.getMeUser(),
        };
      })
    );

    // Add InterfaceController
    this.interface = new InterfaceController(this);

    // Register events
    await page.exposeFunction("onAddMessageEvent", (msg) => {
      if (msg.type === "gp2") {
        const notification = new GroupNotification(this, msg);
        if (["add", "invite", "linked_group_join"].includes(msg.subtype)) {
          /**
           * Emitted when a user joins the chat via invite link or is added by an admin.
           * @event Client#group_join
           * @param {GroupNotification} notification GroupNotification with more information about the action
           */
          this.emit(Events.GROUP_JOIN, notification);
        } else if (msg.subtype === "remove" || msg.subtype === "leave") {
          /**
           * Emitted when a user leaves the chat or is removed by an admin.
           * @event Client#group_leave
           * @param {GroupNotification} notification GroupNotification with more information about the action
           */
          this.emit(Events.GROUP_LEAVE, notification);
        } else if (msg.subtype === "promote" || msg.subtype === "demote") {
          /**
           * Emitted when a current user is promoted to an admin or demoted to a regular user.
           * @event Client#group_admin_changed
           * @param {GroupNotification} notification GroupNotification with more information about the action
           */
          this.emit(Events.GROUP_ADMIN_CHANGED, notification);
        } else if (msg.subtype === "created_membership_requests") {
          /**
           * Emitted when some user requested to join the group
           * that has the membership approval mode turned on
           * @event Client#group_membership_request
           * @param {GroupNotification} notification GroupNotification with more information about the action
           * @param {string} notification.chatId The group ID the request was made for
           * @param {string} notification.author The user ID that made a request
           * @param {number} notification.timestamp The timestamp the request was made at
           */
          this.emit(Events.GROUP_MEMBERSHIP_REQUEST, notification);
        } else {
          /**
           * Emitted when group settings are updated, such as subject, description or picture.
           * @event Client#group_update
           * @param {GroupNotification} notification GroupNotification with more information about the action
           */
          this.emit(Events.GROUP_UPDATE, notification);
        }
        return;
      }

      const message = new Message(this, msg);

      /**
       * Emitted when a new message is created, which may include the current user's own messages.
       * @event Client#message_create
       * @param {Message} message The message that was created
       */
      this.emit(Events.MESSAGE_CREATE, message);

      if (msg.id.fromMe) return;

      /**
       * Emitted when a new message is received.
       * @event Client#message
       * @param {Message} message The message that was received
       */
      this.emit(Events.MESSAGE_RECEIVED, message);
    });

    let last_message;

    await page.exposeFunction("onChangeMessageTypeEvent", (msg) => {
      if (msg.type === "revoked") {
        const message = new Message(this, msg);
        let revoked_msg;
        if (last_message && msg.id.id === last_message.id.id) {
          revoked_msg = new Message(this, last_message);
        }

        /**
         * Emitted when a message is deleted for everyone in the chat.
         * @event Client#message_revoke_everyone
         * @param {Message} message The message that was revoked, in its current state. It will not contain the original message's data.
         * @param {?Message} revoked_msg The message that was revoked, before it was revoked. It will contain the message's original data.
         * Note that due to the way this data is captured, it may be possible that this param will be undefined.
         */
        this.emit(Events.MESSAGE_REVOKED_EVERYONE, message, revoked_msg);
      }
    });

    await page.exposeFunction("onChangeMessageEvent", (msg) => {
      if (msg.type !== "revoked") {
        last_message = msg;
      }

      /**
       * The event notification that is received when one of
       * the group participants changes their phone number.
       */
      const isParticipant = msg.type === "gp2" && msg.subtype === "modify";

      /**
       * The event notification that is received when one of
       * the contacts changes their phone number.
       */
      const isContact =
        msg.type === "notification_template" && msg.subtype === "change_number";

      if (isParticipant || isContact) {
        /** @type {GroupNotification} object does not provide enough information about this event, so a @type {Message} object is used. */
        const message = new Message(this, msg);

        const newId = isParticipant ? msg.recipients[0] : msg.to;
        const oldId = isParticipant
          ? msg.author
          : msg.templateParams.find((id) => id !== newId);

        /**
         * Emitted when a contact or a group participant changes their phone number.
         * @event Client#contact_changed
         * @param {Message} message Message with more information about the event.
         * @param {String} oldId The user's id (an old one) who changed their phone number
         * and who triggered the notification.
         * @param {String} newId The user's new id after the change.
         * @param {Boolean} isContact Indicates if a contact or a group participant changed their phone number.
         */
        this.emit(Events.CONTACT_CHANGED, message, oldId, newId, isContact);
      }
    });

    await page.exposeFunction("onRemoveMessageEvent", (msg) => {
      if (!msg.isNewMsg) return;

      const message = new Message(this, msg);

      /**
       * Emitted when a message is deleted by the current user.
       * @event Client#message_revoke_me
       * @param {Message} message The message that was revoked
       */
      this.emit(Events.MESSAGE_REVOKED_ME, message);
    });

    await page.exposeFunction("onMessageAckEvent", (msg, ack) => {
      const message = new Message(this, msg);

      /**
       * Emitted when an ack event occurrs on message type.
       * @event Client#message_ack
       * @param {Message} message The message that was affected
       * @param {MessageAck} ack The new ACK value
       */
      this.emit(Events.MESSAGE_ACK, message, ack);
    });

    await page.exposeFunction("onChatUnreadCountEvent", async (data) => {
      const chat = await this.getChatById(data.id);

      /**
       * Emitted when the chat unread count changes
       */
      this.emit(Events.UNREAD_COUNT, chat);
    });

    await page.exposeFunction("onMessageMediaUploadedEvent", (msg) => {
      const message = new Message(this, msg);

      /**
       * Emitted when media has been uploaded for a message sent by the client.
       * @event Client#media_uploaded
       * @param {Message} message The message with media that was uploaded
       */
      this.emit(Events.MEDIA_UPLOADED, message);
    });

    await page.exposeFunction("onAppStateChangedEvent", async (state) => {
      /**
       * Emitted when the connection state changes
       * @event Client#change_state
       * @param {WAState} state the new connection state
       */
      this.emit(Events.STATE_CHANGED, state);

      const ACCEPTED_STATES = [
        WAState.CONNECTED,
        WAState.OPENING,
        WAState.PAIRING,
        WAState.TIMEOUT,
      ];

      if (this.options.takeoverOnConflict) {
        ACCEPTED_STATES.push(WAState.CONFLICT);

        if (state === WAState.CONFLICT) {
          setTimeout(() => {
            this.mPage.evaluate(() => window.Store.AppState.takeover());
          }, this.options.takeoverTimeoutMs);
        }
      }

      if (!ACCEPTED_STATES.includes(state)) {
        /**
         * Emitted when the client has been disconnected
         * @event Client#disconnected
         * @param {WAState|"NAVIGATION"} reason reason that caused the disconnect
         */
        await this.authStrategy.disconnect();
        this.emit(Events.DISCONNECTED, state);
        this.destroy();
      }
    });

    await page.exposeFunction("onBatteryStateChangedEvent", (state) => {
      const { battery, plugged } = state;

      if (battery === undefined) return;

      /**
       * Emitted when the battery percentage for the attached device changes. Will not be sent if using multi-device.
       * @event Client#change_battery
       * @param {object} batteryInfo
       * @param {number} batteryInfo.battery - The current battery percentage
       * @param {boolean} batteryInfo.plugged - Indicates if the phone is plugged in (true) or not (false)
       * @deprecated
       */
      this.emit(Events.BATTERY_CHANGED, { battery, plugged });
    });

    await page.exposeFunction("onIncomingCall", (call) => {
      /**
       * Emitted when a call is received
       * @event Client#incoming_call
       * @param {object} call
       * @param {number} call.id - Call id
       * @param {string} call.peerJid - Who called
       * @param {boolean} call.isVideo - if is video
       * @param {boolean} call.isGroup - if is group
       * @param {boolean} call.canHandleLocally - if we can handle in waweb
       * @param {boolean} call.outgoing - if is outgoing
       * @param {boolean} call.webClientShouldHandle - If Waweb should handle
       * @param {object} call.participants - Participants
       */
      const cll = new Call(this, call);
      this.emit(Events.INCOMING_CALL, cll);
    });

    await page.exposeFunction("onReaction", (reactions) => {
      for (const reaction of reactions) {
        /**
         * Emitted when a reaction is sent, received, updated or removed
         * @event Client#message_reaction
         * @param {object} reaction
         * @param {object} reaction.id - Reaction id
         * @param {number} reaction.orphan - Orphan
         * @param {?string} reaction.orphanReason - Orphan reason
         * @param {number} reaction.timestamp - Timestamp
         * @param {string} reaction.reaction - Reaction
         * @param {boolean} reaction.read - Read
         * @param {object} reaction.msgId - Parent message id
         * @param {string} reaction.senderId - Sender id
         * @param {?number} reaction.ack - Ack
         */

        this.emit(Events.MESSAGE_REACTION, new Reaction(this, reaction));
      }
    });

    await page.exposeFunction("onRemoveChatEvent", async (chat) => {
      const _chat = await this.getChatById(chat.id);

      /**
       * Emitted when a chat is removed
       * @event Client#chat_removed
       * @param {Chat} chat
       */
      this.emit(Events.CHAT_REMOVED, _chat);
    });

    await page.exposeFunction(
      "onArchiveChatEvent",
      async (chat, currState, prevState) => {
        const _chat = await this.getChatById(chat.id);

        /**
         * Emitted when a chat is archived/unarchived
         * @event Client#chat_archived
         * @param {Chat} chat
         * @param {boolean} currState
         * @param {boolean} prevState
         */
        this.emit(Events.CHAT_ARCHIVED, _chat, currState, prevState);
      }
    );

    await page.exposeFunction(
      "onEditMessageEvent",
      (msg, newBody, prevBody) => {
        if (msg.type === "revoked") {
          return;
        }
        /**
         * Emitted when messages are edited
         * @event Client#message_edit
         * @param {Message} message
         * @param {string} newBody
         * @param {string} prevBody
         */
        this.emit(
          Events.MESSAGE_EDIT,
          new Message(this, msg),
          newBody,
          prevBody
        );
      }
    );

    await page.evaluate(() => {
      window.Store.Msg.on("change", (msg) => {
        window.onChangeMessageEvent(window.WWebJS.getMessageModel(msg));
      });
      window.Store.Msg.on("change:type", (msg) => {
        window.onChangeMessageTypeEvent(window.WWebJS.getMessageModel(msg));
      });
      window.Store.Msg.on("change:ack", (msg, ack) => {
        window.onMessageAckEvent(window.WWebJS.getMessageModel(msg), ack);
      });
      window.Store.Msg.on("change:isUnsentMedia", (msg, unsent) => {
        if (msg.id.fromMe && !unsent)
          window.onMessageMediaUploadedEvent(
            window.WWebJS.getMessageModel(msg)
          );
      });
      window.Store.Msg.on("remove", (msg) => {
        if (msg.isNewMsg)
          window.onRemoveMessageEvent(window.WWebJS.getMessageModel(msg));
      });
      window.Store.Msg.on("change:body", (msg, newBody, prevBody) => {
        window.onEditMessageEvent(
          window.WWebJS.getMessageModel(msg),
          newBody,
          prevBody
        );
      });
      window.Store.AppState.on("change:state", (_AppState, state) => {
        window.onAppStateChangedEvent(state);
      });
      window.Store.Conn.on("change:battery", (state) => {
        window.onBatteryStateChangedEvent(state);
      });
      window.Store.Call.on("add", (call) => {
        window.onIncomingCall(call);
      });
      window.Store.Chat.on("remove", async (chat) => {
        window.onRemoveChatEvent(await window.WWebJS.getChatModel(chat));
      });
      window.Store.Chat.on(
        "change:archive",
        async (chat, currState, prevState) => {
          window.onArchiveChatEvent(
            await window.WWebJS.getChatModel(chat),
            currState,
            prevState
          );
        }
      );
      window.Store.Msg.on("add", (msg) => {
        if (msg.isNewMsg) {
          if (msg.type === "ciphertext") {
            // defer message event until ciphertext is resolved (type changed)
            msg.once("change:type", (_msg) =>
              window.onAddMessageEvent(window.WWebJS.getMessageModel(_msg))
            );
          } else {
            window.onAddMessageEvent(window.WWebJS.getMessageModel(msg));
          }
        }
      });
      window.Store.Chat.on("change:unreadCount", (chat) => {
        window.onChatUnreadCountEvent(chat);
      });

      {
        const module = window.Store.createOrUpdateReactionsModule;
        const ogMethod = module.createOrUpdateReactions;
        module.createOrUpdateReactions = ((...args) => {
          window.onReaction(
            args[0].map((reaction) => {
              const msgKey = window.Store.MsgKey.fromString(reaction.msgKey);
              const parentMsgKey = window.Store.MsgKey.fromString(
                reaction.parentMsgKey
              );
              const timestamp = reaction.timestamp / 1000;

              return { ...reaction, msgKey, parentMsgKey, timestamp };
            })
          );

          return ogMethod(...args);
        }).bind(module);
      }
    });

    /**
     * Emitted when the client has initialized and is ready to receive messages.
     * @event Client#ready
     */
    this.emit(Events.READY);
    this.authStrategy.afterAuthReady();

    // Disconnect when navigating away when in PAIRING state (detect logout)
    this.mPage.on("framenavigated", async () => {
      const appState = await this.getState();
      if (!appState || appState === WAState.PAIRING) {
        await this.authStrategy.disconnect();
        this.emit(Events.DISCONNECTED, "NAVIGATION");
        await this.destroy();
      }
    });
  }

  async initWebVersionCache() {
    const { type: webCacheType, ...webCacheOptions } =
      this.options.webVersionCache;
    const webCache = WebCacheFactory.createWebCache(
      webCacheType,
      webCacheOptions
    );

    const requestedVersion = this.options.webVersion;
    const versionContent = await webCache.resolve(requestedVersion);

    if (versionContent) {
      await this.mPage.setRequestInterception(true);
      this.mPage.on("request", async (req) => {
        if (req.url() === WhatsWebURL) {
          req.respond({
            status: 200,
            contentType: "text/html",
            body: versionContent,
          });
        } else {
          req.continue();
        }
      });
    } else {
      this.mPage.on("response", async (res) => {
        if (res.ok() && res.url() === WhatsWebURL) {
          await webCache.persist(await res.text());
        }
      });
    }
  }

  /**
   * Closes the client
   */
  async destroy() {
    await this.mBrowser.close();
    await this.authStrategy.destroy();
  }

  /**
   * Logs out the client, closing the current session
   */
  async logout() {
    await this.mPage.evaluate(() => {
      return window.Store.AppState.logout();
    });
    await this.mBrowser.close();

    let maxDelay = 0;
    while (this.mBrowser.isConnected() && maxDelay < 10) {
      // waits a maximum of 1 second before calling the AuthStrategy
      await new Promise((resolve) => setTimeout(resolve, 100));
      maxDelay++;
    }

    await this.authStrategy.logout();
  }

  /**
   * Returns the version of WhatsApp Web currently being run
   * @returns {Promise<string>}
   */
  async getWWeb() {
    return await this.mPage.evaluate(() => {
      var res = {
        version: window.Debug.VERSION,
        desktop_beta: window.Debug.DESKTOP_BETA,
        id: window.Debug.BUILD_ID,
      };
      return res;
    });
  }

  /**
   * Mark as seen for the Chat
   *@param {string} chatId
   *@returns {Promise<boolean>} result
   *
   */
  async sendSeen(chatId) {
    const result = await this.mPage.evaluate(async (chatId) => {
      return window.WWebJS.sendSeen(chatId);
    }, chatId);
    return result;
  }

  /**
   * Message options.
   * @typedef {Object} MessageSendOptions
   * @property {boolean} [linkPreview=true] - Show links preview. Has no effect on multi-device accounts.
   * @property {boolean} [sendAudioAsVoice=false] - Send audio as voice message with a generated waveform
   * @property {boolean} [sendVideoAsGif=false] - Send video as gif
   * @property {boolean} [sendMediaAsSticker=false] - Send media as a sticker
   * @property {boolean} [sendMediaAsDocument=false] - Send media as a document
   * @property {boolean} [isViewOnce=false] - Send photo/video as a view once message
   * @property {boolean} [parseVCards=true] - Automatically parse vCards and send them as contacts
   * @property {string} [caption] - Image or video caption
   * @property {string} [quotedMessageId] - Id of the message that is being quoted (or replied to)
   * @property {Contact[]} [mentions] - Contacts that are being mentioned in the message
   * @property {boolean} [sendSeen=true] - Mark the conversation as seen after sending the message
   * @property {string} [stickerAuthor=undefined] - Sets the author of the sticker, (if sendMediaAsSticker is true).
   * @property {string} [stickerName=undefined] - Sets the name of the sticker, (if sendMediaAsSticker is true).
   * @property {string[]} [stickerCategories=undefined] - Sets the categories of the sticker, (if sendMediaAsSticker is true). Provide emoji char array, can be null.
   * @property {MessageMedia} [media] - Media to be sent
   */

  /**
   * Send a message to a specific chatId
   * @param {string} chatId
   * @param {string|MessageMedia|Location|Poll|Contact|Array<Contact>|Buttons|List} content
   * @param {MessageSendOptions} [options] - Options used when sending the message
   *
   * @returns {Promise<Message>} Message that was just sent
   */
  async sendMessage(chatId, content, options = {}) {
    let internalOptions = {
      linkPreview: options.linkPreview,
      sendAudioAsVoice: options.ptt,
      sendVideoAsGif: options.gifPlayBack,
      sendMediaAsSticker: options.asSticker,
      sendMediaAsDocument: options.asDocument,
      caption: options.caption,
      quotedMessageId: options.quoted?.id ?
        options.quoted._serialized || options.quoted.id._serialized :
        options.quoted,
      parseVCards: options.parseVCards === false ? false : true,
      mentionedJidList: Array.isArray(options.mentions) ?
        options.mentions.map((contact) =>
          contact?.id ? contact?.id?._serialized : contact
        ) :
        [],
      extraOptions: options.extra,
    };

    if (options.caption) internalOptions.caption = options.caption;
    const sendSeen =
      typeof options.sendSeen === "undefined" ? true : options.sendSeen;

    if (
      Buffer.isBuffer(content) ||
      /^[a-zA-Z0-9+/]*={0,2}$/i.test(content) ||
      /^data:.*?\/.*?;base64,/i.test(content) ||
      /^https?:\/\//.test(content) ||
      fs.existsSync(content)
    ) {
      let media = await Util.getFile(content);
      let ex = typeof media === "undefined" ? ".bin" : media.ext;
      if (!options.mimetype && ex === ".bin") {
        content = content;
      } else {
        internalOptions.attachment = {
          mimetype: options.mimetype ? options.mimetype : media.mime,
          data: media?.data?.toString("base64") || Util.bufferToBase64(media.data),
          filename: options.fileName ?
            options.fileName :
            Util.getRandom(media.ext),
          filesize: options.fileSize ? options.fileSize : media.size,
        };
        content = "";
      }
    } else if (content instanceof MessageMedia) {
      internalOptions.attachment = content;
      content = "";
    } else if (options.media instanceof MessageMedia) {
      internalOptions.attachment = options.media;
      internalOptions.caption = content;
      content = "";
    } else if (content instanceof Location) {
      internalOptions.location = content;
      content = "";
    } else if (content instanceof Contact) {
      internalOptions.contactCard = content.id ?
        content.id._serialized :
        content;
      content = "";
    } else if (
      Array.isArray(content) &&
      content.length > 0 &&
      content[0] instanceof Contact
    ) {
      internalOptions.contactCardList = content.map((contact) =>
        contact.id ? contact.id._serialized : contact
      );
      content = "";
    } else if (content instanceof Buttons) {
      if (content.type !== "chat") {
        internalOptions.attachment = content.body;
      }
      internalOptions.buttons = content;
      content = "";
    } else if (content instanceof List) {
      internalOptions.list = content;
      content = "";
    }

    if (internalOptions.sendMediaAsSticker && internalOptions.attachment) {
      internalOptions.attachment = await Util.formatToWebpSticker(
        internalOptions.attachment, {
        packId: options?.packId ? options.packId : global?.Exif?.packId,
        packName: options?.packName ?
          options.packName :
          global?.Exif?.packName,
        packPublish: options?.packPublish ?
          options.packPublish :
          global?.Exif?.packPublish,
        packEmail: options?.packEmail ?
          options.packEmail :
          global?.Exif?.packEmail,
        packWebsite: options?.packWebsite ?
          options.packWebsite :
          global?.Exif?.packWebsite,
        androidApp: options?.androidApp ?
          options.androidApp :
          global?.Exif?.androidApp,
        iOSApp: options?.iOSApp ? options.iOSApp : global?.Exif?.iOSApp,
        categories: options?.categories ?
          options.categories :
          global?.Exif?.categories,
        isAvatar: options?.isAvatar ?
          options.isAvatar :
          global?.Exif?.isAvatar,
      },
        this.mPage
      );
    }

    if (internalOptions.attachment?.filesize > 42428800) {
      let startDivision = 2;
      let middle = internalOptions.attachment.data.length / startDivision;
      let currentIndex = 0;


      while (middle > (1024 * 1024 * 50)) {
        startDivision += 1;
        middle = Math.floor(internalOptions.attachment.data.length / startDivision);
      }

      const randomId = Util.generateHash(32);

      while (currentIndex < internalOptions.attachment.data.length) {
        let chunkPiece = middle;
        if (currentIndex + middle > internalOptions.attachment.data.length) {
          chunkPiece = internalOptions.attachment.data.length - currentIndex;
        }
        await this.mPage.evaluate(async ({
          chatId,
          chunk,
          randomId
        }) => {
          if (chunk && window[`mediaChunk_${randomId}`]) {
            window[`mediaChunk_${randomId}`] += chunk;
          } else {
            window[`mediaChunk_${randomId}`] = chunk;
          }
        }, {
          chatId,
          chunk: internalOptions.attachment.data.substring(currentIndex, currentIndex + chunkPiece),
          randomId
        });
        currentIndex += chunkPiece;

      }

      internalOptions.attachment = new MessageMedia(internalOptions.attachment.mimetype, `mediaChunk_${randomId}`, internalOptions.attachment.filename, internalOptions.attachment.filesize);
    }

    const newMessage = await this.mPage.evaluate(
      async ({
        chatId,
        message,
        options,
        sendSeen
      }) => {
        const chatWid = window.Store.WidFactory.createWid(chatId);
        const chat = await window.Store.Chat.find(chatWid);

        if (sendSeen) {
          window.WWebJS.sendSeen(chatId);
        }

        if (options?.attachment?.data?.startsWith('mediaChunk')) {
          options.attachment.data = window[options.attachment.data];
          delete window[options.attachment.data];
        }


        const msg = await window.WWebJS.sendMessage(
          chat,
          message,
          options,
          sendSeen
        );
        return msg.serialize();
      }, {
      chatId,
      message: content,
      options: internalOptions,
      sendSeen,
    }
    );

    if (newMessage) return new Message(this, newMessage);
  }

  /**
   * Searches for messages
   * @param {string} query
   * @param {Object} [options]
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @param {string} [options.chatId]
   * @returns {Promise<Message[]>}
   */
  async searchMessages(query, options = {}) {
    const messages = await this.mPage.evaluate(
      async ({ query, page, count, remote }) => {
        const { messages } = await window.Store.Msg.search(
          query,
          page,
          count,
          remote
        );
        return messages.map((msg) => window.WWebJS.getMessageModel(msg));
      },
      {
        query,
        page: options.page,
        count: options.limit,
        remote: options.chatId
      }
    );

    return messages.map((msg) => new Message(this, msg));
  }

  /**
   * Get all current chat instances
   * @returns {Promise<Array<Chat>>}
   */
  async getChats() {
    let chats = await this.mPage.evaluate(async () => {
      return await window.WWebJS.getChats();
    });

    return chats.map((chat) => ChatFactory.create(this, chat));
  }

  /**
   * Get chat instance by ID
   * @param {string} chatId
   * @returns {Promise<Chat>}
   */
  async getChatById(chatId) {
    let chat = await this.mPage.evaluate(async (chatId) => {
      return await window.WWebJS.getChat(chatId);
    }, chatId);

    return ChatFactory.create(this, chat);
  }

  /**
   * Get all current contact instances
   * @returns {Promise<Array<Contact>>}
   */
  async getContacts() {
    let contacts = await this.mPage.evaluate(() => {
      return window.WWebJS.getContacts();
    });

    return contacts.map((contact) => ContactFactory.create(this, contact));
  }

  /**
   * Get contact instance by ID
   * @param {string} contactId
   * @returns {Promise<Contact>}
   */
  async getContactById(contactId) {
    let contact = await this.mPage.evaluate((contactId) => {
      return window.WWebJS.getContact(contactId);
    }, contactId);

    return ContactFactory.create(this, contact);
  }

  async getMessageById(messageId) {
    const msg = await this.mPage.evaluate(async (messageId) => {
      let msg = window.Store.Msg.get(messageId);
      if (msg) return window.WWebJS.getMessageModel(msg);

      const params = messageId.split("_");
      if (params.length !== 3)
        throw new Error("Invalid serialized message id specified");

      let messagesObject = await window.Store.Msg.getMessagesById([messageId]);
      if (messagesObject && messagesObject.messages.length)
        msg = messagesObject.messages[0];

      if (msg) return window.WWebJS.getMessageModel(msg);
    }, messageId);

    if (msg) return new Message(this, msg);
    return null;
  }

  /**
   * Returns an object with information about the invite code's group
   * @param {string} inviteCode
   * @returns {Promise<object>} Invite information
   */
  async getInviteInfo(inviteCode) {
    return await this.mPage.evaluate((inviteCode) => {
      return window.Store.GroupInvite.queryGroupInvite(inviteCode);
    }, inviteCode);
  }

  /**
   * Accepts an invitation to join a group
   * @param {string} inviteCode Invitation code
   * @returns {Promise<string>} Id of the joined Chat
   */
  async acceptInvite(inviteCode) {
    const res = await this.mPage.evaluate(async (inviteCode) => {
      return await window.Store.GroupInvite.joinGroupViaInvite(inviteCode);
    }, inviteCode);

    return res.gid._serialized;
  }

  /**
   * Accepts a private invitation to join a group
   * @param {object} inviteInfo Invite V4 Info
   * @returns {Promise<Object>}
   */
  async acceptGroupV4Invite(inviteInfo) {
    if (!inviteInfo.inviteCode)
      throw "Invalid invite code, try passing the message.inviteV4 object";
    if (inviteInfo.inviteCodeExp == 0) throw "Expired invite code";
    return this.mPage.evaluate(async (inviteInfo) => {
      let { groupId, fromId, inviteCode, inviteCodeExp } = inviteInfo;
      let userWid = window.Store.WidFactory.createWid(fromId);
      return await window.Store.GroupInviteV4.joinGroupViaInviteV4(
        inviteCode,
        String(inviteCodeExp),
        groupId,
        userWid
      );
    }, inviteInfo);
  }

  /**
   * Sets the current user's status message
   * @param {string} status New status message
   */
  async setStatus(status) {
    await this.mPage.evaluate(async (status) => {
      return await window.Store.StatusUtils.setMyStatus(status);
    }, status);
  }

  /**
   * Sets the current user's display name.
   * This is the name shown to WhatsApp users that have not added you as a contact beside your number in groups and in your profile.
   * @param {string} displayName New display name
   * @returns {Promise<Boolean>}
   */
  async setName(displayName) {
    const couldSet = await this.mPage.evaluate(async (displayName) => {
      if (!window.Store.Conn.canSetMyPushname()) return false;

      if (window.Store.MDBackend) {
        // TODO
        return false;
      } else {
        const res = await window.Store.Wap.setPushname(displayName);
        return !res.status || res.status === 200;
      }
    }, displayName);

    return couldSet;
  }

  /**
   * Gets the current connection state for the client
   * @returns {WAState}
   */
  async getState() {
    return await this.mPage.evaluate(() => {
      if (!window.Store) return null;
      return window.Store.AppState.state;
    });
  }

  /**
   * Marks the client as online
   */
  async sendPresenceAvailable() {
    return await this.mPage.evaluate(() => {
      return window.Store.PresenceUtils.sendPresenceAvailable();
    });
  }

  /**
   * Marks the client as unavailable
   */
  async sendPresenceUnavailable() {
    return await this.mPage.evaluate(() => {
      return window.Store.PresenceUtils.sendPresenceUnavailable();
    });
  }

  /**
   * Enables and returns the archive state of the Chat
   * @returns {boolean}
   */
  async archiveChat(chatId) {
    return await this.mPage.evaluate(async (chatId) => {
      let chat = await window.Store.Chat.get(chatId);
      await window.Store.Cmd.archiveChat(chat, true);
      return true;
    }, chatId);
  }

  /**
   * Changes and returns the archive state of the Chat
   * @returns {boolean}
   */
  async unarchiveChat(chatId) {
    return await this.mPage.evaluate(async (chatId) => {
      let chat = await window.Store.Chat.get(chatId);
      await window.Store.Cmd.archiveChat(chat, false);
      return false;
    }, chatId);
  }

  /**
   * Pins the Chat
   * @returns {Promise<boolean>} New pin state. Could be false if the max number of pinned chats was reached.
   */
  async pinChat(chatId) {
    return this.mPage.evaluate(async (chatId) => {
      let chat = window.Store.Chat.get(chatId);
      if (chat.pin) {
        return true;
      }
      const MAX_PIN_COUNT = 3;
      const chatModels = window.Store.Chat.getModelsArray();
      if (chatModels.length > MAX_PIN_COUNT) {
        let maxPinned = chatModels[MAX_PIN_COUNT - 1].pin;
        if (maxPinned) {
          return false;
        }
      }
      await window.Store.Cmd.pinChat(chat, true);
      return true;
    }, chatId);
  }

  /**
   * Unpins the Chat
   * @returns {Promise<boolean>} New pin state
   */
  async unpinChat(chatId) {
    return this.mPage.evaluate(async (chatId) => {
      let chat = window.Store.Chat.get(chatId);
      if (!chat.pin) {
        return false;
      }
      await window.Store.Cmd.pinChat(chat, false);
      return false;
    }, chatId);
  }

  /**
   * Mutes this chat forever, unless a date is specified
   * @param {string} chatId ID of the chat that will be muted
   * @param {?Date} unmuteDate Date when the chat will be unmuted, leave as is to mute forever
   */
  async muteChat(chatId, unmuteDate) {
    unmuteDate = unmuteDate ? unmuteDate.getTime() / 1000 : -1;
    await this.mPage.evaluate(
      async ({ chatId, timestamp }) => {
        let chat = await window.Store.Chat.get(chatId);
        await chat.mute.mute({ expiration: timestamp, sendDevice: !0 });
      },
      {
        chatId,
        timestamp: unmuteDate || -1
      }
    );
  }

  /**
   * Unmutes the Chat
   * @param {string} chatId ID of the chat that will be unmuted
   */
  async unmuteChat(chatId) {
    await this.mPage.evaluate(async (chatId) => {
      let chat = await window.Store.Chat.get(chatId);
      await window.Store.Cmd.muteChat(chat, false);
    }, chatId);
  }

  /**
   * Mark the Chat as unread
   * @param {string} chatId ID of the chat that will be marked as unread
   */
  async markChatUnread(chatId) {
    await this.mPage.evaluate(async (chatId) => {
      let chat = await window.Store.Chat.get(chatId);
      await window.Store.Cmd.markChatUnread(chat, true);
    }, chatId);
  }

  /**
   * Returns the contact ID's profile picture URL, if privacy settings allow it
   * @param {string} contactId the whatsapp user's ID
   * @returns {Promise<string>}
   */
  async getProfilePict(contactId) {
    const profilePic = await this.mPage.evaluate(async (contactId) => {
      try {
        const chatWid = window.Store.WidFactory.createWid(contactId);
        return await window.Store.ProfilePic.profilePicFind(chatWid);
      } catch (err) {
        if (err.name === "ServerStatusCodeError") return undefined;
        throw err;
      }
    }, contactId);

    return profilePic ? profilePic.eurl : undefined;
  }

  /**
   * Gets the Contact's common groups with you. Returns empty array if you don't have any common group.
   * @param {string} contactId the whatsapp user's ID (_serialized format)
   * @returns {Promise<WAWebJS.ChatId[]>}
   */
  async getCommonGroups(contactId) {
    const commonGroups = await this.mPage.evaluate(async (contactId) => {
      let contact = window.Store.Contact.get(contactId);
      if (!contact) {
        const wid = window.Store.WidFactory.createUserWid(contactId);
        const chatConstructor = window.Store.Contact.getModelsArray().find(
          (c) => !c.isGroup
        ).constructor;
        contact = new chatConstructor({ id: wid });
      }

      if (contact.commonGroups) {
        return contact.commonGroups.serialize();
      }
      const status = await window.Store.findCommonGroups(contact);
      if (status) {
        return contact.commonGroups.serialize();
      }
      return [];
    }, contactId);
    const chats = [];
    for (const group of commonGroups) {
      chats.push(group.id);
    }
    return chats;
  }

  /**
   * Force reset of connection state for the client
   */
  async resetState() {
    await this.mPage.evaluate(() => {
      window.Store.AppState.phoneWatchdog.shiftTimer.forceRunNow();
    });
  }

  /**
   * Check if a given ID is registered in whatsapp
   * @param {string} id the whatsapp user's ID
   * @returns {Promise<Boolean>}
   */
  async isRegisteredUser(id) {
    return Boolean(await this.getNumberId(id));
  }

  /**
   * Get the registered WhatsApp ID for a number.
   * Will return null if the number is not registered on WhatsApp.
   * @param {string} number Number or ID ("@c.us" will be automatically appended if not specified)
   * @returns {Promise<Object|null>}
   */
  async getNumberId(number) {
    if (!number.endsWith("@c.us")) {
      number += "@c.us";
    }

    return await this.mPage.evaluate(async (number) => {
      const wid = window.Store.WidFactory.createWid(number);
      const result = await window.Store.QueryExist(wid);
      if (!result || result.wid === undefined) return null;
      return result.wid;
    }, number);
  }

  /**
   * Get the formatted number of a WhatsApp ID.
   * @param {string} number Number or ID
   * @returns {Promise<string>}
   */
  async getFormattedNumber(number) {
    if (!number.endsWith("@s.whatsapp.net"))
      number = number.replace("c.us", "s.whatsapp.net");
    if (!number.includes("@s.whatsapp.net"))
      number = `${number}@s.whatsapp.net`;

    return await this.mPage.evaluate(async (numberId) => {
      return window.Store.NumberInfo.formattedPhoneNumber(numberId);
    }, number);
  }

  /**
   * Get the country code of a WhatsApp ID.
   * @param {string} number Number or ID
   * @returns {Promise<string>}
   */
  async getCountryCode(number) {
    number = number.replace(" ", "").replace("+", "").replace("@c.us", "");

    return await this.mPage.evaluate(async (numberId) => {
      return window.Store.NumberInfo.findCC(numberId);
    }, number);
  }

  /**
   * An object that represents the result for a participant added to a group
   * @typedef {Object} ParticipantResult
   * @property {number} statusCode The status code of the result
   * @property {string} message The result message
   * @property {boolean} isGroupCreator Indicates if the participant is a group creator
   * @property {boolean} isInviteV4Sent Indicates if the inviteV4 was sent to the participant
   */

  /**
   * An object that handles the result for {@link createGroup} method
   * @typedef {Object} CreateGroupResult
   * @property {string} title A group title
   * @property {Object} gid An object that handles the newly created group ID
   * @property {string} gid.server
   * @property {string} gid.user
   * @property {string} gid._serialized
   * @property {Object.<string, ParticipantResult>} participants An object that handles the result value for each added to the group participant
   */

  /**
   * An object that handles options for group creation
   * @typedef {Object} CreateGroupOptions
   * @property {number} [messageTimer = 0] The number of seconds for the messages to disappear in the group (0 by default, won't take an effect if the group is been creating with myself only)
   * @property {string|undefined} parentGroupId The ID of a parent community group to link the newly created group with (won't take an effect if the group is been creating with myself only)
   * @property {boolean} [autoSendInviteV4 = true] If true, the inviteV4 will be sent to those participants who have restricted others from being automatically added to groups, otherwise the inviteV4 won't be sent (true by default)
   * @property {string} [comment = ''] The comment to be added to an inviteV4 (empty string by default)
   */

  /**
   * Creates a new group
   * @param {string} title Group title
   * @param {string|Contact|Array<Contact|string>|undefined} participants A single Contact object or an ID as a string or an array of Contact objects or contact IDs to add to the group
   * @param {CreateGroupOptions} options An object that handles options for group creation
   * @returns {Promise<CreateGroupResult|string>} Object with resulting data or an error message as a string
   */
  async createGroup(title, participants = [], options = {}) {
    !Array.isArray(participants) && (participants = [participants]);
    participants.map((p) => (p instanceof Contact ? p.id._serialized : p));

    return await this.mPage.evaluate(
      async ({ title, participants, options }) => {
        const {
          messageTimer = 0,
          parentGroupId,
          autoSendInviteV4 = true,
          comment = "",
        } = options;
        const participantData = {},
          participantWids = [],
          failedParticipants = [];
        let createGroupResult, parentGroupWid;

        const addParticipantResultCodes = {
          default: "An unknown error occupied while adding a participant",
          200: "The participant was added successfully",
          403: "The participant can be added by sending private invitation only",
          404: "The phone number is not registered on WhatsApp",
        };

        for (const participant of participants) {
          const pWid = window.Store.WidFactory.createWid(participant);
          if ((await window.Store.QueryExist(pWid))?.wid)
            participantWids.push(pWid);
          else failedParticipants.push(participant);
        }

        parentGroupId &&
          (parentGroupWid = window.Store.WidFactory.createWid(parentGroupId));

        try {
          createGroupResult = await window.Store.GroupUtils.createGroup(
            title,
            participantWids,
            messageTimer,
            parentGroupWid
          );
        } catch (err) {
          return "CreateGroupError: An unknown error occupied while creating a group";
        }

        for (const participant of createGroupResult.participants) {
          let isInviteV4Sent = false;
          const participantId = participant.wid._serialized;
          const statusCode = participant.error ?? 200;

          if (autoSendInviteV4 && statusCode === 403) {
            window.Store.ContactCollection.gadd(participant.wid, {
              silent: true,
            });
            const addParticipantResult =
              await window.Store.GroupInviteV4.sendGroupInviteMessage(
                await window.Store.Chat.find(participant.wid),
                createGroupResult.wid._serialized,
                createGroupResult.subject,
                participant.invite_code,
                participant.invite_code_exp,
                comment,
                await window.WWebJS.getProfilePicThumbToBase64(
                  createGroupResult.wid
                )
              );
            isInviteV4Sent = window.compareWwebVersions(
              window.Debug.VERSION,
              "<",
              "2.2335.6"
            )
              ? addParticipantResult === "OK"
              : addParticipantResult.messageSendResult === "OK";
          }

          participantData[participantId] = {
            statusCode: statusCode,
            message:
              addParticipantResultCodes[statusCode] ||
              addParticipantResultCodes.default,
            isGroupCreator: participant.type === "superadmin",
            isInviteV4Sent: isInviteV4Sent,
          };
        }

        for (const f of failedParticipants) {
          participantData[f] = {
            statusCode: 404,
            message: addParticipantResultCodes[404],
            isGroupCreator: false,
            isInviteV4Sent: false,
          };
        }

        return {
          title: title,
          gid: createGroupResult.wid,
          participants: participantData,
        };
      },
      {
        title,
        participants,
        options
      }
    );
  }

  /**
   * Get all current Labels
   * @returns {Promise<Array<Label>>}
   */
  async getLabels() {
    const labels = await this.mPage.evaluate(async () => {
      return window.WWebJS.getLabels();
    });

    return labels.map((data) => new Label(this, data));
  }

  /**
   * Get Label instance by ID
   * @param {string} labelId
   * @returns {Promise<Label>}
   */
  async getLabelById(labelId) {
    const label = await this.mPage.evaluate(async (labelId) => {
      return window.WWebJS.getLabel(labelId);
    }, labelId);

    return new Label(this, label);
  }

  /**
   * Get all Labels assigned to a chat
   * @param {string} chatId
   * @returns {Promise<Array<Label>>}
   */
  async getChatLabels(chatId) {
    const labels = await this.mPage.evaluate(async (chatId) => {
      return window.WWebJS.getChatLabels(chatId);
    }, chatId);

    return labels.map((data) => new Label(this, data));
  }

  /**
   * Get all Chats for a specific Label
   * @param {string} labelId
   * @returns {Promise<Array<Chat>>}
   */
  async getChatsByLabelId(labelId) {
    const chatIds = await this.mPage.evaluate(async (labelId) => {
      const label = window.Store.Label.get(labelId);
      const labelItems = label.labelItemCollection.getModelsArray();
      return labelItems.reduce((result, item) => {
        if (item.parentType === "Chat") {
          result.push(item.parentId);
        }
        return result;
      }, []);
    }, labelId);

    return Promise.all(chatIds.map((id) => this.getChatById(id)));
  }

  /**
   * Gets all blocked contacts by host account
   * @returns {Promise<Array<Contact>>}
   */
  async getBlockedContacts() {
    const blockedContacts = await this.mPage.evaluate(() => {
      let chatIds = window.Store.Blocklist.getModelsArray().map(
        (a) => a.id._serialized
      );
      return Promise.all(chatIds.map((id) => window.WWebJS.getContact(id)));
    });

    return blockedContacts.map((contact) =>
      ContactFactory.create(this.client, contact)
    );
  }

  /**
   * Deletes the current user's profile picture.
   * @returns {Promise<boolean>} Returns true if the picture was properly deleted.
   */
  async deleteProfilePicture() {
    const success = await this.mPage.evaluate((chatid) => {
      return window.WWebJS.deletePicture(chatid);
    }, this.info.wid._serialized);

    return success;
  }

  /**
   * Change labels in chats
   * @param {Array<number|string>} labelIds
   * @param {Array<string>} chatIds
   * @returns {Promise<void>}
   */
  async addOrRemoveLabels(labelIds, chatIds) {
    return this.mPage.evaluate(
      async ({ labelIds, chatIds }) => {
        if (["smba", "smbi"].indexOf(window.Store.Conn.platform) === -1) {
          throw "[LT01] Only Whatsapp business";
        }
        const labels = window.WWebJS.getLabels().filter(
          (e) => labelIds.find((l) => l == e.id) !== undefined
        );
        const chats = window.Store.Chat.filter((e) =>
          chatIds.includes(e.id._serialized)
        );

        let actions = labels.map((label) => ({ id: label.id, type: "add" }));

        chats.forEach((chat) => {
          (chat.labels || []).forEach((n) => {
            if (!actions.find((e) => e.id == n)) {
              actions.push({ id: n, type: "remove" });
            }
          });
        });

        return await window.Store.Label.addOrRemoveLabels(actions, chats);
      },
      {
        labelIds,
        chatIds
      }
    );
  }

  /**
   * An object that handles the information about the group membership request
   * @typedef {Object} GroupMembershipRequest
   * @property {Object} id The wid of a user who requests to enter the group
   * @property {Object} addedBy The wid of a user who created that request
   * @property {Object|null} parentGroupId The wid of a community parent group to which the current group is linked
   * @property {string} requestMethod The method used to create the request: NonAdminAdd/InviteLink/LinkedGroupJoin
   * @property {number} t The timestamp the request was created at
   */

  /**
   * Gets an array of membership requests
   * @param {string} groupId The ID of a group to get membership requests for
   * @returns {Promise<Array<GroupMembershipRequest>>} An array of membership requests
   */
  async getRequestMembers(groupId) {
    return await this.mPage.evaluate(async (gropId) => {
      const groupWid = window.Store.WidFactory.createWid(gropId);
      return await window.Store.MembershipRequestUtils.getMembershipApprovalRequests(
        groupWid
      );
    }, groupId);
  }

  /**
   * An object that handles the result for membership request action
   * @typedef {Object} MembershipRequestActionResult
   * @property {string} requesterId User ID whos membership request was approved/rejected
   * @property {number|undefined} error An error code that occurred during the operation for the participant
   * @property {string} message A message with a result of membership request action
   */

  /**
   * An object that handles options for {@link approveGroupMembershipRequests} and {@link rejectGroupMembershipRequests} methods
   * @typedef {Object} MembershipRequestActionOptions
   * @property {Array<string>|string|null} requesterIds User ID/s who requested to join the group, if no value is provided, the method will search for all membership requests for that group
   * @property {Array<number>|number|null} sleep The number of milliseconds to wait before performing an operation for the next requester. If it is an array, a random sleep time between the sleep[0] and sleep[1] values will be added (the difference must be >=100 ms, otherwise, a random sleep time between sleep[1] and sleep[1] + 100 will be added). If sleep is a number, a sleep time equal to its value will be added. By default, sleep is an array with a value of [250, 500]
   */

  /**
   * Approves membership requests if any
   * @param {string} groupId The group ID to get the membership request for
   * @param {MembershipRequestActionOptions} options Options for performing a membership request action
   * @returns {Promise<Array<MembershipRequestActionResult>>} Returns an array of requester IDs whose membership requests were approved and an error for each requester, if any occurred during the operation. If there are no requests, an empty array will be returned
   */
  async approveMember(groupId, options = {}) {
    return await this.mPage.evaluate(
      async ({ groupId, options }) => {
        const { requesterIds = null, sleep = [250, 500] } = options;
        return await window.WWebJS.membershipRequestAction(
          groupId,
          "Approve",
          requesterIds,
          sleep
        );
      },
      {
        groupId,
        options
      }
    );
  }

  /**
   * Rejects membership requests if any
   * @param {string} groupId The group ID to get the membership request for
   * @param {MembershipRequestActionOptions} options Options for performing a membership request action
   * @returns {Promise<Array<MembershipRequestActionResult>>} Returns an array of requester IDs whose membership requests were rejected and an error for each requester, if any occurred during the operation. If there are no requests, an empty array will be returned
   */
  async rejectMember(groupId, options = {}) {
    return await this.mPage.evaluate(
      async ({ groupId, options }) => {
        const { requesterIds = null, sleep = [250, 500] } = options;
        return await window.WWebJS.membershipRequestAction(
          groupId,
          "Reject",
          requesterIds,
          sleep
        );
      },
      {
        groupId,
        options
      }
    );
  }

  /* new functiom by amirul dev */
  /**
       * get name whatsapp
       * @param {*} jid 
       * @returns 
       */
  async getName(jid) {
    const contact = await this.getContactById(jid);
    return (
      contact.name || contact.pushname || contact.shortName || contact.number
    );
  }

  /**
      * group metadata
      * @param {*} chatId 
      * @returns 
      */
  async groupMetadata(chatId) {
    let chat = await this.mPage.evaluate(async (chatId) => {
      let chatWid = await window.Store.WidFactory.createWid(chatId);
      let chat = await window.Store.GroupMetadata.find(chatWid);

      return chat.serialize();
    }, chatId);

    if (!chat) return false;
    return chat;
  }

  /**
      * download media message
      * @param {*} msg 
      * @returns 
      */
  async downloadMediaMessage(msg) {
    if (!Boolean(msg.mediaKey && msg.directPath))
      throw new Error("Not Media Message");

    const result = await this.mPage.evaluate(
      async ({
        directPath,
        encFilehash,
        filehash,
        mediaKey,
        type,
        mediaKeyTimestamp,
        mimetype,
        filename,
        size,
        _serialized,
      }) => {
        try {
          const decryptedMedia = await (
            window.Store.DownloadManager?.downloadAndMaybeDecrypt ||
            window.Store.DownloadManager?.downloadAndDecrypt
          )({
            directPath,
            encFilehash,
            filehash,
            mediaKey,
            mediaKeyTimestamp,
            type: type === "chat" ? mimetype.split("/")[0] || type : type,
            signal: new AbortController().signal,
          });

          const data = await window.WWebJS.arrayBufferToBase64(decryptedMedia);

          return {
            data,
            mimetype: mimetype,
            filename: filename,
            filesize: size,
          };
        } catch (e) {
          const blob = await window.WWebJS.chat.downloadMedia(_serialized);
          return {
            data: await window.WWebJS.util.blobToBase64(blob),
            mimetype: mimetype,
            filename: filename,
            filesize: size,
          };
        }
      }, {
      directPath: msg.directPath,
      encFilehash: msg.encFilehash,
      filehash: msg.filehash,
      mediaKey: msg.mediaKey,
      type: msg.type,
      mediaKeyTimestamp: msg.mediaKeyTimestamp,
      mimetype: msg.mime,
      filename: msg.filename,
      size: msg.fileSize,
      _serialized: msg.id._serialized,
    }
    );

    if (!result) return undefined;
    return Util.base64ToBuffer(result?.data);
  }

  /**
   * download media and save
   * @param {*} message 
   * @param {*} filename 
   * @returns 
   */
  async downloadAndSaveMedia(message, filename) {
    if (!message.isMedia) return;
    const buffer = await this.downloadMediaMessage(message);
    const getF = await Util.getFile(buffer)
    filename = filename ? filename : Util.getRandom(getF.ext)
    const folderPath = path.join(__dirname, "..", "..", "temp")
    if (!Fs.existsSync(folderPath)) {
      Fs.mkdirSync(folderPath);
      console.log('Folder "temp" created!!');
    }
    const filePath = path.join(__dirname, "..", "..", "temp", filename);
    return new Promise((resolve, reject) => {
      Fs.writeFile(filePath, buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(filePath);
        }
      });
    });
  }

  /**
   * save contact
   * @param {*} number 
   * @returns 
   */
  async isSaveContact(number) {
    let contact = await this.mPage.evaluate((number) => {
      return window.WWebJS.getContact(number);
    }, number);

    let res = ContactFactory.create(this, contact);
    return res.isMyContact;
  }

  /**
   * Sets the current user's profile picture.
   * @param {MessageMedia} media
   * @returns {Promise<boolean>} Returns true if the picture was properly updated.
   */
  async setProfilePict(chatId, content, type = 'normal') {
    let data
    if ((Buffer.isBuffer(content) || /^data:.*?\/.*?;base64,/i.test(content) || /^https?:\/\//.test(content) || fs.existsSync(content))) {
      let media = await Util.getFile(content)
      if (type === 'long') {
        data = {
          img: await (await Util.resizeImage(media?.data, 720)).toString('base64'),
          preview: await (await Util.resizeImage(media?.data, 120)).toString('base64')
        }
      } else if (type === 'normal') {
        data = {
          img: await (await Util.resizeImage(media?.data, 540)).toString('base64'),
          preview: await (await Util.resizeImage(media?.data, 86)).toString('base64')
        }
      }
    }

    return this.mPage.evaluate(async ({ chatId, preview, image, type }) => {
      let chatWid = await window.Store.WidFactory.createWid(chatId)

      if (type === 'delete') return window.Store.GroupUtils.requestDeletePicture(chatWid)

      return window.Store.GroupUtils.sendSetPicture(chatWid, image, preview)
    }, { chatId, preview: data.img, image: data.preview, type })
  }

  /**
      * get detail host
      * @returns 
      */
  getHost() {
    return this.mPage.evaluate(() => {
      return WPP.whatsapp.Conn.attributes;
    });
  }

  /**
   * setting theme dark or light
   * @param {*} type 
   * @returns 
   */
  async setTheme(type = "dark") {
    if (type !== "dark" && type !== "light") {
      return {
        status: false,
        message: 'Invalid option. Only "dark" or "light" are allowed',
      };
    }

    try {
      await this.mPage.evaluate(async (type) => {
        await window.extra.theme[0].setTheme(type);
      }, type);

      return {
        status: 200,
        message: `Successfully changed to ${type} mode`,
      };
    } catch (error) {
      return {
        status: false,
        message: "Can't change theme",
      };
    }
  }

  /**
   * get theme waweb
   * @returns 
   */
  async getTheme() {
    const theme = await this.mPage.evaluate(async () => {
      if (window.localStorage) {
        return await JSON.parse(JSON.stringify(window.localStorage))?.theme;
      } else {
        return await window.Store.Theme.getTheme();
      }
    });

    if (!theme) return false;
    return theme;
  }

  /**
   * join wa beta
   * @param {*} act 
   * @returns 
   */
  async joinBeta(act) {
    const res = await this.mPage.evaluate((act) => {
      return window.extra.joinBeta(act);
    }, act);
    if (act == true) {
      return `successfully entered beta mode`;
    } else if (act == false) {
      return `managed to get out of beta mode`;
    }
  }

  /**
   * send call
   * @param {*} chatId 
   * @param {*} options 
   * @returns 
   */
  async sendCall(chatId, options = {}) {
    if (!Array.isArray(chatId)) {
      chatId = [chatId];
    } else {
      chatId = chatId;
    }

    const call = await Promise.all(
      chatId.map(async (id) => {
        return await this.mPage.evaluate(
          ({
            id,
            options
          }) => {
            return window.WWebJS.call.offer(id, options);
          }, {
          id,
          options,
        }
        );
      })
    );

    return chatId.length;
  }

  /**
   * end calling
   * @param {*} chatId 
   * @returns 
   */
  async endCall(chatId) {
    const end = await this.mPage.evaluate((chatId) => {
      return window.WWebJS.call.end(chatId);
    }, chatId);

    if (!end) return false;
    return true;
  }

  /**
   * accept call
   * @param {*} chatId 
   * @returns 
   */
  async acceptCall(chatId) {
    const end = await this.mPage.evaluate((chatId) => {
      return window.WWebJS.call.accept(chatId);
    }, chatId);

    if (!end) return false;
    return true;
  }

  /**
   * send story text
   * @param {*} text 
   * @param {*} bg 
   * @param {*} fonts 
   * @returns 
   */
  async sendStoryText(text, bg, fonts) {
    if (!text) return "Input story text";
    if (!bg) return "Input background color (hex)";
    if (!fonts) return "Input style font (number)";
    try {
      const res = await this.mPage.evaluate(
        async ({
          text,
          bg,
          fonts
        }) => {
          return window.extra.status.text(text, {
            backgroundColor: bg,
            font: fonts,
          });
        }, {
        text,
        bg,
        fonts,
      }
      );
      return "Successfully sent status text to WhatsApp";
    } catch (error) {
      return "Failed to send status text to WhatsApp";
    }
  }

  /**
       * send file
       * @param {sen} chatId 
       * @param {*} pathOrBase64 
       * @param {*} nameOrOptions 
       */
  async sendFile(chatId, pathOrBase64, nameOrOptions) {
    if (typeof nameOrOptions === "string") {
      options.filename = nameOrOptions;
      nameOrOptions = {};
    }

    const fileContent = Util.getFile(pathOrBase64);
    var view = nameOrOptions.view ? true : false;
    var ptt = nameOrOptions.ptt ? true : false;
    let options = {
      type: nameOrOptions?.type ? nameOrOptions.type : "auto-detect",
      filename: nameOrOptions?.filename ? nameOrOptions.filename : "",
      mimetype: fileContent.mime,
      isViewOnce: view,
      isPtt: ptt,
    };

    const base64 = `data:${(await fileContent).mime};base64,${(
      await fileContent
    ).data.toString("base64")}`;

    if (!!nameOrOptions?.quoted) {
      options.quotedMsg =
        typeof nameOrOptions.quoted === "object" ?
          nameOrOptions.quoted.id._serialized :
          nameOrOptions.quoted || nameOrOptions.quoted._serialized;

      delete nameOrOptions.quoted;
    }

    if (nameOrOptions?.mentions) {
      options.mentionedJidList = Array.isArray(options.mentions) ?
        options.mentions.map((contact) =>
          contact?.id ? contact?.id?._serialized : contact
        ) : [];

      delete nameOrOptions.mentions;
    }

    options = {
      ...nameOrOptions,
      ...options,
    };

    const msg = await this.mPage.evaluate(
      async ({
        chatId,
        base64,
        options
      }) => {
        return WPP.chat.sendFileMessage(chatId, base64, options);
      }, {
      chatId,
      base64,
      options
    }
    );
  }

  /**
   * clear message
   * @param {*} chatId 
   * @returns 
   */
  async clearMessage(chatId) {
    return this.mPage.evaluate((chatId) => {
      return window.WWebJS.sendClearChat(chatId);
    }, chatId);
  }

  /**
   * send read status
   * @param {*} chatId 
   * @param {*} statusId 
   */
  async sendReadStatus(chatId, statusId) {
    await this.mPage.evaluate(
      async ({
        chatId,
        statusId
      }) => {
        const wid = window.Store.WidFactory.createWid(chatId);
        const statusStore = window.Store.StatusV3.get(wid);

        const status = statusStore?.msgs.get(statusId);
        await statusStore?.sendReadStatus(
          status,
          status?.mediaKeyTimestamp || status?.t
        );
      }, {
      chatId,
      statusId,
    }
    );
  }

  /**
   * get story
   * @param {*} chatId 
   * @returns 
   */
  async getStories(chatId = this.info.wid._serialized) {
    const message = await this.mPage.evaluate((chatId) => {
      if (chatId === "all") {
        const status = window.Store.StatusV3.getModelsArray();

        if (!status) return undefined;
        return status.map((a) => a.serialize());
      } else {
        const Wid = window.Store.WidFactory.createWid(chatId);
        const status = window.Store.StatusV3.get(Wid);

        if (!status) return new Error("No Status Found!");
        const msg = status.serialize();
        return [msg];
      }
    }, chatId);

    if (!message === undefined) return undefined;
    return message;
  }

  /**
   * get contact by name
   * @param {*} name 
   * @returns 
   */
  async getContactByName(name) {
    let contact = (await this.getContacts()).filter(
      (a) =>
        a.name && (a.name.toLowerCase().includes(name) || a.name.includes(name))
    );

    if (contact.length == 0) return null;
    return contact;
  }

  /**
      * clear all messages
      */
  async clearAllMsg() {
    function _0x178e() {
      const _0x59fc13 = ['4807125ZaiQmb', '80340jovByq', '923210mDLQBS', 'filter', '4942026OFdCiY', '8EDdczY', 'isGroup', '_serialized', 'groupMetadata', '2260726nUvkes', '476xxLSsp', 'clearMessage', '29343MVIOjf', 'map', 'length', 'getChats', '9078503wlTApE'];
      _0x178e = function () {
        return _0x59fc13;
      };
      return _0x178e();
    }
    const _0x2886d2 = _0xe390;
    (function (_0x1f8679, _0x57e58c) {
      const _0x42f211 = _0xe390,
        _0x566cfc = _0x1f8679();
      while (!![]) {
        try {
          const _0x275681 = parseInt(_0x42f211(0x139)) / 0x1 + -parseInt(_0x42f211(0x140)) / 0x2 + parseInt(_0x42f211(0x143)) / 0x3 * (parseInt(_0x42f211(0x141)) / 0x4) + -parseInt(_0x42f211(0x137)) / 0x5 + parseInt(_0x42f211(0x138)) / 0x6 + parseInt(_0x42f211(0x136)) / 0x7 * (parseInt(_0x42f211(0x13c)) / 0x8) + -parseInt(_0x42f211(0x13b)) / 0x9;
          if (_0x275681 === _0x57e58c) break;
          else _0x566cfc['push'](_0x566cfc['shift']());
        } catch (_0x1a8072) {
          _0x566cfc['push'](_0x566cfc['shift']());
        }
      }
    }(_0x178e, 0xb8b56));

    function _0xe390(_0x2c9b7f, _0xa8fc3c) {
      const _0x178e68 = _0x178e();
      return _0xe390 = function (_0xe3905d, _0x579f17) {
        _0xe3905d = _0xe3905d - 0x135;
        let _0x454ad9 = _0x178e68[_0xe3905d];
        return _0x454ad9;
      }, _0xe390(_0x2c9b7f, _0xa8fc3c);
    }
    const data = await this[_0x2886d2(0x135)](),
      groupSerializedArray = data[_0x2886d2(0x13a)](_0x17615e => _0x17615e[_0x2886d2(0x13d)])[_0x2886d2(0x144)](_0x3f97aa => _0x3f97aa[_0x2886d2(0x13f)]['id'][_0x2886d2(0x13e)]),
      privateSerializedArray = data[_0x2886d2(0x13a)](_0x14f289 => !_0x14f289[_0x2886d2(0x13d)])[_0x2886d2(0x144)](_0x1385d1 => _0x1385d1['id'][_0x2886d2(0x13e)]),
      allSerializedArray = [...groupSerializedArray, ...privateSerializedArray];
    for (let i = 0x0; i < allSerializedArray[_0x2886d2(0x145)]; i++) {
      const id = allSerializedArray[i];
      this[_0x2886d2(0x142)](id);
    }
  }

  /**
   * screenshot whatsapp
   * @returns 
   */
  async myPage() {
    await this.mPage.setViewportSize({
      width: 961,
      height: 2000
    })
    let media = await this.mPage.screenshot()
    let upload = await Util.upload(media)
    return upload.url
  }

  /**
   * screenshot custom site
   * @param {*} url 
   * @returns 
   */
  async screenPage(url) {
    function _0x4f70(_0x156778, _0x3e4092) {
      const _0x3cc1e5 = _0x3cc1();
      return _0x4f70 = function (_0x4f70b7, _0x2a78f8) {
        _0x4f70b7 = _0x4f70b7 - 0xcb;
        let _0x5ce2de = _0x3cc1e5[_0x4f70b7];
        return _0x5ce2de;
      }, _0x4f70(_0x156778, _0x3e4092);
    }
    const _0x20ef5e = _0x4f70;
    (function (_0x4ddcb3, _0x1186b6) {
      const _0x40925f = _0x4f70,
        _0x65b0ad = _0x4ddcb3();
      while (!![]) {
        try {
          const _0x282c38 = -parseInt(_0x40925f(0xd7)) / 0x1 * (-parseInt(_0x40925f(0xed)) / 0x2) + -parseInt(_0x40925f(0xeb)) / 0x3 * (-parseInt(_0x40925f(0xec)) / 0x4) + -parseInt(_0x40925f(0xcc)) / 0x5 * (-parseInt(_0x40925f(0xd1)) / 0x6) + -parseInt(_0x40925f(0xce)) / 0x7 * (-parseInt(_0x40925f(0xe8)) / 0x8) + -parseInt(_0x40925f(0xd5)) / 0x9 + parseInt(_0x40925f(0xd6)) / 0xa + -parseInt(_0x40925f(0xd4)) / 0xb;
          if (_0x282c38 === _0x1186b6) break;
          else _0x65b0ad['push'](_0x65b0ad['shift']());
        } catch (_0x508f08) {
          _0x65b0ad['push'](_0x65b0ad['shift']());
        }
      }
    }(_0x3cc1, 0xe77fb));
    if (!/https?:\/\//i['test'](url)) return _0x20ef5e(0xd2);
    const browsers = await playwright['chromium'][_0x20ef5e(0xe6)]({
      'headless': !![],
      'args': [_0x20ef5e(0xe7), _0x20ef5e(0xe1), _0x20ef5e(0xd9), _0x20ef5e(0xcd), _0x20ef5e(0xe4), _0x20ef5e(0xe9), _0x20ef5e(0xe5)]
    });
    try {
      const context = await browsers['newContext']({
        .../phone|hp/i['test'](url[_0x20ef5e(0xe3)]()) ? playwright[_0x20ef5e(0xdf)][_0x20ef5e(0xd8)] : playwright[_0x20ef5e(0xdf)][_0x20ef5e(0xea)],
        'bypassCSP': !![],
        'ignoreHTTPSErrors': !![],
        'colorScheme': _0x20ef5e(0xdc)
      }),
        pages = await context[_0x20ef5e(0xcb)]();
      await pages['goto'](Util[_0x20ef5e(0xe0)](url)[0x0], {
        'waitUntil': _0x20ef5e(0xe2),
        'timeout': 0x0
      }), /full/i[_0x20ef5e(0xcf)](url) ? await pages['waitForLoadState'](_0x20ef5e(0xe2)) : await pages[_0x20ef5e(0xda)]('load');
      let media = await pages[_0x20ef5e(0xde)]({
        'fullPage': /full/i[_0x20ef5e(0xcf)](url) ? !![] : ![],
        'type': _0x20ef5e(0xd3)
      }),
        upload = await Util[_0x20ef5e(0xdb)](media);
      return upload[_0x20ef5e(0xd0)];
      await browsers[_0x20ef5e(0xdd)]();
    } catch (_0x449e3e) {
      return _0x449e3e;
      await browsers[_0x20ef5e(0xdd)]();
    }

    function _0x3cc1() {
      const _0x24cabc = ['2919410SfFZqZ', '47JCTFSv', 'iPhone\x2013\x20Pro\x20Max', '--no-default-browser-check', 'waitForLoadState', 'upload', 'dark', 'close', 'screenshot', 'devices', 'isUrl', '--no-first-run', 'networkidle', 'toLowerCase', '--disable-accelerated-2d-canvas', '--start-maximied', 'launch', '--no-sandbox', '16pjwdOs', '--disable-session-crashed-bubble', 'Desktop\x20Chrome', '3935733dcUdcQ', '4kDSZiI', '80644ATgteP', 'newPage', '25OwRBXP', '--disable-setuid-sandbox', '4337683WuIQYr', 'test', 'url', '1431348eJQgVd', 'Please\x20start\x20with\x20http\x20or\x20https', 'png', '44575201hXGbcy', '8375436ufMYbO'];
      _0x3cc1 = function () {
        return _0x24cabc;
      };
      return _0x3cc1();
    }
  }


  async getUploadLimits(messageType) {
    const uploadLimit = await this.mPage.evaluate(async (messageType) => {
      return await window.WWebJS.getUploadLimits(messageType);
    }, messageType);

    return uploadLimit;
  }

  async forward(chatId, msgId, options = {}) {
    if (!msgId) throw new Error("No Input Message ID")
    if (!chatId) throw new Error("No Input Chat ID")

    await this.mPage.evaluate(async ({
      msgId,
      chatId
    }) => {
      return WPP.chat.forwardMessage(chatId, msgId)
    }, {
      msgId,
      chatId
    })
  }

  async createChannel(name, desc, pict) {
    await this.mPage.evaluate(({ name, desc, pict }) => {
      return WPP.newsletter.create(name, {
        description: desc,
        picture: pict
      })
    }, { name, desc, pict })
  }


  async parseMention(text) {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@c.us') || []
  }
  
  async scheduleCall(jid, title, type, time){
  return this.mPage.evaluate(({jid, title, type, time}) => {
    return WPP.chat.sendScheduledCallMessage(jid, {
 title: title,
 callType: type || 'audio',
 scheduledTimestampMs: time || 1696084222000
})
}, { jid, title, type, time })
}

  // end
}

module.exports = Client;
