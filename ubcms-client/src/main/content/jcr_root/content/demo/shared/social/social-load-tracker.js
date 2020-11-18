'use strict';

/**
 * @class
 * Tracks the total load status of a containing social feed.
 * @param {number} totalFeedItemsCnt The total number of feed items that are expected to be loaded.
 * @param {Function} allLoadedCb A callback function that is invoked when all feed items have been loaded.
 */
function SocialLoadTracker(totalFeedItemsCnt, allLoadedCb) {

    /** Monitors the addition/removal of child nodes within a Facebook/Instagram feed item result. */
    var mutationObs = new MutationObserver(onMutation);
    /** Tracks the total number of feed items that have been fully loaded. */
    var loadedFeedItemsCnt = 0;

    /**
     * Gets the number of fully loaded feed items.
     * @return {number} The number of fully loaded feed items.
     */
    this.getLoadedFeedItemsCnt = function() {
        return loadedFeedItemsCnt;
    }

    /**
     * Gets the total number of feed items that should be loaded.
     * @return {number} The total number of feed items that are expected to load.
     */
    this.getTotalFeedItemsCnt = function() {
        return totalFeedItemsCnt;
    }

    /**
     * Listens for the completion of the loading of a given Facebook/Instagram post feed item.
     * @param {jQuery} $result The Facebook/Instagram feed item jQuery element that should be monitored for load completion.
     */
    this.listenForLoad = function($result) {
        mutationObs.observe($result.get(0), { childList: true, subtree: true });
    }

    /**
     * Registers a Facebook Event feed item as loaded.
     */
    this.registerFacebookEventLoad = function() {
        incrementLoadedFeedItems();
    }

    /**
     * Registers a Twitter feed item as loaded.
     */
    this.registerTwitterLoad = function() {
        incrementLoadedFeedItems();
    }

    /**
     * Handles child node add/remove mutations within the subtree of a Facebook or Instagram post result.
     * @param {MutationRecord[]} mutationsList The lists of child node add/remove mutations that have occured.
     */
    function onMutation(mutationsList) {
        mutationsList.forEach(function (mutation) {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
                var addedNode = mutation.addedNodes[i];
                if (addedNode.tagName === 'IFRAME') {
                    // Wait for iframe to load.
                    jQuery(addedNode).on('load', function() {
                        addTitleToInstagramIframe(addedNode);
                        incrementLoadedFeedItems();
                    });
                }
            }
        });
    }

    /**
     * Adds a title to a given Instagram iframe element if it lacks one.
     * @param {HTMLIFrameElement} iframe The iframe element.
     */
    function addTitleToInstagramIframe(iframe) {
        if (!iframe.title) {
            iframe.title = 'Instagram oEmbed Post';
        }
    }

    /**
     * Increments the number of loaded feed items, and invokes the 'allLoadedCb' if all have been loaded.
     */
    function incrementLoadedFeedItems() {
        if (++loadedFeedItemsCnt === totalFeedItemsCnt) {
            allLoadedCb();
        }
    }
}
