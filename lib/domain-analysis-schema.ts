import { z } from "zod"

export const domainAnalysisSchema = z.object({
  url: z
    .string()
    .describe(
      "The full URL that was analyzed (e.g., https://example.com). This should be the primary domain provided for analysis. Ensure this is a valid, complete URL string.",
    ),
  vertical: z
    .string()
    .max(100)
    .describe(
      "The primary business vertical of the website, concisely described (e.g., 'E-commerce Fashion Retail', 'SaaS Project Management'). Aim for 2-4 impactful words.",
    ),
  gmv: z
    .string()
    .describe(
      "A string representing ONLY the estimated annual Gross Merchandise Value (GMV) range, selected from a predefined list. Examples: '< $500K', '$500K - $1M', '$1M - $5M', '$5M - $10M', '$10M - $25M', '$25M - $50M', '$50M - $100M', '$100M+'. If GMV is not applicable, output 'N/A'.",
    ),
  products: z
    .string()
    .describe(
      "A summary of the main products or services offered, including typical price points, pricing tiers, or pricing strategy if observable (e.g., 'Sells handmade jewelry, prices $50-$300', 'Offers tiered subscription: Basic $10/mo, Pro $30/mo', 'Provides free educational content').",
    ),
  desc: z
    .string()
    .describe(
      "A short, compelling description (1-3 sentences) of the website's core business, value proposition, and target audience.",
    ),
})

export type DomainAnalysis = z.infer<typeof domainAnalysisSchema>
