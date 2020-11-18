'use strict';

(function($) {

    /**
     * Initializes a Facebook event result from a given result JSON object.
     * @param {any} resultJson The result JSON object.
     * @param {jQuery} $socialResult The generic social result container jQuery element.
     * @param {string} apiHost The Funnelback social search API host.
     * @param {SocialLoadTracker} socialLoadTracker Tracks the load status of the containing social feed.
     * @return {jQuery} The initialized (Facebook event) social result jQuery element.
     */
    $.fn.initFacebookEvent = function(resultJson, apiHost, socialLoadTracker) {

        var $host = this;
        var $facebookEvent = $('.facebook-event-tmpl').initHtmlTmpl();

        // Initialize all DOM children of Facebook event result.
        initPorfileImg();
        initAuthor();
        initPostDate();
        initTitleSummary();
        initDateTime();
        initLocation();
        initFullImg();

        $host.append($facebookEvent);
        socialLoadTracker.registerFacebookEventLoad();
        return $host; // Return host jQuery element so that calls are chainable.

        /**
         * Initializes the profile image child of a given Facebook event result jQuery element.
         */
        function initPorfileImg() {
            if (resultJson.metaData.postIconUrl) {
                var $profileImg = $facebookEvent.find('.profile-img-tmpl').initHtmlTmpl(HtmlTmplAction.Replace);

                var $anchor = $profileImg.find('a');
                var href = resultJson.metaData.authorId
                    ? 'https://www.facebook.com/' + resultJson.metaData.authorId
                    : apiHost + resultJson.clickTrackingUrl;
                $anchor.attr('href', href);

                var $img = $profileImg.find('img');
                $img.attr('data-src', resultJson.metaData.postIconUrl);
                if (resultJson.metaData.author) {
                    $img.attr('alt', 'Thumbnail image for event author: ' + resultJson.metaData.author);
                }
            }
        }

        /**
         * Initializes the author child of a given Facebook event result jQuery element.
         */
        function initAuthor() {
            if (resultJson.metaData.author) {
                var $author = $facebookEvent.find('.author-tmpl').initHtmlTmpl(HtmlTmplAction.Replace);
                var $authorAnchor = $author.append(document.createElement('a'));
                $authorAnchor.attr('href', apiHost + resultJson.clickTrackingUrl);
                $authorAnchor.attr('title', resultJson.liveUrl);
                $authorAnchor.text(resultJson.metaData.author);
            }
        }

        /**
         * Initializes the post date child of a given Facebook event result jQuery element.
         */
        function initPostDate() {
            if (resultJson.date) {
                var $postDate = $facebookEvent.find('.post-date-tmpl').initHtmlTmpl(HtmlTmplAction.Replace);
                var $anchor = $postDate.append(document.createElement('a'));
                $anchor.attr('href', apiHost + resultJson.clickTrackingUrl);
                $anchor.attr('title', resultJson.liveUrl);
                var postDateStr = new Date(resultJson.date).toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric' });
                $anchor.text(postDateStr);
            }
        }

        /**
         * Initializes the title & summary children of a given Facebook event result jQuery element.
         */
        function initTitleSummary() {
            if (resultJson.metaData.postLinkTitle || resultJson.metaData.c) {
                var $titleSummary = $facebookEvent.find('.title-summary-tmpl').initHtmlTmpl(HtmlTmplAction.Replace);
                initTitle($titleSummary);
                initSummary($titleSummary);
            }
        }

        function initTitle($titleSummary) {
            if (resultJson.metaData.postLinkTitle) {
                var $title = $titleSummary.find('.title-tmpl').initHtmlTmpl(HtmlTmplAction.Replace);
                $title.text(resultJson.metaData.postLinkTitle);
            }
        }

        function initSummary($titleSummary) {
            if (resultJson.metaData.c) {
                var $title = $titleSummary.find('.summary-tmpl').initHtmlTmpl(HtmlTmplAction.Replace);
                $title.text(resultJson.metaData.c);
            }
        }

        function initDateTime() {
            if (resultJson.metaData.d) {
                var eventDate = new Date(resultJson.metaData.d);
                var $dateTime = $facebookEvent.find('.date-time-tmpl').initHtmlTmpl(HtmlTmplAction.Replace);
                $dateTime.find('.date').text(
                    eventDate.toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
                );
                $dateTime.find('.start').text(toTimeStr(eventDate));
                initEndTime($dateTime);
            }
        }

        /**
         * Initializes the event end time.
         * @param $dateTime The containing jQuery date-time element.
         */
        function initEndTime($dateTime) {
            if (resultJson.metaData.eventEndTime) {
                var eventEndDate = new Date(resultJson.metaData.eventEndTime);
                var $endTime = $dateTime.find('.end-time-tmpl').initHtmlTmpl(HtmlTmplAction.Replace);
                $endTime.find('.end').text(toTimeStr(eventEndDate));
            }
        }

        /**
         * Converts a given event date to a formatted time string.
         * @param {Date} eventDate The event date to convert.
         * @return The formatted time string.
         */
        function toTimeStr(eventDate) {
            return eventDate.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        /**
         * Initializes the location child of a given Facebook event result jQuery element.
         */
        function initLocation() {
            if (resultJson.metaData.location) {
                var $location = $facebookEvent.find('.location-tmpl').initHtmlTmpl(HtmlTmplAction.Replace);
                var locationTxt = (resultJson.metaData.street)
                    ? addressToLocationTxt(resultJson.metaData)
                    : resultJson.metaData.location.split('|<')[0];
                $location.find('.location').text(locationTxt);
            }
        }

        /**
         * Parses address data within a given result JSON object into a location string.
         * @param metaData The resultJson metadata containing the address data.
         * @return The parsed location string.
         */
        function addressToLocationTxt(metaData) {
            var locationTxt = '';
            if (metaData.street) {
                locationTxt += metaData.street;
            }
            if (metaData.city || metaData.state) {
                locationTxt += ', ';
                if (metaData.city) {
                    locationTxt += metaData.city;
                }
                if (metaData.state) {
                    locationTxt += ' ' + metaData.state;
                }
            }
            if (metaData.postcode) {
                locationTxt += ', ' + metaData.postcode;
            }
            return locationTxt;
        }

        /**
         * Initializes the full image child of a given Facebook event result jQuery element.
         */
        function initFullImg() {
            if (resultJson.metaData.image) {
                var $fullImg = $facebookEvent.find('.full-img-tmpl').initHtmlTmpl(HtmlTmplAction.Replace);

                var $anchor = $fullImg.find('a');
                $anchor.attr('href', apiHost + resultJson.clickTrackingUrl);
                $anchor.attr('title', resultJson.liveUrl);

                var $img = $fullImg.find('img');
                $img.attr('data-src', resultJson.metaData.image);
            }
        }
    }

})(jQuery);
