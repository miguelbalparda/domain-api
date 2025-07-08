import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { perplexity } from "@ai-sdk/perplexity"
import { domainAnalysisSchema } from "@/lib/domain-analysis-schema"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const domain = searchParams.get("domain")

  if (!domain) {
    return NextResponse.json({ error: "Domain parameter is required" }, { status: 400 })
  }

  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/.*)?$/.test(domain.replace(/^https?:\/\//, ""))) {
    return NextResponse.json({ error: "Invalid domain format provided" }, { status: 400 })
  }

  const fullUrl = domain.startsWith("http://") || domain.startsWith("https://") ? domain : `https://${domain}`

  try {
    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey || apiKey.trim() === "") {
      console.error("PERPLEXITY_API_KEY is not set or is empty in the environment.")
      return NextResponse.json(
        { error: "Server configuration error: Perplexity API key is missing or empty." },
        { status: 500 },
      )
    }

    const prompt = `You are an expert business analyst. Your task is to analyze the website associated with the domain: ${domain} and provide a structured JSON output as described below.
The specific URL to focus your analysis on is: ${fullUrl}.

Your response MUST be a valid JSON object adhering to the provided schema.
For each field in the JSON, provide values of the correct type (string, number, etc.) as specified in the schema. String values should NOT include any markdown formatting or unescaped special characters. All strings must be properly JSON escaped.

Please provide the following information in the JSON object:

1.  **url**: Plain string. The exact URL that was analyzed: '${fullUrl}'.

2.  **vertical**: Plain string. Identify the primary business vertical. Be concise and impactful, using 2-4 words.

3.  **gmv**: For this field, you will act as an expert E-commerce Business Intelligence Analyst AI. Your sole purpose is to analyze the homepage of the given domain and determine its annual Gross Merchandise Value (GMV) by placing it into a predefined category.
    You must follow these steps meticulously in your internal reasoning:
    1.  **Initial Scan & Business Model Identification:**
        -   Access and parse the content of the provided URL (${fullUrl}).
        -   First, determine the business model. Classify it as one of: [D2C (Direct-to-Consumer), Marketplace, Subscription, Service-based, Info-product, B2C].
        -   Look for any explicit mentions of financial figures, customer counts, or order volumes.
    2.  **Product & Pricing Analysis:**
        -   Scan the homepage for an estimated number of products or SKUs. If not present, note it internally.
        -   Identify 3-5 representative products featured. Extract names and prices. Calculate an Average Product Price (APP). Note currency.
    3.  **Proxy Data Extraction:**
        -   **Social Proof:** Find customer numbers, community size, total items sold.
        -   **Review Data:** Look for total review counts.
        -   **Scale Indicators:** Note physical stores, team size, years in business, press/investors.
    4.  **Synthesis & GMV Range Selection:**
        -   Based on all gathered information, synthesize your findings.
        -   Select the single most appropriate annual GMV range from the **mandatory list** below.
            **Predefined GMV Ranges:**
            -   "< $500K"
            -   "$500K - $1M"
            -   "$1M - $5M"
            -   "$5M - $10M"
            -   "$10M - $25M"
            -   "$25M - $50M"
            -   "$50M - $100M"
            -   "$100M+"
    After performing this detailed analysis and selecting a range, the value for the 'gmv' field in the final JSON output MUST BE ONLY the selected GMV range string (e.g., "$1M - $5M"). Do NOT include confidence scores, reasoning, or any other text in this specific 'gmv' field's string value. If GMV is not applicable, the value should be 'N/A'.

4.  **products**: Plain string. Summarize key products/services, typical price points, pricing models, or observed pricing strategy.

5.  **desc**: Plain string. Write a brief (1-3 sentences) description of the website's core business, value proposition, and target audience.

6.  **country**: Plain string. Determine the two-letter ISO 3166-1 alpha-2 country code where the company is primarily based or headquartered (e.g., 'US' for United States, 'GB' for United Kingdom, 'DE' for Germany). If the primary country of operation is unclear or the company is truly global without a distinct headquarters for its main operations, use 'XX'.
`

    const { object: analysisResult } = await generateObject({
      model: perplexity("llama-3-sonar-large-32k-online"),
      schema: domainAnalysisSchema,
      prompt: prompt,
      temperature: 0.2,
    })

    return NextResponse.json([analysisResult])
  } catch (error) {
    console.error("Detailed error in /api/analyze-domain (Perplexity):", error)
    // ... (rest of the error handling remains the same) ...
    let errorMessage = "Failed to analyze domain due to an unexpected error."
    const errorDetailsForClient: Record<string, any> = { rawErrorType: String(typeof error) }

    if (error instanceof Error) {
      errorMessage = `An error occurred: ${error.message}`
      errorDetailsForClient.name = error.name
      errorDetailsForClient.message = error.message
      if ("cause" in error && error.cause) {
        errorDetailsForClient.cause = String(error.cause)
      }
      // @ts-ignore
      if (error.name === "AI_JSONParseError" || error.name === "AI_UnexpectedOutputError") {
        // @ts-ignore
        errorDetailsForClient.llmOutput = error.text
      }
    } else {
      try {
        errorMessage = `An unexpected issue occurred. Raw error: ${JSON.stringify(error)}`
      } catch (e) {
        errorMessage = `An unexpected and non-serializable issue occurred.`
      }
    }
    // @ts-ignore
    if (error && error.name === "AI_JSONParseError" && error.text) {
      // @ts-ignore
      errorDetailsForClient.llmOutputAttempt = error.text
    }

    return NextResponse.json(
      {
        error: "Error processing your request.",
        details: errorMessage,
        debugInfo: errorDetailsForClient,
      },
      { status: 500 },
    )
  }
}
