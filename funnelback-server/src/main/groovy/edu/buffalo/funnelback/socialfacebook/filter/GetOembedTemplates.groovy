package edu.buffalo.funnelback.socialfacebook.filter

import com.funnelback.filter.api.*
import com.funnelback.filter.api.documents.*
import com.funnelback.filter.api.filters.*
import com.google.common.collect.ListMultimap
import edu.buffalo.funnelback.socialfacebook.config.FacebookConfig
import groovy.json.JsonException
import groovy.json.JsonSlurper
import groovy.util.logging.Log4j2

/**
 * Responsible for retrieving oEmbed templates for posts gathered by the FacebookGather.groovy script.
 * For each post gathered, will run filterAsStringDocument, which will make a query to the Facebook Graph oEmbed endpoint:
 * https://graph.facebook.com/v9.0/oembed_post
 * 
 * These oEmbed templates are stored as metadata on the indexed Facebook post records. They will be queried by our ubcms-client
 * in order to display our posts to users who view our website.
 */
@Log4j2 // gather_executable.log
class GetOembedTemplates implements StringDocumentFilter {

  /* collection.cfg */
  final def config = new FacebookConfig()

  @Override
  PreFilterCheck canFilter(NoContentDocument noContentDocument, FilterContext context) {
    return PreFilterCheck.ATTEMPT_FILTER
  }

  @Override
  FilterResult filterAsStringDocument(StringDocument document, FilterContext context) throws RuntimeException, FilterException {
    def parser = new XmlParser()
    Node doc = parser.parseText(document.getContentAsString())
    try {
      Object oembedResult = queryOembedApi(doc, context)
      ListMultimap<String, String> metadata = genUpdatedMetadataFromOembed(document, oembedResult)
      return FilterResult.of(document.cloneWithMetadata(metadata))
    } catch (JsonException e) {
      // If we try to grab oEmbed data for post/event that has not been published (but is part of the feed), we may get a valid error.
      // We do not want the failure to grab one oEmbed entry to make entire crawl/index fail, so gracefully handle failure.
      log.error(e.toString())
      return FilterResult.delete()
    }
  }

  /**
   * Queries the Facebook oembed API for post display template.
   * @param doc The post (XML) document node.
   * @param context The filter context
   * @return The (JSON) result object from querying the Facebook oembed API.
   */
  private Object queryOembedApi(Node doc, FilterContext context) {
    String oembedPath = genOembedPath(doc)
    Object result = [] // Return empty object if we couldn't get oembed data.
    if (oembedPath) {
      // Omit script since we will include facebook script at beginning of body (provides noticable improvement to post load time).
      result = new JsonSlurper().parse(
        new URL("${config.oembedApiUrl}?url=https://www.facebook.com/${oembedPath}&access_token=${config.appAccessToken}&omitscript=true")
      )
      result["html"] = setPostDataWidthAuto((String)result["html"])
    }
    return result
  }

  /**
   * Generates the path to the oembed post resource.
   * @param doc The Facebook post document node.
   * @return The oembed post path.
   */
  private String genOembedPath(Node doc) {
    if (doc["id"][0]) {
      String[] pagePostIdArr = doc["id"][0].text().split("_")
      if (pagePostIdArr.size() == 2) {
        return "${pagePostIdArr[0]}/posts/${pagePostIdArr[1]}"
      }
    }
    return null
  }

  /**
   * Sets the post embed HTML's data-width attribute to 'auto' so that the template will be responsive.
   * @param The post embed HTML.
   * @return The updated post embed HTML with it's data-width attribute set to 'auto'.
   */
  private String setPostDataWidthAuto(String html) {
    if (html) {
      html = html.replaceAll(/data-width="\d+"/, "data-width=\"auto\"")
    }
    return html
  }

  /**
   * Generates (XML) document metadata mappings for a given post document. Merges the base metadata mappings with
   * results from the oembed API query.
   * @param document The post (XML) document to get the associated oembed data for.
   * @param oembedResult The oembed API query result.
   * @return The combined metadata mappings.
   */
  private ListMultimap<String, String> genUpdatedMetadataFromOembed(StringDocument document, Object oembedResult) {
    ListMultimap<String, String> metadata = document.getCopyOfMetadata()
    oembedResult.each { String resultKey, resultValue ->
      metadata.put(resultKey, resultValue.toString())
    }
    return metadata
  }
}
