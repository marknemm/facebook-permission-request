'use strict';

// Twitter tweet widget initialization jQuery plugin.
(function($) {

    /**
     * Initializes a given host tweet jQuery element. If the Twitter oEmbed script has not completely loaded, then inits after load.
     * @param {any} resultJson The result JSON object.
     * @param {jQuery} $socialResult The generic social result container jQuery element.
     * @param {socialLoadTracker} socialLoadTracker Tracks the load status of the containing social feed.
     * @param {boolean} config The social feed configuration.
     * @return {jQuery} The initialized jQuery Tweet element.
     */
    $.fn.initTweet = function(resultJson, $socialResult, socialLoadTracker, config) {

        var $tweet = this;
        if (!resultJson.metaData.identifier) {
            throw new Error(resultJson.collection + ' result is missing (oEmbed) "identifier" metadata.');
        }

        var tweetId = resultJson.metaData.identifier;
        $socialResult.attr('data-tweet-id', 'tweet-' + tweetId);
        (window.twttr && window.twttr.widgets)
            ? initTweetOnReady()
            : $('#twitter-wjs').on('load', initTweetOnReady.bind(this));

        /**
         * Initializes a given tweet jQuery element.
         */
        function initTweetOnReady() {
            twttr.widgets.createTweet(tweetId, $tweet.get(0))
                .then(processTwitterWidget); // Let any error bubble up (no catch()).
        }

        /**
         * Processes a newly created twitter widget (auto-generated via twitter oEmbed).
         * @param {HTMLElement} twitterWidget The newly created twitter widget.
         */
        function processTwitterWidget(twitterWidget) {
            // Can be undefined if tweet was deleted and Funnelback recrawl/index did not happen yet.
            if (twitterWidget) {
                injectTweetStyles(twitterWidget);
                injectGoogleAnalytics(twitterWidget);
            }
            socialLoadTracker.registerTwitterLoad();
        }

        /**
         * Since Twitter oembed uses a shadow DOM, we cannot target elements with styles from the (global) light DOM.
         * However, we can access the shadow DOM since it is open. Therefore, we must add the pertainent stylesheets
         * for Twitter Tweets to each oembed widget's shadow DOM.
         * @param {HTMLElement} twitterWidget The Twitter oembed widget (which contains an open shadow DOM).
         */
        function injectTweetStyles(twitterWidget) {
            var stylesheet = document.createElement('link');
            stylesheet.rel = 'stylesheet';
            stylesheet.type = 'text/css';
            stylesheet.href = getHost() + '/content/demo/shared/prototypes/social/twitter-tweet.css';
            // Inject stylesheet into tweet's open Shadow DOM.
            $(twitterWidget.shadowRoot).append(stylesheet);
            if (config.slimTweets) {
				$(twitterWidget.shadowRoot).find('.Tweet-text').css('font-size', '12px');
            }
        }

        /**
         * We must inject Google Analytics script HTML into the Twitter oembed widget's shadow DOM.
         * The script declared in the (global) light DOM will not be able to access the elements here.
         * @param {HTMLElement} twitterWidget The Twitter oembed widget (which contains an open shadow DOM).
         */
        function injectGoogleAnalytics(twitterWidget) {
            var script = document.createElement('script');
            script.type = 'application/javascript';
            script.src = getHost() + '/content/demo/shared/prototypes/social/twitter-analytics.js';
            $(twitterWidget.shadowRoot).append(script);
        }

        /**
         * Gets the host upon which we can use to generate a URL with absolute path to a jcr resource.
         * @return The host string.
         */
        function getHost() {
            var port = (location.port ? ':' + location.port : '');
            return (location.protocol + '//' + location.hostname + port);
        }

        return $tweet;
    }

})(jQuery);
