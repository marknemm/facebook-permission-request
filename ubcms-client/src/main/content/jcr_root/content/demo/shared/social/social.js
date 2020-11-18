'use strict';

(function($) {

    var noResultsMsg = "Whoops! There's nothing here";
    var errMsg = "Something's gone wrong!";

    /**
     * JQuery plugin function used to inject a social feed with a given configuration into a host jQuery element.
     * @param {any} config The social feed configuration. See social-config.js for possible/default values.
     * @return {jQuery} The host jQuery element.
     */
    $.fn.socialFeed = function(config) {

        var $host = this;
        config = tlwSocialConfig.fillMissingConfigs(config);
        loadSocialFeed();

        /**
         * Loads the (JSON) social feed from the Funnelback server.
         */
        function loadSocialFeed() {
            $.ajax({
                url: tlwSocialConfig.genSocialSearchUrl(config),
                type: 'GET',
                dataType: 'json',
                success: handleLoadSuccess,
                error: handleLoadFailure
            });
        }

        /**
         * Handles the successful load of social feed JSON.
         * @param {any} jsonResult The JSON result from the load social feed query.
         */
        function handleLoadSuccess(jsonResult) {
            (jsonResult.response.resultPacket && jsonResult.response.resultPacket.results && jsonResult.response.resultPacket.results.length > 0)
                ? initSocialResultsList(jsonResult.response.resultPacket.results)
                : displayNoResultsMessage();
        }

        /**
         * Initializes a social results list from a JSON social feed.
         * @param {any[]} socialFeedResultsJson The loaded JSON social feed.
         */
        function initSocialResultsList(socialFeedResultsJson) {
            var $socialResultList = $('.social-result-list-tmpl').initHtmlTmpl();
            var socialLoadTracker = new SocialLoadTracker(socialFeedResultsJson.length, removeLoadIndicator.bind(this, $socialResultList));

            setResultListMaxHeight($socialResultList);
            socialFeedResultsJson.forEach(function(resultJson) {
                var $socialResultTmpl = $socialResultList.find('.social-result-tmpl');
                var $socialResult = initSocialResult(resultJson, $socialResultTmpl, socialLoadTracker);
                $socialResultList.append($socialResult);
            });

            // Cleanup any uninitialized child templates.
            $socialResultList.find('.social-tmpl').remove();
            $host.append($socialResultList);

            // Ensure each Instagram post has been processed by Instagram's oembed processor (prevents a rare race condition).
            if (window.instgrm && window.instgrm.Embeds) {
                instgrm.Embeds.process();
            }
        }

        /**
         * Initializes a single social result from a given result JSON object.
         * @param {any} resultJson The result JSON object.
         * @param {jQuery} $socialResultTmpl The social result HTML template that is to be initialized.
         * @param {socialLoadTracker} socialLoadTracker Tracks the load status of the containing social feed.
         * @return The initialized social result jQuery element.
         */
        function initSocialResult(resultJson, $socialResultTmpl, socialLoadTracker) {
            var $socialResult = $socialResultTmpl.initHtmlTmpl();
            var isEvent = (resultJson.metaData.feedItemType === 'EVENT');
            $socialResult.addClass(resultJson.collection);
            $socialResult.addClass(isEvent ? 'event' : 'post');

            switch (resultJson.collection) {
                case 'social-facebook':     return initFacebookResult(resultJson, $socialResult, isEvent, socialLoadTracker);
                case 'social-instagram':    return $socialResult.initInstagramPost(resultJson, $socialResult, socialLoadTracker);
                case 'social-twitter':      return $socialResult.initTweet(resultJson, $socialResult, socialLoadTracker, config);
                default:                    throw new Error('Received a result from an unknown collection: ' + result.collection);
            }
        }

        /**
         * Initializes a Facebook result from a given result JSON object.
         * @param {any} resultJson The result JSON object.
         * @param {jQuery} $socialResult The generic social result container jQuery element.
         * @param {boolean} isEvent Whether or not the Facebook result is an event.
         * @param {socialLoadTracker} socialLoadTracker Tracks the load status of the containing social feed.
         * @return The initialized (Facebook) social result jQuery element.
         */
        function initFacebookResult(resultJson, $socialResult, isEvent, socialLoadTracker) {
            return (isEvent)
                ? $socialResult.initFacebookEvent(resultJson, config.apiHost, socialLoadTracker)
                : $socialResult.initFacebookPost(resultJson, $socialResult, socialLoadTracker);
        }

        /**
         * Removes the social load indicator from a given social result list.
         * @param {jQuery} $socialResultList The social result list jQuery element.
         */
        function removeLoadIndicator($socialResultList) {
            var $loadIndicator = $socialResultList.find('.social-load-indicator');
            $loadIndicator.remove();
        }

        /**
         * Displays a message signifying that the query for social feed items was successful, but there are no results.
         */
        function displayNoResultsMessage() {
            var $noResultsDiv = $(document.createElement('div'));
            $noResultsDiv.addClass('no-social-results');
            $noResultsDiv.text(noResultsMsg);
            $host.append($noResultsDiv);
        }

        /**
         * Sets the max height (CSS) for the social result list based off of the social feed config's maxHeight & mobileMaxHeight values.
         * If no config value(s) is present, then the result list will not have a max height.
         * @param {jQuery} $socialResultList The social result list jQuery element.
         */
        function setResultListMaxHeight($socialResultList) {
            var maxHeight = ($(window).width() <= 720)
            	? config.mobileMaxHeight
            	: config.maxHeight;
			if (maxHeight) {
				$socialResultList.css('max-height', maxHeight + 'px');
                $socialResultList.css('overflow-y', 'auto'); // NOTE: Not in CSS to prevent scrollbar from flashing in on load.
            }
        }

        /**
         * Handles the failure to load the Funnelback social (JSON) feed.
         * @param {any} xhr The xhr request that caused the error.
         * @param {string} textStatus The failure text status.
         * @param {Error} errorThrown The optional exception if one was thrown.
         */
        function handleLoadFailure(xhr, textStatus, errorThrown) {
            console.error(textStatus);
            if (errorThrown) {
                console.error(errorThrown);
            }

            // Show generic error message to the user.
            var $errResultFeed = $(document.createElement('div'));
            $errResultFeed.addClass('err-social-results');
            $errResultFeed.text(errMsg);
            $host.append($errResultFeed);
        }

        return $host; // Allow our JQuery plugin function to be chained.
    }

})(jQuery);
