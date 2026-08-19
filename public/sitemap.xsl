<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9" exclude-result-prefixes="s">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html>
      <head>
        <title>XML Sitemap</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 1024px;
            margin: 0 auto;
            background: #ffffff;
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }
          h1 {
            font-size: 28px;
            margin-top: 0;
            color: #0f172a;
            font-weight: 700;
          }
          .info-box {
            border-left: 4px solid #3b82f6;
            background-color: #eff6ff;
            padding: 16px 20px;
            margin-bottom: 32px;
            border-radius: 4px 12px 12px 4px;
          }
          .info-box p {
            margin: 6px 0;
            font-size: 14px;
            color: #1e3a8a;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            text-align: left;
          }
          th {
            padding: 14px 16px;
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #cbd5e1;
          }
          td {
            padding: 14px 16px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
            word-break: break-all;
          }
          tr:hover td {
            background-color: #f8fafc;
          }
          a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
          }
          a:hover {
            text-decoration: underline;
            color: #1d4ed8;
          }
          .text-muted {
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <xsl:choose>
            <xsl:when test="s:sitemapindex">
              <h1>XML Sitemap Index</h1>
              <div class="info-box">
                <p>This is an XML Sitemap Index, meant for consumption by search engines.</p>
                <p>You can find more information about XML sitemaps on <a href="https://sitemaps.org" target="_blank">sitemaps.org</a>.</p>
                <p>This Sitemap Index file contains <strong><xsl:value-of select="count(s:sitemapindex/s:sitemap)"/></strong> sitemaps.</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Sitemap</th>
                    <th>Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="s:sitemapindex/s:sitemap">
                    <tr>
                      <td>
                        <a href="{s:loc}"><xsl:value-of select="s:loc"/></a>
                      </td>
                      <td class="text-muted">
                        <xsl:value-of select="s:lastmod"/>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:when>
            <xsl:otherwise>
              <h1>XML Sitemap</h1>
              <div class="info-box">
                <p>This is an XML Sitemap, meant for consumption by search engines.</p>
                <p>You can find more information about XML sitemaps on <a href="https://sitemaps.org" target="_blank">sitemaps.org</a>.</p>
                <p>This Sitemap contains <strong><xsl:value-of select="count(s:urlset/s:url)"/></strong> URLs.</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Change Frequency</th>
                    <th>Priority</th>
                    <th>Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="s:urlset/s:url">
                    <tr>
                      <td>
                        <a href="{s:loc}"><xsl:value-of select="s:loc"/></a>
                      </td>
                      <td>
                        <xsl:value-of select="s:changefrequency"/>
                      </td>
                      <td>
                        <xsl:value-of select="s:priority"/>
                      </td>
                      <td class="text-muted">
                        <xsl:value-of select="s:lastmod"/>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:otherwise>
          </xsl:choose>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
