package edu.buffalo.funnelback.socialfacebook.gather

import com.funnelback.common.io.store.RawBytesRecord
import com.funnelback.common.io.store.RawBytesStore
import com.funnelback.common.io.store.bytes.RawBytesStoreFactory
import com.google.common.collect.ArrayListMultimap
import com.google.common.collect.ListMultimap
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import groovy.util.logging.Log4j2
import edu.buffalo.funnelback.socialfacebook.config.FacebookConfig

/**
 * Main class for gathering Facebook posts from the University at Buffalo Facebook page via the following graph endpoint:
 * https://graph.facebook.com/v9.0/8447447859/posts
 *
 * Also gathers Facebook events from the University at Buffalo Facebook page via the following graph endpoint:
 * https://graph.facebook.com/v9.0/8447447859/events
 *
 * The post/event records gathered here are stored in our social-facebook search index. Also view our GetOembedTemplates.groovy
 * script to see how we additonally collect oEmbed templates for each post gathered here.
 */
@Log4j2
class FacebookGather {

  /** Collection config */
  final FacebookConfig config

  /** Store to save our records */
  final RawBytesStore store

  /**
   * @param searchHome Funnelback installation directory
   * @param collectionName Collection to gather
   */
  FacebookGather(File searchHome, String collectionName) {
    config = new FacebookConfig(searchHome, collectionName)
    store = new RawBytesStoreFactory(config)
            .withFilteringEnabled(true)
            .newStore()
  }

  /**
   * Gather all Facebook posts & events
   */
  void gather() {
    def stored = 0
    int maxFilesPerArea = config.maxFilesPerArea
    List<FeedRequestUrl> feedRequestUrls = genFeedRequestUrls()
    store.open()

    try {
      feedRequestUrls.eachWithIndex() { FeedRequestUrl feedRequestUrl, int idx ->
        log.info("Fetching Facebook feed items with url #{} ({})", idx, feedRequestUrl.url)
        stored += fetchAndStoreFeedItems(feedRequestUrl, maxFilesPerArea)
      }
    } catch (Exception exception) {
      log.error(exception.printStackTrace())
    } finally {
      store.close()
    }

    log.info("Stored {} Facebook feed items", stored)
  }

  /**
   * Generates feed request URLs. Will generate a POST and EVENT URL for each of the configured page IDs set in collection.cfg (facebook.page-ids).
   * Will use the facebook.post-fields & facebook.event-fields settings to generate the field query parameters for each URL.
   * @return A list of the feed request URLs. Each URL is wrapped in a FeedRequestUrl object, which also holds the type of the URL (POST/EVENT).
   * @throws IllegalStateException when the number of configured page IDs does not equal the number of configured page access tokens.
   */
  private List<FeedRequestUrl> genFeedRequestUrls() {
    List<FeedRequestUrl> feedRequestUrls = []
    [FeedItemType.POST, FeedItemType.EVENT].each { feedItemType ->
      // If we have more than one access token, then it is assumed that we are using page access tokens to access each individual page.
      // If we have one access token, then it is assumed that the access token is an app access token used for all pages.
      if (config.pageAccessTokens.size() > 1 && config.pageIds.size() != config.pageAccessTokens.size()) {
        throw new IllegalStateException("Number of page IDs {${config.pageIds.size()}} != number of page access tokens {${config.pageAccessTokens.size()}}")
      }

      String feedFields = (feedItemType == FeedItemType.POST) ? config.postFields : config.eventFields
      String resource = (feedItemType == FeedItemType.POST) ? "posts" : "events"
      if (feedFields) {
        config.pageIds.eachWithIndex() { String pageId, int i ->
          String feedRequestUrl = "${config.apiUrl}/${pageId}/${resource}?"
          // Either a page access token for each page, or one app access token for all pages.
          // Note that using a single app access token requires the app to have the 'Page Public Content Access' permission.
          String pageAccessToken = (config.pageAccessTokens.size() > i)
            ? config.pageAccessTokens.get(i)
            : config.pageAccessTokens.get(0)
          feedRequestUrl += "access_token=${pageAccessToken}&"
          feedRequestUrl += "fields=${feedFields}"
          feedRequestUrls.add(new FeedRequestUrl(feedRequestUrl, feedItemType))
        }
      }
    }
    return feedRequestUrls
  }

  /**
   * Fetches and stores all page feed items.
   * @param feedRequestUrl An object containing the page feed request URL for querying either POST or EVENT feed items on a page.
   * @param maxFilesPerArea The maximum number of items that may be stored for the given post or event feed.
   * @return The updated number of items that have been fetched and stored for the given post or event feed.
   */
  private int fetchAndStoreFeedItems(FeedRequestUrl feedRequestUrl, int maxFilesPerArea) {
    def storedSingleFeed = 0

    while (feedRequestUrl.url && storedSingleFeed < maxFilesPerArea) {
      def response = new JsonSlurper().parse(feedRequestUrl.url.toURL())

      // Loop over the retrieved feed items
      for (feedItem in response["data"]) {
        boolean shouldStore = processFeedItem(feedItem, feedRequestUrl.feedItemType)
        if (shouldStore) {
          addRecordToStore(feedItem, feedRequestUrl.feedItemType)
          if (++storedSingleFeed >= maxFilesPerArea) {
            break
          }
        }
      }

      // Get next page of feed items, may be null if there's no more feed items
      feedRequestUrl.url = response.paging ? response.paging.next : null
    }
    return storedSingleFeed
  }

  /**
   * Generates a record for a given feed item and adds it to the store.
   * @param feedItem The feed item to be added.
   * @param feedItemType The type of the feed item to be added.
   */
  private void addRecordToStore(Object feedItem, FeedItemType feedItemType) {
    RawBytesRecord record = genRecord(feedItem)
    ListMultimap recordMeta = ArrayListMultimap.create()
    recordMeta.put("Content-Type", "application/json")
    if (feedItemType == FeedItemType.POST && feedItem[config.postDateField]) {
      recordMeta.put("datetime", feedItem[config.postDateField])
    } else if (feedItemType == FeedItemType.EVENT && feedItem[config.eventDateField]) {
      recordMeta.put("datetime", feedItem[config.eventDateField])
    }

    store.add(record, recordMeta as ListMultimap<String, String>)
    log.info("Stored {}", feedItem[config.feedItemUrlField])
  }

  /**
   * Generates a RawBytesRecord that can be stored by Funnelback.
   * @param feedItem The Facebook page feed item data that shall be stored in the record.
   * @return The generated record.
   */
  private RawBytesRecord genRecord(Object feedItem) {
    String liveUrl = feedItem[config.feedItemUrlField]
    return new RawBytesRecord(
      JsonOutput.toJson(feedItem).getBytes("UTF-8"),
      liveUrl
    )
  }

  /**
   * Processes a given Facebook page feed item before it is stored.
   * @param feedItem The feed item to process (INTERNALLY MODIFIED).
   * @param feedItemType The type of the feed item (POST or EVENT).
   * @return true if the feed item should be stored, false if not.
   */
  private boolean processFeedItem(Object feedItem, FeedItemType feedItemType) {
    feedItem["feedItemType"] = (feedItemType == FeedItemType.POST) ? "POST" : "EVENT"
    return (feedItemType == FeedItemType.POST)
      ? processPost(feedItem)
      : processEvent(feedItem)
  }

  /**
   * Processes a given Facebook page post befor it is stored.
   * @param post The post to process (INTERNALLY MODIFIED).
   * @return true if the post should be stored, false if not.
   */
  private boolean processPost(Object post) {
    if (post["from"] && post["from"]["id"]) {
      post["authorIcon"] = "${config.apiUrl}/${post["from"]["id"]}/picture"
    }
    post[config.feedItemUrlField] = "https://www.facebook.com/${post["id"]}"
    // Exclude all posts that are from events.
    String postIcon = post["icon"]
    return !postIcon || postIcon.indexOf("event") < 0
  }

  /**
   * Processes a given Facebook page event before it is stored.
   * @param event The event to process (INTERNALLY MODIFIED).
   * @return true if the event should be stored, false if not.
   */
  private boolean processEvent(Object event) {
    if (event["owner"] && event["owner"]["id"]) {
      event["authorIcon"] = "${config.apiUrl}/${event["owner"]["id"]}/picture"
    }
    event[config.feedItemUrlField] = "https://www.facebook.com/${event["id"]}"
    return true
  }

  enum FeedItemType { POST, EVENT }

  /**
   * A container for a Facebook feed request URL.
   * Will house the generated URL and the feed item type that the URL shall query (POST or EVENT).
   */
  class FeedRequestUrl {

    String url
    FeedItemType feedItemType

    FeedRequestUrl(String url, FeedItemType feedItemType) {
      this.url = url
      this.feedItemType = feedItemType
    }
  }
}
