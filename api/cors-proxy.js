// Custom CORS proxy server for the Employee Management API
// This server is used to proxy requests to the Employee Management API
// Currently not used as we are using direct serverless functions for the API
// but it can be used as a fallback if the direct serverless functions are not available

import { IncomingMessage } from "node:http";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "expect",
  "host",
]);

const isReadableStream = (value) => value instanceof IncomingMessage;

export const config = {
  api: {
    bodyParser: false,
  },
};

const normalizeParam = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const buildTargetUrl = (request) => {
  const queryParam = request.query && normalizeParam(request.query.url);
  const slug = request.query && request.query.slug;

  const candidate = queryParam
    ? queryParam
    : Array.isArray(slug)
    ? slug.join("/")
    : slug;

  if (!candidate) {
    return null;
  }

  const decoded = decodeURIComponent(candidate);
  if (!/^https?:\/\//i.test(decoded)) {
    return null;
  }

  return decoded;
};

const filterRequestHeaders = (headers = {}) => {
  const filtered = new Headers();

  Object.entries(headers).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    const headerName = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(headerName)) {
      return;
    }

    if (Array.isArray(value)) {
      filtered.set(headerName, value.join(","));
    } else {
      filtered.set(headerName, value);
    }
  });

  return filtered;
};

const writeResponseHeaders = (response, upstreamHeaders) => {
  upstreamHeaders.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      response.setHeader(key, value);
    }
  });

  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "*");
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
};

const handler = async (request, response) => {
  if (request.method === "OPTIONS") {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "*");
    response.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    response.status(204).end();
    return;
  }

  const targetUrl = buildTargetUrl(request);

  if (!targetUrl) {
    response.status(400).json({
      error:
        "Missing or invalid target URL. Use /api/cors-proxy/{encodedTargetUrl}.",
    });
    return;
  }

  const controller = new AbortController();
  request.on("close", () => controller.abort());

  const requestHeaders = filterRequestHeaders(request.headers);

  let requestBody;
  if (
    request.method &&
    !["GET", "HEAD"].includes(request.method.toUpperCase())
  ) {
    requestBody = isReadableStream(request) ? request : undefined;
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body: requestBody,
      redirect: "follow",
      signal: controller.signal,
    });

    writeResponseHeaders(response, upstreamResponse.headers);
    response.status(upstreamResponse.status);

    if (request.method && request.method.toUpperCase() === "HEAD") {
      response.end();
      return;
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    response.send(Buffer.from(arrayBuffer));
  } catch (error) {
    if (controller.signal.aborted) {
      response
        .status(499)
        .json({ error: "Client closed request before completion." });
      return;
    }

    console.error("CORS proxy error:", error);
    response.status(502).json({
      error: "Proxy request failed.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

export default handler;
