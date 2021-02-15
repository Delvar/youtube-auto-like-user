// ==UserScript==
// @name         YouTube Auto Liker
// @namespace    MSG/Youtube
// @version      0.1
// @description  Quick hacky copy of YouTube Auto Liker after Google banned it from the app store.
// @author       Morgan Gilroy (quick hack), Austen Morgan (the real author)
// @homepageURL  https://github.com/austencm/youtube-auto-like
// @license         MIT
// @include         http*://*.youtube.com/*
// @include         http*://youtube.com/*
// @include         http*://*.youtu.be/*
// @include         http*://youtu.be/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    //import env from 'utils/env';
    const env = {};
    env.DEBUG = true;

    //import Liker from './content/liker';
    class Liker {
   /**
   * @param {Object} options Must have the option 'like_what', indicating
   *                         whether to like all videos or just subscribed
   */
        constructor(options) {
            this.options = options;

            this.init = this.init.bind(this);
            this.reset = this.reset.bind(this);
            this.attemptLike = this.attemptLike.bind(this);
        }

   /**
   * Clears data for another round of slick liking action
   */
        reset() {
            this.dom = {};
        }

   /**
   * Detects when like/dislike buttons have loaded (so we can press them)
   * @param  {Function} callback
   */
        waitForButtons(callback) {
            // Select buttons if we don't already have them stored
            this.dom.like = this.dom.like || document.querySelector('.like-button-renderer-like-button-unclicked');
            this.dom.dislike = this.dom.dislike || document.querySelector('.like-button-renderer-dislike-button-unclicked');

            // Make sure both buttons exist
            if (this.dom.like && this.dom.dislike) {
                callback();
            }
            // Otherwise wait a second and try again
            else {
                setTimeout(() => this.waitForButtons(callback), 1000);
            }
        }

   /**
   * Make sure we can & should like the video,
   * then clickity click the button
   */
        attemptLike() {
            this.waitForButtons(() => {
                /*
                If the video is already liked/disliked
                or the user isn't subscribed to this channel,
                then we shouldn't do anything.
                */
                if (this.isVideoRated() || (this.options.like_what === 'subscribed' && !this.isUserSubscribed())) {
                    return;
                }
                this.dom.like.click();

                /*
               Confirm the click registered.
               Sometimes the buttons load before the event
               handlers get attached and nothing happens.
               */
                if (!this.isVideoRated()) {
                    // Persistence pays off
                    setTimeout(this.attemptLike, 1000)
                }
            });
        }

   /**
   * @return {Boolean} True if the like or dislike button is active
   */
        isVideoRated() {
            return this.dom.like.classList.contains('hid') ||
                this.dom.dislike.classList.contains('hid')
        }

   /**
   * @return {Boolean} True if the user is subscribed to
   *                   the current video's channel
   */
        isUserSubscribed() {
            // Check if the subscribtion button is active
            return document.querySelector('.yt-uix-subscription-button').classList.contains('hover-enabled')
        }

        /**
   * Starts the liking magic.
   * The liker won't do anything unless this method is called.
   */
        init() {
            // console.log('initializing...')
            // Bail if we don't need to do anything
            // DEPRECATION: options.like_what = 'none' removed in 2.0.2. Replaced with options.disabled
            if (this.options.disabled || this.options.like_what === 'none') {
                return;
            }

            this.reset();

            if (this.options.like_when === 'timed') {
                const video = document.querySelector('.video-stream');
                const { duration } = video;

                const onVideoTimeUpdate = () => {
                    // console.log('timeupdate')
                    if (video.currentTime >= 2 * 60 || video.currentTime >= duration) {
                        this.attemptLike();
                        video.removeEventListener('timeupdate', onVideoTimeUpdate);
                    }
                }
                video.addEventListener('timeupdate', onVideoTimeUpdate);

                return;
            }

            this.attemptLike();
        }
    }




    //import MaterialLiker from './content/liker-material';
    const selectors = {
        iconLike: 'ytd-video-primary-info-renderer g path[d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"]',
        iconDislike: 'ytd-video-primary-info-renderer g path[d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"]',
        subscribeButton: 'ytd-watch-flexy ytd-subscribe-button-renderer > paper-button',
    };

    class MaterialLiker {
   /**
   * @param {Object} options
   */
        constructor({ options, log }) {
            this.options = options;
            this.log = log ? log : () => {};
            this.cache = {};

            this.init = this.init.bind(this);
            this.reset = this.reset.bind(this);
            this.attemptLike = this.attemptLike.bind(this);
        }

   /**
   * Just helpful for thisging at the moment
   */
        stop() {
            this.log('stopped');
            if (typeof this.onStop === 'function') {
                this.onStop();
            }
        }

   /**
   * Clears data for another round of slick liking action
   */
        reset() {
            this.cache = {};
        }

        /**
   * Detects when like/dislike buttons have loaded (so we can press them)
   * @param  {Function} callback
   */
        waitForButtons(callback) {
            const iconLike = document.querySelector(selectors.iconLike);
            const iconDislike = document.querySelector(selectors.iconDislike);

            // Make sure both icons exist
            if (iconLike && iconDislike) {
                // Find and store closest buttons
                this.cache.likeButton = iconLike.closest('yt-icon-button');
                this.cache.dislikeButton = iconDislike.closest('yt-icon-button');

                this.log('...buttons ready');
                callback();
            }
            // Otherwise wait a second and try again
            else {
                setTimeout(() => this.waitForButtons(callback), 1000);
            }
        }

   /**
   * Detects when the video player has loaded
   * @param  {Function} callback
   */
        waitForVideo(callback) {
            this.log('waiting for video...');

            this.video = document.querySelector('.video-stream');
            // Does the video exist?
            if (this.video) {
                this.log('...video ready');
                callback();
            }
            // Otherwise wait a second and try again
            else {
                setTimeout(() => this.waitForVideo(callback), 1000);
            }
        }

   /**
   * @return {Boolean} True if the like or dislike button is active
   */
        isVideoRated() {
            return (
                (
                    this.cache.likeButton.classList.contains('style-default-active') &&
                    !this.cache.likeButton.classList.contains('size-default')
                ) ||
                this.cache.dislikeButton.classList.contains('style-default-active')
            );
        }

   /**
   * @return {Boolean} True if the user is subscribed to
   *                   the current video's channel
   */
        isUserSubscribed() {
            // Select the sub button
            const subscribeButton = this.cache.subscribeButton || document.querySelector(selectors.subscribeButton);
            // Does the button exist?
            if (!subscribeButton) return false;
            // Is the button active?
            if (subscribeButton.hasAttribute('subscribed') || subscribeButton.classList.contains('subscribed')) {
                this.cache.subscribeButton = subscribeButton;
                return true;
            }
            // TODO: If not, let's reinitialize the Liker if the user subscribes
            // else if (this.options.like_what === 'subscribed') {
            //   subButton.addEventListener('click', e => {
            //     e.target.removeEventListener(e.type, arguments.callee);
            //     this.init();
            //   });
            // }
            return false;
        }

        isAdPlaying() {
            return this.video && ['ad-showing', 'ad-interrupting'].every(c => {
                return this.video.closest('.html5-video-player').classList.contains(c);
            });
        }

   /**
   * Make sure we can & should like the video,
   * then clickity click the button
   */
        attemptLike() {
            this.log('waiting for buttons...');

            this.waitForButtons(() => {
      /*
      If the video is already liked/disliked
      or the user isn't subscribed to this channel,
      then we don't need to do anything.
       */
                if (this.isVideoRated()) {
                    this.log('video already rated');
                    return this.stop();
                }
                if (this.options.like_what === 'subscribed' && !this.isUserSubscribed()) {
                    this.log('user not subscribed');
                    return this.stop();
                }

                this.cache.likeButton.click();
                this.log('like button clicked');
                this.stop();
            });
        }

   /**
   * Starts the liking magic.
   * The liker won't do anything unless this method is called.
   */
        init() {
            this.log('liker initialized');

            // Bail if we don't need to do anything
            // DEPRECATION: options.like_what = 'none' removed in 2.0.2. Replaced with options.disabled
            if (this.options.disabled || this.options.like_what === 'none') {
                this.log('liker is disabled');
                return this.stop();
            }
            // YouTube designates pages with a video as watch pages
            if (!document.querySelector('ytd-app[is-watch-page]')) {
                this.log('not a watch page');
                return this.stop();
            }

            this.reset();
            this.log('Options: ', this.options);

            switch (this.options.like_when) {
                case 'timed':
                    return this.waitForVideo(() => {
                        const { video } = this;
                        const onVideoTimeUpdate = e => {
                            if (this.isAdPlaying()) return;
                            // Are we 2 mins in or at the end of the video?
                            if (video.currentTime >= 2 * 60 || video.currentTime >= video.duration) {
                                this.attemptLike();
                                video.removeEventListener('timeupdate', onVideoTimeUpdate);
                            }
                        }
                        video.addEventListener('timeupdate', onVideoTimeUpdate);
                    });

                case 'percent':
                    return this.waitForVideo(() => {
                        const { video } = this;

                        const onVideoTimeUpdate = e => {
                            if (this.isAdPlaying()) return;
                            // Are we more than 50% through the video?
                            if (video.currentTime / video.duration >= 0.5) {
                                this.attemptLike();
                                video.removeEventListener('timeupdate', onVideoTimeUpdate);
                            }
                        }
                        video.addEventListener('timeupdate', onVideoTimeUpdate);
                    });

                default:
                    return this.attemptLike();
            }
        }
    }




    //import OptionManager from './utils/option-manager';
    class OptionManager {
        /**
   * @param  {Object} defaults
   */
        constructor(defaults) {
            this.defaults = defaults;
            this.get = this.get.bind(this);
        }

        /**
   * Retreive all options
   * @return {Promise} Contains options object on resolve
   */
        get() {
            return new Promise((resolve, reject) => {
                resolve(this.defaults);
                //chrome.storage.sync.get({ options: this.defaults }, items => resolve(items.options));
            });
        }

        /**
   * Set options
   * @param {Object} options Key-value pairs of options to set
   * @return {Promise}
   */
        set(options) {
            return new Promise((resolve, reject) => {
                resolve();
                //chrome.storage.sync.set({ options }, resolve);
            });
        }
    }

    //import Debug from './content/debug';
    class Debug {
        constructor() {
            this.messages = [];

            this.log = this.log.bind(this);
            this.save = this.save.bind(this);

            this.log(new Date().toDateString());
            this.log(navigator.userAgent);
        }

        log() {
            const message = Array.from(arguments).join(' ');
            this.messages.push(message);

            if (env.DEBUG) {
                console.log(`%c[DEBUG] %c${message}`, 'font-style: italic', '');
            }
        }

        save(options) {
            return new Promise((resolve, reject) => {
                //chrome.storage.sync.set({ log: this.messages.join('\n') }, resolve);
            });
        }
    }

    //import serialize from './utils/serialize';
    function serialize(obj) {
        return Object.keys(obj).map(k => `${encodeURIComponent(k)}: ${encodeURIComponent(obj[k])}`).join(encodeURI(','));
    }

    const debug = new Debug();

    // We need to know which version of YouTube we're dealing with
    // The material version has no ID on the body, hence this dumb check
    const IS_MATERIAL = !document.body.id;
    debug.log('YouTube variant:', IS_MATERIAL ? 'material' : 'classic');

    debug.log('navigated:', window.location.href);
    if (env.DEBUG) {
        ['yt-navigate', 'yt-navigate-finish', 'yt-page-data-updated'].forEach(eventType => {
            const appRoot = document.querySelector('ytd-app');
            appRoot && appRoot.addEventListener(eventType, e => {
                debug.log('event:', e.type);
                if (eventType === 'yt-navigate-finish') {
                    debug.log('navigated:', window.location.href);
                }
            });
        });
    }

    const init = () => {
        // Create an OptionManager
        const defaults = {
            like_what: 'subscribed',
            like_when: 'percent', //'instantly',
            disabled: false,
        };
        const optionManager = new OptionManager(defaults);

        // Fetch our options then fire things up
        debug.log('loading options...');

        optionManager.get().then(options => {
            debug.log('...options loaded', `(${serialize(options)})`);

            if (IS_MATERIAL) {
                const liker = new MaterialLiker({ options, log: debug.log });
                liker.onStop = debug.save;
                if (env.DEBUG) {
                    window.Liker = liker;
                }

                liker.init();

                /*
      We're hooking into YouTube's custom events to determine when the video changes.
       */
                document.querySelector('ytd-app').addEventListener('yt-page-data-updated', liker.init);
            }
            else {
                const liker = new Liker(options);
                /*
      Old YouTube is a bit clunkier.
      We need to initialize the liker immediately
      and also run it whenever the AJAX load finishes.
       */
                liker.init();
                window.addEventListener('spfdone', liker.init);
            }
        });
    }

    // For some reason Webpack bundles the imports in this file in wrong order
    // which causes issues when we try to use the OptionManager. This is a fix
    // until I can figure out why.
    setTimeout(init, 0);

})();