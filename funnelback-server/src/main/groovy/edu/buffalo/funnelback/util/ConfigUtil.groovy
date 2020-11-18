package edu.buffalo.funnelback.util

/**
 * Utility for global server configuration.
 */
class ConfigUtil {

  /**
   * Gets the search home directory file.
   * @return The search home directory file.
   */
  static File getSearchHomeDir() {
    return new File(searchHome)
  }

  /**
   * Gets the search home directory absolute path.
   * @return The search home directory path.
   */
  static String getSearchHome() {
    return (System.getenv("SEARCH_HOME"))
      ? System.getenv("SEARCH_HOME")      // Will be present in docker instance.
      : System.getProperty("user.dir")
        ? System.getProperty("user.dir")  // Used by unit tests run outside of docker instance.
        : "/opt/funnelback"               // Default installation directory.
  }
}
