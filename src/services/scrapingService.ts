import axios, { AxiosRequestConfig } from "axios";
import * as cheerio from "cheerio";

import { LinkTag, RefResponse } from "../models/index.js";

export async function scrapeUrl(
  url: string,
  signal?: AbortSignal
): Promise<RefResponse> {
  const axiosConfig: AxiosRequestConfig = {};
  if (signal) {
    axiosConfig.signal = signal;
  }

  const { data: html } = await axios.get<string>(url, axiosConfig);
  const $ = cheerio.load(html);

  let canonicalUrl = url;
  const canonicalTag = $('head link[rel="canonical"]');
  if (canonicalTag.length > 0) {
    const foundCanonical = canonicalTag.attr("href");
    if (foundCanonical) {
      canonicalUrl = foundCanonical;
    }
  }

  const linkTags: LinkTag[] = [];
  $("link").each((_, el) => {
    linkTags.push({
      rel: $(el).attr("rel"),
      href: $(el).attr("href"),
    });
  });

  return { canonicalUrl, linkTags };
}
