const { BetaAnalyticsDataClient } = require("@google-analytics/data");
require("dotenv").config();

const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

//const analyticsDataClient = new BetaAnalyticsDataClient();
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GOOGLE_APPLICATION_CLIENT_EMAIL ?? "",
    private_key:
      process.env.GOOGLE_APPLICATION_PRIVATE_KEY.replace(/\\n/gm, "\n") ?? "",
  },
});

async function runReport() {
  const [res] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      {
        startDate: "7daysAgo",
        endDate: "today",
      },
    ],
    dimensions: [
      {
        name: "pagePath",
      },
    ],
    metrics: [
      {
        name: "screenPageViews",
      },
    ],
    limit: 5,
  });

  res.rows.forEach((row) => {
    console.log(row.dimensionValues[0], row.metricValues[0]);
  });

  //コンテンツIDのみを取得する
  const contentIds = res.rows
    .map((row) => row.dimensionValues[0].value.split("/")[2])
    .filter((v) => v);

  //microCMSへのPATCHリクエストを送信する
  const result = await fetch(
    `https://${process.env.SERVICE_DOMAIN}.microcms.io/api/v1/popular/wrcntwkpp`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY,
      },
      body: JSON.stringify({ articles: contentIds }),
    }
  );

  console.log(await result.json());
}

runReport();
