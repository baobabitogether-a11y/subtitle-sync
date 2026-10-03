package com.ytviewer.app

import java.net.URI
import java.net.URLDecoder
import java.net.URLEncoder

/**
 * One immutable request snapshot. Never pair a signed URL with another request's headers.
 * Keep untouched query components encoded exactly as the player sent them.
 */
class TimedTextReplay(val url: String, headers: Map<String, String>) {
    val headers: Map<String, String> = headers.toMap()

    fun translatedUrl(targetLanguage: String): String {
        require(targetLanguage.isNotBlank()) { "A target language is required" }
        val uri = URI(url)
        val parts = uri.rawQuery.orEmpty().split("&")
        val sourceLanguage = parts.firstOrNull { key(it).equals("lang", true) }
            ?.substringAfter("=", "")?.let(::decode)
        val retained = parts.filterNot { key(it).equals("tlang", true) }.toMutableList()
        if (!sourceLanguage.equals(targetLanguage, ignoreCase = true)) {
            retained.add("tlang=" + URLEncoder.encode(targetLanguage, "UTF-8"))
        }
        return url.substringBefore("?").substringBefore("#") + "?" +
            retained.joinToString("&") + (uri.rawFragment?.let { "#$it" } ?: "")
    }

    fun matchesVideo(otherUrl: String): Boolean =
        isCaptionUrl(otherUrl) && queryValue(url, "v") != null &&
            queryValue(url, "v") == queryValue(otherUrl, "v")

    // Let OkHttp negotiate and decompress gzip. Forwarding WebView's br/gzip header
    // disables transparent decoding and can send compressed bytes to the caption parser.
    fun decodedRequestHeaders(): Map<String, String> =
        headers.filterKeys {
            !it.equals("accept-encoding", true) && !it.equals("content-length", true)
        }

    companion object {
        fun isCaptionUrl(url: String): Boolean = try {
            val uri = URI(url)
            uri.scheme == "https" &&
                (uri.host == "youtube.com" || uri.host?.endsWith(".youtube.com") == true) &&
                uri.path == "/api/timedtext"
        } catch (_: Exception) {
            false
        }

        fun isDefault(url: String): Boolean = queryValue(url, "tlang").isNullOrBlank()

        private fun queryValue(url: String, name: String): String? = try {
            URI(url).rawQuery?.split("&")?.firstOrNull { key(it).equals(name, true) }
                ?.substringAfter("=", "")?.let(::decode)
        } catch (_: Exception) {
            null
        }

        private fun key(part: String): String = decode(part.substringBefore("="))
        private fun decode(value: String): String = URLDecoder.decode(value, "UTF-8")
    }
}